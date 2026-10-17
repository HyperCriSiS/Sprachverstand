import { createServer } from "node:http";
import {
  existsSync,
  readFileSync,
  statSync
} from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { spawn, spawnSync } from "node:child_process";
import {fetchWebdriverResponse} from "./webdriver-response.mjs";
import {NavigationStartObserver} from "./navigation-start-observer.mjs";
import {saveNavigationFailureDiagnostic} from "./navigation-failure-diagnostics.mjs";
import {createSmokeProcessIo} from "./smoke-process-io.mjs";

const projectRoot = process.cwd();
const browserArgumentIndex = process.argv.indexOf("--browser");
const browser =
  browserArgumentIndex >= 0 ? process.argv[browserArgumentIndex + 1] : undefined;

if (browser !== "chromium" && browser !== "firefox") {
  throw new Error("--browser muss chromium oder firefox sein.");
}

const driverPort = Number(process.env.WEBDRIVER_PORT ??
  (browser === "chromium" ? 9515 : 4444));
if (!Number.isInteger(driverPort) || driverPort < 1 || driverPort > 65535) {
  throw new Error("WEBDRIVER_PORT muss eine gültige Portnummer sein.");
}
const driverBaseUrl = `http://127.0.0.1:${driverPort}`;
const fixturePath = path.join(
  projectRoot,
  "tests",
  "browser",
  "extension-smoke.html"
);
const extensionDirectory = path.join(projectRoot, "dist", browser);

function resolveExecutable(environmentName, executableName) {
  const configured = process.env[environmentName];
  if (configured) {
    if (existsSync(configured) && statSync(configured).isFile()) {
      return configured;
    }

    const configuredExecutable = path.join(configured, executableName);
    if (existsSync(configuredExecutable)) {
      return configuredExecutable;
    }
  }

  return executableName;
}

const driverExecutable =
  browser === "chromium"
    ? resolveExecutable("CHROMEWEBDRIVER", "chromedriver")
    : resolveExecutable("GECKOWEBDRIVER", "geckodriver");

function findCommand(...names) {
  for (const name of names) {
    const result = spawnSync("which", [name], { encoding: "utf8" });
    if (result.status === 0) {
      const executable = result.stdout.trim();
      if (executable) {
        return executable;
      }
    }
  }

  throw new Error(`Keines der Programme wurde gefunden: ${names.join(", ")}`);
}

const chromiumExecutable =
  browser === "chromium"
    ? process.env.CHROMIUM_BIN ?? findCommand("chromium", "chromium-browser")
    : undefined;

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function webdriverRequest(method, pathname, body) {
  const response = await fetchWebdriverResponse(`${driverBaseUrl}${pathname}`, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const payload = JSON.parse(response.text);

  if (!response.ok || payload?.value?.error) {
    throw new Error(
      `WebDriver ${method} ${pathname} fehlgeschlagen: ${JSON.stringify(payload)}`
    );
  }

  return payload;
}

async function waitForDriver(driverProcess, logs) {
  const deadline = Date.now() + 15_000;

  while (Date.now() < deadline) {
    if (driverStartError) {
      throw new Error(`WebDriver konnte nicht gestartet werden: ${driverStartError.message}\n${logs.join("")}`);
    }

    if (driverProcess.exitCode !== null) {
      throw new Error(
        `WebDriver wurde vorzeitig beendet.\n${logs.join("")}`
      );
    }

    try {
      const response = await fetchWebdriverResponse(`${driverBaseUrl}/status`, undefined, 2_000);
      if (response.ok) {
        return;
      }
    } catch {
      // Der Treiber startet noch.
    }

    await sleep(100);
  }

  throw new Error(`WebDriver wurde nicht rechtzeitig bereit.\n${logs.join("")}`);
}

function startFixtureServer() {
  const html = readFileSync(fixturePath);
  let navigationObserver;
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    if (url.pathname !== "/extension-smoke.html") {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Nicht gefunden");
      return;
    }

    if (navigationObserver) {
      navigationObserver.served();
      response.once("finish", () => navigationObserver.finished());
    }
    response.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store"
    });
    response.end(html);
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Testserver konnte keinen TCP-Port bestimmen."));
        return;
      }

      const url = `http://127.0.0.1:${address.port}/extension-smoke.html`;
      if (browser === "chromium" && process.env.SMOKE_NAVIGATION_DIAGNOSTICS === "1") {
        navigationObserver = new NavigationStartObserver(url);
      }
      resolve({
        server,
        url,
        navigationObserver
      });
    });
  });
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function createSession() {
  if (browser === "chromium") {
    return webdriverRequest("POST", "/session", {
      capabilities: {
        alwaysMatch: {
          browserName: "chrome",
          timeouts: {pageLoad: 30_000},
          "goog:chromeOptions": {
            binary: chromiumExecutable,
            args: [
              "--headless=new",
              "--no-sandbox",
              "--disable-dev-shm-usage",
              "--no-first-run",
              "--disable-default-apps",
              `--disable-extensions-except=${extensionDirectory}`,
              `--load-extension=${extensionDirectory}`
            ]
          }
        }
      }
    });
  }

  return webdriverRequest("POST", "/session", {
    capabilities: {
      alwaysMatch: {
        browserName: "firefox",
        timeouts: {pageLoad: 30_000},
        "moz:firefoxOptions": {
          ...(process.env.FIREFOX_BIN ? {binary: process.env.FIREFOX_BIN} : {}),
          args: ["-headless"]
        }
      }
    }
  });
}

function sessionIdFrom(response) {
  const sessionId = response?.value?.sessionId ?? response?.sessionId;
  if (typeof sessionId !== "string" || !sessionId) {
    throw new Error(`WebDriver lieferte keine Session-ID: ${JSON.stringify(response)}`);
  }
  return sessionId;
}

async function installFirefoxExtension(sessionId) {
  const temporaryDirectory = await mkdtemp(
    path.join(tmpdir(), "sprachverstand-firefox-smoke-")
  );
  const xpiPath = path.join(temporaryDirectory, "sprachverstand-firefox.xpi");

  try {
    const {cmd} = await import("web-ext");
    await cmd.build({sourceDir: extensionDirectory, artifactsDir: temporaryDirectory,
      filename: path.basename(xpiPath), overwriteDest: true}, {showReadyMessage: false});

    const addon = readFileSync(xpiPath).toString("base64");
    await webdriverRequest(
      "POST",
      `/session/${sessionId}/moz/addon/install`,
      { addon, temporary: true }
    );
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

async function readFixtureState(sessionId) {
  const response = await webdriverRequest(
    "POST",
    `/session/${sessionId}/execute/sync`,
    {
      script: `
        return {
          staticText: document.querySelector("#static-target")?.textContent,
          protectedCode: document.querySelector("#protected-code")?.textContent,
          protectedInput: document.querySelector("#protected-input")?.value,
          accessibleLabel: document.querySelector("#accessible-target")?.getAttribute("aria-label"),
          dynamicText: document.querySelector("#dynamic-target")?.textContent
        };
      `,
      args: []
    }
  );

  return response.value;
}

async function waitForExpectedState(sessionId) {
  const deadline = Date.now() + 15_000;
  let state;

  while (Date.now() < deadline) {
    state = await readFixtureState(sessionId);
    if (
      state?.staticText === "Nutzer" &&
      state?.accessibleLabel === "Nutzer" &&
      state?.dynamicText === "Nutzer"
    ) {
      break;
    }
    await sleep(100);
  }

  if (
    state?.staticText !== "Nutzer" ||
    state?.accessibleLabel !== "Nutzer" ||
    state?.dynamicText !== "Nutzer"
  ) {
    throw new Error(
      `Sprachverstand wurde im echten ${browser}-Browser nicht vollständig aktiv: ${JSON.stringify(state)}`
    );
  }

  if (state.protectedCode !== "Nutzer:innen") {
    throw new Error(
      `Geschützter Code wurde im ${browser}-Browser verändert: ${JSON.stringify(state)}`
    );
  }

  if (state.protectedInput !== "Nutzer:innen") {
    throw new Error(
      `Eingabefeld wurde im ${browser}-Browser verändert: ${JSON.stringify(state)}`
    );
  }

  return state;
}

async function pruefeSpaeteShadowRoot(sessionId) {
  const creation = await webdriverRequest(
    "POST",
    `/session/${sessionId}/execute/sync`,
    {
      script: `
        const host = document.querySelector("#late-shadow-host");
        if (!host || host.shadowRoot) {
          throw new Error("Vorhandener Shadow-Host fehlt oder ist nicht leer.");
        }
        const root = host.attachShadow({ mode: "open" });
        root.textContent = "Nutzer:innen";
        return root.textContent;
      `,
      args: []
    }
  );
  if (creation.value !== "Nutzer:innen") {
    throw new Error("Der ShadowRoot-Ausgangszustand war unerwartet.");
  }

  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const result = await webdriverRequest(
      "POST",
      `/session/${sessionId}/execute/sync`,
      {
        script: `return document.querySelector("#late-shadow-host")?.shadowRoot?.textContent;`,
        args: []
      }
    );
    if (result.value === "Nutzer") {
      return;
    }
    await sleep(125);
  }
  throw new Error(
    `Eine spät angehängte ShadowRoot wurde im echten ${browser}-Browser nicht korrigiert.`
  );
}

async function pruefeSpaeteVerschachtelteShadowRoot(sessionId) {
  await webdriverRequest("POST", `/session/${sessionId}/execute/sync`, {
    script: `
      const outer = document.querySelector("#late-shadow-host").shadowRoot;
      const host = document.createElement("section");
      host.id = "nested-shadow-host";
      outer.append(host);
      return true;
    `,
    args: []
  });
  // Let the observed outer tree finish processing its still-empty inner host.
  await sleep(250);
  await webdriverRequest("POST", `/session/${sessionId}/execute/sync`, {
    script: `
      const host = document.querySelector("#late-shadow-host").shadowRoot
        .querySelector("#nested-shadow-host");
      host.attachShadow({mode: "open"}).innerHTML =
        "<p>Nutzer:innen</p><code>Nutzer:innen</code>";
      return true;
    `,
    args: []
  });
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const result = await webdriverRequest("POST", `/session/${sessionId}/execute/sync`, {
      script: `
        const root = document.querySelector("#late-shadow-host").shadowRoot
          .querySelector("#nested-shadow-host").shadowRoot;
        return {text: root.querySelector("p").textContent,
          protectedText: root.querySelector("code").textContent};
      `,
      args: []
    });
    if (result.value?.protectedText !== "Nutzer:innen") {
      throw new Error(`Geschützter Code in verschachtelter ${browser}-ShadowRoot verändert.`);
    }
    if (result.value.text === "Nutzer") return;
    await sleep(125);
  }
  throw new Error(`Späte verschachtelte ShadowRoot im echten ${browser}-Browser nicht korrigiert.`);
}

async function pruefeEreignislosenDesignModeWechsel(sessionId) {
  const entered = await webdriverRequest(
    "POST",
    `/session/${sessionId}/execute/sync`,
    {
      script: `
        const element = document.querySelector("#static-target");
        if (!element || element.textContent !== "Nutzer") {
          throw new Error("Vor dem Editormodus muss der Text korrigiert sein.");
        }
        document.designMode = "on";
        element.dispatchEvent(new Event("beforeinput", { bubbles: true }));
        return { mode: document.designMode, text: element.textContent };
      `,
      args: []
    }
  );
  if (entered.value?.mode !== "on" ||
      entered.value?.text !== "Nutzer:innen") {
    throw new Error(
      `Originaltext vor Editoreingabe in ${browser} nicht restauriert: ${JSON.stringify(entered.value)}`
    );
  }

  // Erst die durch Restaurierung ausgelösten Mutationen abklingen lassen.
  await sleep(250);
  // Weder DOM noch Eingabeereignisse beim Verlassen des Editormodus auslösen.
  const exited = await webdriverRequest(
    "POST",
    `/session/${sessionId}/execute/sync`,
    {
      script: `
        document.designMode = "off";
        return document.designMode;
      `,
      args: []
    }
  );
  if (exited.value !== "off") {
    throw new Error(`designMode ließ sich in ${browser} nicht deaktivieren.`);
  }

  const deadline = Date.now() + 7_000;
  while (Date.now() < deadline) {
    const result = await webdriverRequest(
      "POST",
      `/session/${sessionId}/execute/sync`,
      {
        script: `return document.querySelector("#static-target")?.textContent;`,
        args: []
      }
    );
    if (result.value === "Nutzer") {
      return;
    }
    await sleep(125);
  }
  throw new Error(
    `designMode-Off ohne DOM-Ereignis wurde im echten ${browser}-Browser nicht erkannt.`
  );
}

async function stopDriver(driverProcess) {
  if (driverProcess.exitCode !== null) {
    return;
  }

  driverProcess.kill("SIGTERM");
  const exited = await Promise.race([
    new Promise((resolve) => driverProcess.once("exit", () => resolve(true))),
    sleep(2_000).then(() => false)
  ]);

  if (!exited && driverProcess.exitCode === null) {
    driverProcess.kill("SIGKILL");
  }
}

const driverLogs = [];
const driverArguments =
  browser === "chromium"
    ? [`--port=${driverPort}`]
    : ["--host", "127.0.0.1", "--port", String(driverPort)];
let driverStartError;
const driverProcess = spawn(driverExecutable, driverArguments, {
  stdio: ["ignore", "pipe", "pipe"]
});
driverProcess.on("error", (error) => {
  driverStartError = error;
  driverLogs.push(`${error.stack ?? error.message}\n`);
});
driverProcess.stdout.on("data", (chunk) => driverLogs.push(chunk.toString()));
driverProcess.stderr.on("data", (chunk) => driverLogs.push(chunk.toString()));

async function pruefeGrosseInlineRanges(sessionId) {
  const execute = async script => (await webdriverRequest("POST",
    `/session/${sessionId}/execute/sync`, {script, args: []})).value;
  await execute(`
    const paragraph = document.createElement("p");
    const cases = [
      ["Hallo Nutzer:innen und Freunde.", "Hallo Nutzer und Freunde.", "Freunde"],
      ["Nutzer:innen und Lehrer:innen heute.", "Nutzer und Lehrer heute.", "und"],
      ["Nutzer:innen\\u00a0und Lehrer:innen", "Nutzer\\u00a0und Lehrer", "und"]
    ];
    window.__inlineRangeSmoke = cases.map(([original, transformed, selected]) => {
      const span = document.createElement("span");
      const text = document.createTextNode(original);
      span.append(text); paragraph.append(span);
      const range = document.createRange();
      const begin = original.indexOf(selected);
      range.setStart(text, begin); range.setEnd(text, begin + selected.length);
      return {span, text, range, original, transformed, selected};
    });
    for (let index = cases.length; index < 128; index++) {
      const span = document.createElement("span");
      span.textContent = "neutral "; paragraph.append(span);
    }
    document.body.append(paragraph);
  `);
  const read = `return window.__inlineRangeSmoke.map(entry => ({
    text: entry.text.data, original: entry.original, transformed: entry.transformed,
    selected: entry.range.toString(), expectedSelection: entry.selected,
    startOriginal: entry.range.startContainer === entry.text,
    endOriginal: entry.range.endContainer === entry.text,
    identity: entry.span.firstChild === entry.text,
    childNodes: entry.span.childNodes.length
  }));`;
  const verify = (rows, restored) => Array.isArray(rows) && rows.length === 3 &&
    rows.every(row => row.text === (restored ? row.original : row.transformed) &&
      row.selected === row.expectedSelection && row.startOriginal && row.endOriginal &&
      row.identity && row.childNodes === 1);
  const deadline = Date.now() + 10_000;
  let rows;
  do {
    rows = await execute(read);
    if (verify(rows, false)) break;
    await sleep(100);
  } while (Date.now() < deadline);
  if (!verify(rows, false)) throw new Error(
    `Inline-Ranges nach Korrektur in ${browser} verändert: ${JSON.stringify(rows)}`);
  await execute(`document.designMode = "on";
    document.body.dispatchEvent(new Event("beforeinput", {bubbles: true}));`);
  rows = await execute(read);
  if (!verify(rows, true)) throw new Error(
    `Inline-Ranges nach Restore in ${browser} verändert: ${JSON.stringify(rows)}`);
  await execute(`document.designMode = "off";`);
  console.log(`Native Inline-Ranges und Restore erfolgreich: ${browser}`);
}

async function pruefeGrossenEinzeltext(sessionId) {
  const execute = async script => (await webdriverRequest("POST",
    `/session/${sessionId}/execute/sync`, {script, args: []})).value;
  await execute(`
    const original = "Nutzer:innen und ".repeat(5000);
    const paragraph = document.createElement("p"), text = document.createTextNode(original);
    paragraph.append(text);
    const ranges = [original.indexOf("und"), original.indexOf("und", original.length / 2),
      original.lastIndexOf("und")].map(offset => {
      const range = document.createRange(); range.setStart(text, offset); range.setEnd(text, offset + 3);
      return range;
    });
    const cross = document.createRange(); cross.setStart(text, original.indexOf("und"));
    cross.setEnd(text, original.indexOf("und", original.indexOf("und") + 3) + 3);
    window.__largeTextSmoke = {original, paragraph, text, ranges, cross};
    document.body.append(paragraph);
  `);
  const read = restored => `const state = window.__largeTextSmoke; return {
    correct: state.text.data === (${restored ? "state.original" : '"Nutzer und ".repeat(5000)'}),
    identity: state.paragraph.firstChild === state.text,
    childNodes: state.paragraph.childNodes.length,
    cross: state.cross.toString(),
    ranges: state.ranges.map(range => ({text: range.toString(),
      identity: range.startContainer === state.text && range.endContainer === state.text}))
  };`;
  for (const restored of [false, true]) {
    if (restored) await execute(`
      const state = window.__largeTextSmoke;
      state.paragraph.remove();
      // Removing a subtree relocates existing Ranges by DOM contract. Create
      // fresh cached-node Ranges after removal, before automatic restoration.
      const current = state.text.data;
      state.ranges = [current.indexOf("und"), current.indexOf("und", current.length / 2),
        current.lastIndexOf("und")].map(offset => {
        const range = document.createRange(); range.setStart(state.text, offset);
        range.setEnd(state.text, offset + 3); return range;
      });
      state.cross.setStart(state.text, current.indexOf("und"));
      state.cross.setEnd(state.text, current.indexOf("und", current.indexOf("und") + 3) + 3);
    `);
    const deadline = Date.now() + 20_000;
    let state;
    const valid = () => state?.correct && state.identity && state.childNodes === 1 &&
      state.cross === (restored ? "und Nutzer:innen und" : "und Nutzer und") &&
      state.ranges.length === 3 && state.ranges.every(range => range.text === "und" && range.identity);
    do {
      state = await execute(read(restored));
      if (valid()) break;
      await sleep(50);
    } while (Date.now() < deadline);
    if (!valid()) throw new Error(`Großer Einzeltext/Range-Restore in ${browser} (restored=${restored}): ${JSON.stringify(state)}`);
  }
  console.log(`Nativer großer Einzeltext mit vier Ranges und Restore erfolgreich: ${browser}`);
}

const processIo = createSmokeProcessIo({
  enabled: browser === "chromium" && process.platform === "linux" && process.env.GITHUB_ACTIONS === "true" && process.env.SMOKE_PROCESS_IO === "1",
  outputDirectory: path.join(projectRoot, "artifacts/browser-smoke-navigation"),
  unavailable: () => console.error("Process I/O diagnostic unavailable; original result is preserved.")
});

let fixtureServer;
let sessionId;

try {
  await waitForDriver(driverProcess, driverLogs);
  const fixture = await startFixtureServer();
  fixtureServer = fixture.server;

  await processIo.start(driverProcess.pid);
  const sessionResponse = await processIo.measure("session", createSession);
  sessionId = sessionIdFrom(sessionResponse);

  if (browser === "firefox") {
    await installFirefoxExtension(sessionId);
  }

  const navigationStartedAt = performance.now();
  try {
    await processIo.measure("navigation", () => webdriverRequest("POST", `/session/${sessionId}/url`, {url: fixture.url}));
  } catch (error) {
    if (fixture.navigationObserver) {
      try {
        const capabilities = sessionResponse.value?.capabilities ?? sessionResponse.capabilities;
        await saveNavigationFailureDiagnostic({
          debuggerAddress: capabilities?.["goog:chromeOptions"]?.debuggerAddress,
          browserVersion: capabilities?.browserVersion,
          pageLoadLimitMs: capabilities?.timeouts?.pageLoad,
          observer: fixture.navigationObserver,
          error,
          navigationStartedAt,
          outputDirectory: path.join(projectRoot, "artifacts/browser-smoke-navigation")
        });
      } catch {
        console.error("Navigation diagnostic unavailable; original failure is preserved.");
      }
    }
    throw error;
  }

  const state = await waitForExpectedState(sessionId);
  await pruefeSpaeteShadowRoot(sessionId);
  await pruefeSpaeteVerschachtelteShadowRoot(sessionId);
  await pruefeEreignislosenDesignModeWechsel(sessionId);
  await pruefeGrosseInlineRanges(sessionId);
  await pruefeGrossenEinzeltext(sessionId);
  console.log(
    `Echter Browser-Smoke-Test erfolgreich: ${browser} ${JSON.stringify(state)}`
  );
} finally {
  await processIo.close();
  if (sessionId) {
    try {
      await webdriverRequest("DELETE", `/session/${sessionId}`);
    } catch (error) {
      console.error(String(error));
    }
  }

  if (fixtureServer) {
    await closeServer(fixtureServer);
  }

  await stopDriver(driverProcess);
}
