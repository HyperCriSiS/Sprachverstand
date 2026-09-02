import { existsSync, readFileSync, statSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { release as osRelease } from "node:os";
import path from "node:path";
import process from "node:process";
import { spawn, spawnSync } from "node:child_process";

const projectRoot = process.cwd();
const configPath = path.join(projectRoot, "config", "real-world-sites.json");
const extensionDirectory = path.join(projectRoot, "dist", "chromium");
const driverPort = 9515;
const driverBaseUrl = `http://127.0.0.1:${driverPort}`;

function argumentValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index < 0) {
    return fallback;
  }
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} benötigt einen Wert.`);
  }
  return value;
}

function positiveIntegerArgument(name, fallback) {
  const raw = argumentValue(name, String(fallback));
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} muss eine positive Ganzzahl sein.`);
  }
  return value;
}

const listOnly = process.argv.includes("--list");
const observationMs = positiveIntegerArgument("--observation-ms", 3_500);
const navigationTimeoutMs = positiveIntegerArgument(
  "--navigation-timeout-ms",
  45_000
);
const outputPath = path.resolve(
  projectRoot,
  argumentValue("--output", "artifacts/real-world/report.json")
);
const screenshotDirectory = path.resolve(
  projectRoot,
  argumentValue(
    "--screenshots",
    path.join(path.dirname(outputPath), "screenshots")
  )
);
const selectedSites = argumentValue("--site", "")
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean);

function loadSites() {
  const sites = JSON.parse(readFileSync(configPath, "utf8"));
  if (!Array.isArray(sites) || sites.length === 0) {
    throw new Error("Die Real-World-Konfiguration enthält keine Seiten.");
  }

  const ids = new Set();
  const slugs = new Set();
  const urls = new Set();

  for (const site of sites) {
    if (
      !site ||
      typeof site !== "object" ||
      !Number.isInteger(site.id) ||
      typeof site.slug !== "string" ||
      !/^[a-z0-9-]+$/u.test(site.slug) ||
      typeof site.url !== "string" ||
      !site.url.startsWith("https://") ||
      typeof site.focus !== "string" ||
      !site.focus.trim()
    ) {
      throw new Error(
        `Ungültiger Eintrag in ${configPath}: ${JSON.stringify(site)}`
      );
    }

    if (ids.has(site.id) || slugs.has(site.slug) || urls.has(site.url)) {
      throw new Error(`Doppelter Real-World-Eintrag: ${JSON.stringify(site)}`);
    }

    ids.add(site.id);
    slugs.add(site.slug);
    urls.add(site.url);
  }

  return sites;
}

const configuredSites = loadSites();
const sites =
  selectedSites.length === 0
    ? configuredSites
    : configuredSites.filter(
        (site) =>
          selectedSites.includes(site.slug) ||
          selectedSites.includes(String(site.id))
      );

if (selectedSites.length > 0 && sites.length !== selectedSites.length) {
  const matched = new Set(
    sites.flatMap((site) => [site.slug, String(site.id)])
  );
  const missing = selectedSites.filter((entry) => !matched.has(entry));
  throw new Error(`Unbekannte Real-World-Seite: ${missing.join(", ")}`);
}

if (listOnly) {
  for (const site of sites) {
    console.log(`${site.id}\t${site.slug}\t${site.url}`);
  }
  process.exit(0);
}

if (!existsSync(path.join(extensionDirectory, "manifest.json"))) {
  throw new Error(
    "Der Chromium-Build fehlt. Vor dem Live-Lauf zuerst npm run build:chromium ausführen."
  );
}

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

function commandVersion(command, args = ["--version"]) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) {
    return undefined;
  }
  return result.stdout.trim() || result.stderr.trim() || undefined;
}

const driverExecutable = resolveExecutable("CHROMEWEBDRIVER", "chromedriver");
const chromiumExecutable =
  process.env.CHROMIUM_BIN ?? findCommand("chromium", "chromium-browser");

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function webdriverRequest(method, pathname, body) {
  const response = await fetch(`${driverBaseUrl}${pathname}`, {
    method,
    headers:
      body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { value: text };
  }

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
      throw new Error(
        `ChromeDriver konnte nicht gestartet werden: ${driverStartError.message}\n${logs.join("")}`
      );
    }

    if (driverProcess.exitCode !== null) {
      throw new Error(`ChromeDriver wurde vorzeitig beendet.\n${logs.join("")}`);
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

  throw new Error(
    `ChromeDriver wurde nicht rechtzeitig bereit.\n${logs.join("")}`
  );
}

function sessionIdFrom(response) {
  const sessionId = response?.value?.sessionId ?? response?.sessionId;
  if (typeof sessionId !== "string" || !sessionId) {
    throw new Error(
      `WebDriver lieferte keine Session-ID: ${JSON.stringify(response)}`
    );
  }
  return sessionId;
}

async function createSession(withExtension) {
  const args = [
    "--headless=new",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--no-first-run",
    "--disable-default-apps",
    "--window-size=1440,1200"
  ];

  if (withExtension) {
    args.push(
      `--disable-extensions-except=${extensionDirectory}`,
      `--load-extension=${extensionDirectory}`
    );
  }

  const response = await webdriverRequest("POST", "/session", {
    capabilities: {
      alwaysMatch: {
        browserName: "chrome",
        pageLoadStrategy: "eager",
        timeouts: {
          implicit: 0,
          pageLoad: navigationTimeoutMs,
          script: 15_000
        },
        "goog:chromeOptions": {
          binary: chromiumExecutable,
          args
        }
      }
    }
  });

  return sessionIdFrom(response);
}

async function execute(sessionId, script, args = []) {
  const response = await webdriverRequest(
    "POST",
    `/session/${sessionId}/execute/sync`,
    { script, args }
  );
  return response.value;
}

async function installObservers(sessionId) {
  await execute(
    sessionId,
    `
      window.__sprachverstandLiveMetrics = {
        errors: [],
        rejections: [],
        longTasks: []
      };

      window.addEventListener("error", (event) => {
        window.__sprachverstandLiveMetrics.errors.push({
          message: String(event.message || "Unbekannter JavaScript-Fehler"),
          source: String(event.filename || ""),
          line: Number(event.lineno || 0),
          column: Number(event.colno || 0)
        });
      });

      window.addEventListener("unhandledrejection", (event) => {
        window.__sprachverstandLiveMetrics.rejections.push(
          String(event.reason?.message || event.reason || "Unbekannte Promise-Ablehnung")
        );
      });

      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            window.__sprachverstandLiveMetrics.longTasks.push({
              startTime: entry.startTime,
              duration: entry.duration
            });
          }
        });
        observer.observe({ type: "longtask", buffered: true });
      } catch {
        // Long-Task-Beobachtung wird nicht von jeder Browserkonfiguration bereitgestellt.
      }
    `
  );
}

async function protectedState(sessionId) {
  return execute(
    sessionId,
    `
      function hashText(text) {
        let hash = 2166136261;
        for (let index = 0; index < text.length; index += 1) {
          hash ^= text.charCodeAt(index);
          hash = Math.imul(hash, 16777619);
        }
        return (hash >>> 0).toString(16).padStart(8, "0");
      }

      const selectors = ["input", "textarea", "[contenteditable='true']", "code", "pre"];
      const result = {};
      for (const selector of selectors) {
        const nodes = [...document.querySelectorAll(selector)];
        const serialized = nodes.map((node) => {
          const value = "value" in node
            ? String(node.value ?? "")
            : String(node.textContent ?? "");
          return [node.tagName, node.getAttribute("type") || "", value].join("\\u001f");
        }).join("\\u001e");
        result[selector] = {
          count: nodes.length,
          hash: hashText(serialized)
        };
      }
      return result;
    `
  );
}

async function collectSnapshot(sessionId) {
  return execute(
    sessionId,
    `
      const visibleText = document.body?.innerText || "";
      const patterns = [
        {
          id: "separator-innen",
          expression: /[\\p{L}\\p{N}]+(?:[:*_·])innen\\b/giu
        },
        {
          id: "binnen-i",
          expression: /\\b[\\p{Ll}]+Innen\\b/gu
        }
      ];

      const remainingPatterns = patterns.map(({ id, expression }) => {
        const matches = [...visibleText.matchAll(expression)];
        return {
          id,
          count: matches.length,
          samples: [...new Set(
            matches.slice(0, 12).map((match) => String(match[0]).slice(0, 160))
          )]
        };
      });

      const navigation = performance.getEntriesByType("navigation")[0];
      const metrics = window.__sprachverstandLiveMetrics || {
        errors: [],
        rejections: [],
        longTasks: []
      };
      const longTasks = Array.isArray(metrics.longTasks) ? metrics.longTasks : [];
      const totalLongTaskDuration = longTasks.reduce(
        (sum, entry) => sum + Number(entry.duration || 0),
        0
      );
      const maximumLongTaskDuration = longTasks.reduce(
        (maximum, entry) => Math.max(maximum, Number(entry.duration || 0)),
        0
      );

      const walker = document.createTreeWalker(
        document.body || document.documentElement,
        NodeFilter.SHOW_TEXT
      );
      let textNodeCount = 0;
      while (walker.nextNode()) {
        textNodeCount += 1;
      }

      return {
        url: location.href,
        title: document.title,
        readyState: document.readyState,
        domElementCount: document.querySelectorAll("*").length,
        textNodeCount,
        visibleTextLength: visibleText.length,
        scrollHeight: Math.max(
          document.documentElement?.scrollHeight || 0,
          document.body?.scrollHeight || 0
        ),
        navigation: navigation ? {
          domContentLoadedMs: navigation.domContentLoadedEventEnd,
          loadEventMs: navigation.loadEventEnd,
          durationMs: navigation.duration,
          transferSize: navigation.transferSize
        } : undefined,
        remainingPatterns,
        javascriptErrors: Array.isArray(metrics.errors)
          ? metrics.errors.slice(0, 30)
          : [],
        unhandledRejections: Array.isArray(metrics.rejections)
          ? metrics.rejections.slice(0, 30)
          : [],
        longTasks: {
          count: longTasks.length,
          totalDurationMs: totalLongTaskDuration,
          maximumDurationMs: maximumLongTaskDuration
        }
      };
    `
  );
}

async function exercisePage(sessionId) {
  const height = await execute(
    sessionId,
    "return Math.max(document.documentElement?.scrollHeight || 0, document.body?.scrollHeight || 0);"
  );
  const numericHeight = Number(height || 0);

  for (const fraction of [0.33, 0.66, 1]) {
    await execute(sessionId, "window.scrollTo(0, arguments[0]);", [
      Math.round(numericHeight * fraction)
    ]);
    await sleep(450);
  }

  await execute(sessionId, "window.scrollTo(0, 0);");
}

async function saveScreenshot(sessionId, filePath) {
  const response = await webdriverRequest(
    "GET",
    `/session/${sessionId}/screenshot`
  );
  const encoded = response.value;
  if (typeof encoded !== "string" || !encoded) {
    throw new Error("ChromeDriver lieferte keinen Screenshot.");
  }
  await writeFile(filePath, Buffer.from(encoded, "base64"));
}

function normalizeError(error) {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }
  return String(error);
}

function compareRuns(baseline, extension) {
  if (baseline.status !== "ok" || extension.status !== "ok") {
    return undefined;
  }

  const baselinePatterns = new Map(
    baseline.snapshot.remainingPatterns.map((entry) => [entry.id, entry.count])
  );
  const extensionPatterns = new Map(
    extension.snapshot.remainingPatterns.map((entry) => [entry.id, entry.count])
  );
  const patternDelta = {};
  for (const id of new Set([
    ...baselinePatterns.keys(),
    ...extensionPatterns.keys()
  ])) {
    patternDelta[id] =
      (extensionPatterns.get(id) ?? 0) - (baselinePatterns.get(id) ?? 0);
  }

  return {
    elapsedDeltaMs: extension.elapsedMs - baseline.elapsedMs,
    domContentLoadedDeltaMs:
      Number(extension.snapshot.navigation?.domContentLoadedMs || 0) -
      Number(baseline.snapshot.navigation?.domContentLoadedMs || 0),
    totalLongTaskDeltaMs:
      extension.snapshot.longTasks.totalDurationMs -
      baseline.snapshot.longTasks.totalDurationMs,
    patternDelta
  };
}

async function runSiteMode(site, mode) {
  const withExtension = mode === "extension";
  let sessionId;
  const startedAt = Date.now();

  try {
    sessionId = await createSession(withExtension);
    await webdriverRequest("POST", `/session/${sessionId}/url`, {
      url: site.url
    });
    await installObservers(sessionId);
    const protectedBefore = await protectedState(sessionId);
    await exercisePage(sessionId);
    await sleep(observationMs);
    const snapshot = await collectSnapshot(sessionId);
    const protectedAfter = await protectedState(sessionId);
    const screenshotPath = path.join(
      screenshotDirectory,
      `${String(site.id).padStart(2, "0")}-${site.slug}-${mode}.png`
    );
    await saveScreenshot(sessionId, screenshotPath);

    return {
      status: "ok",
      elapsedMs: Date.now() - startedAt,
      screenshot: path.relative(projectRoot, screenshotPath),
      protectedBefore,
      protectedAfter,
      snapshot
    };
  } catch (error) {
    return {
      status: "error",
      elapsedMs: Date.now() - startedAt,
      error: normalizeError(error)
    };
  } finally {
    if (sessionId) {
      try {
        await webdriverRequest("DELETE", `/session/${sessionId}`);
      } catch (error) {
        console.error(
          `Session ${sessionId} konnte nicht sauber beendet werden: ${normalizeError(error)}`
        );
      }
    }
  }
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

await mkdir(path.dirname(outputPath), { recursive: true });
await mkdir(screenshotDirectory, { recursive: true });

const driverLogs = [];
let driverStartError;
const driverProcess = spawn(driverExecutable, [`--port=${driverPort}`], {
  stdio: ["ignore", "pipe", "pipe"]
});
driverProcess.on("error", (error) => {
  driverStartError = error;
  driverLogs.push(`${error.stack ?? error.message}\n`);
});
driverProcess.stdout.on("data", (chunk) => driverLogs.push(chunk.toString()));
driverProcess.stderr.on("data", (chunk) => driverLogs.push(chunk.toString()));

const results = [];

try {
  await waitForDriver(driverProcess, driverLogs);

  for (const site of sites) {
    console.log(`Prüfe ${site.id}/10 ${site.slug} ohne Erweiterung …`);
    const baseline = await runSiteMode(site, "baseline");
    console.log(`Prüfe ${site.id}/10 ${site.slug} mit Erweiterung …`);
    const extension = await runSiteMode(site, "extension");

    if (baseline.status === "error") {
      console.log(
        `::warning title=Baseline fehlgeschlagen::${site.slug}: ${baseline.error.split("\n")[0]}`
      );
    }
    if (extension.status === "error") {
      console.log(
        `::warning title=Erweiterungslauf fehlgeschlagen::${site.slug}: ${extension.error.split("\n")[0]}`
      );
    }

    results.push({
      ...site,
      baseline,
      extension,
      comparison: compareRuns(baseline, extension)
    });
  }
} finally {
  await stopDriver(driverProcess);
}

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  commit: process.env.GITHUB_SHA || undefined,
  environment: {
    node: process.version,
    platform: process.platform,
    osRelease: osRelease(),
    chromium: commandVersion(chromiumExecutable),
    chromedriver: commandVersion(driverExecutable),
    observationMs,
    navigationTimeoutMs
  },
  results
};

await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);

const successfulExtensionRuns = results.filter(
  (entry) => entry.extension.status === "ok"
).length;
const failedExtensionRuns = results.length - successfulExtensionRuns;
console.log(
  `Real-World-Report geschrieben: ${path.relative(projectRoot, outputPath)} (${successfulExtensionRuns} erfolgreich, ${failedExtensionRuns} fehlgeschlagen).`
);

if (successfulExtensionRuns === 0) {
  throw new Error(
    "Kein einziger Real-World-Lauf mit Erweiterung war erfolgreich."
  );
}
