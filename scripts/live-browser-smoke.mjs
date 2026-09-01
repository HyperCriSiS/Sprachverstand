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

const projectRoot = process.cwd();
const browserArgumentIndex = process.argv.indexOf("--browser");
const browser =
  browserArgumentIndex >= 0 ? process.argv[browserArgumentIndex + 1] : undefined;

if (browser !== "chromium" && browser !== "firefox") {
  throw new Error("--browser muss chromium oder firefox sein.");
}

const driverPort = browser === "chromium" ? 9515 : 4444;
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
  const response = await fetch(`${driverBaseUrl}${pathname}`, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const payload = await response.json();

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
      const response = await fetch(`${driverBaseUrl}/status`);
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
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    if (url.pathname !== "/extension-smoke.html") {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Nicht gefunden");
      return;
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

      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/extension-smoke.html`
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
        "moz:firefoxOptions": {
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
    const zip = spawnSync("zip", ["-qr", xpiPath, "."], {
      cwd: extensionDirectory,
      encoding: "utf8"
    });
    if (zip.status !== 0) {
      throw new Error(
        `Firefox-Test-XPI konnte nicht erstellt werden: ${zip.stderr || zip.stdout}`
      );
    }

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

let fixtureServer;
let sessionId;

try {
  await waitForDriver(driverProcess, driverLogs);
  const fixture = await startFixtureServer();
  fixtureServer = fixture.server;

  const sessionResponse = await createSession();
  sessionId = sessionIdFrom(sessionResponse);

  if (browser === "firefox") {
    await installFirefoxExtension(sessionId);
  }

  await webdriverRequest("POST", `/session/${sessionId}/url`, {
    url: fixture.url
  });

  const state = await waitForExpectedState(sessionId);
  console.log(
    `Echter Browser-Smoke-Test erfolgreich: ${browser} ${JSON.stringify(state)}`
  );
} finally {
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
