import { createServer } from "node:http";
import { existsSync, statSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

// Rein lokale Browserdiagnose. Sie verändert keine produktive Erweiterungsdatei.
const fixture = "<!doctype html><html lang=\"de\"><head><meta charset=\"utf-8\"><title>Chromium-Profilfixture</title></head><body>\n<input id=\"editor\" value=\"Nutzer:innen\"><code id=\"code\">Nutzer:innen</code><p id=\"static-target\">Nutzer:innen</p>\n<div id=\"dynamic-root\"></div><section id=\"bulk-root\"></section>\n<script>\n(() => {\n  const bulk = document.querySelector(\"#bulk-root\");\n  const fragment = document.createDocumentFragment();\n  for (let i = 0; i < 1400; i++) {\n    const p = document.createElement(\"p\");\n    p.textContent = i % 50 === 0 ? \"Nutzer:innen in der Dokumentation \" + i :\n      \"Neutraler Abschnitt der Dokumentation Nummer \" + i;\n    fragment.append(p);\n  }\n  bulk.append(fragment);\n  const spans = [];\n  for (let i = 0; i < 480; i++) {\n    const span = document.createElement(\"span\");\n    span.textContent = \"Nutzer:innen \" + i;\n    document.querySelector(\"#dynamic-root\").append(span);\n    spans.push(span);\n  }\n  window.__profil = { ticks: 0, done: false, longTasks: [] };\n  try {\n    new PerformanceObserver((list) => {\n      for (const e of list.getEntries()) window.__profil.longTasks.push({\n        startMs: e.startTime, durationMs: e.duration\n      });\n    }).observe({type: \"longtask\"});\n  } catch { /* Beobachter ohne Unterstützung bleiben leer. */ }\n  window.__startProfilLast = (durationMs) => {\n    const start = performance.now();\n    const timer = setInterval(() => {\n      const tick = window.__profil.ticks;\n      for (let offset = 0; offset < 48; offset++) {\n        const index = (tick * 48 + offset) % spans.length;\n        spans[index].textContent = \"Nutzer:innen \" + tick + \"-\" + offset;\n      }\n      window.__profil.ticks++;\n      if (performance.now() - start >= durationMs) {\n        clearInterval(timer);\n        window.__profil.done = true;\n      }\n    }, 40);\n  };\n  window.__profilSnapshot = () => ({\n    ticks: window.__profil.ticks,\n    done: window.__profil.done,\n    unkorrigiert: spans.filter((x) => x.textContent.startsWith(\"Nutzer:innen\")).length,\n    korrigiert: spans.filter((x) => x.textContent.startsWith(\"Nutzer \")).length,\n    statisch: document.querySelector(\"#static-target\").textContent,\n    geschuetzt: document.querySelector(\"#editor\").value === \"Nutzer:innen\" &&\n      document.querySelector(\"#code\").textContent === \"Nutzer:innen\",\n    longTasks: window.__profil.longTasks\n  });\n})();\n</script></body></html>";
const basis = process.cwd();
const erweiterung = path.join(basis, "dist", "chromium");
const outputDir = path.resolve(basis, argument("--output-dir", "artifacts/chromium-cpu"));
const durationMs = zahl("--duration-ms", 4_000, 1_000, 10_000);
const pairs = zahl("--pairs", 1, 1, 3);
const port = 9517;
const webDriverUrl = "http://127.0.0.1:" + port;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index < 0) return String(fallback);
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(name + " benötigt einen Wert.");
  return value;
}
function zahl(name, fallback, min, max) {
  const value = Number(argument(name, fallback));
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(name + " muss zwischen " + min + " und " + max + " liegen.");
  }
  return value;
}
function executable(umgebung, name) {
  const override = process.env[umgebung];
  if (override && existsSync(override) && statSync(override).isFile()) return override;
  if (override && existsSync(path.join(override, name))) return path.join(override, name);
  const found = spawnSync("which", [name], { encoding: "utf8" });
  if (found.status === 0 && found.stdout.trim()) return found.stdout.trim();
  throw new Error("Programm nicht gefunden: " + name);
}
if (!existsSync(path.join(erweiterung, "manifest.json"))) {
  throw new Error("Vorher npm run build:chromium ausführen.");
}
const driver = executable("CHROMEWEBDRIVER", "chromedriver");
const chromium = process.env.CHROMIUM_BIN ?? executable("CHROMIUM_BIN", "chromium");

async function api(method, suffix, body) {
  const result = await fetch(webDriverUrl + suffix, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await result.text();
  let decoded;
  try { decoded = JSON.parse(text); }
  catch { decoded = { value: text }; }
  if (!result.ok || decoded?.value?.error) {
    throw new Error("WebDriver " + suffix + " (" + result.status + "): " +
      JSON.stringify(decoded).slice(0, 900));
  }
  return decoded.value;
}
const js = (id, script, args = []) =>
  api("POST", "/session/" + id + "/execute/sync", { script, args });
const cdp = (id, cmd, params = {}) =>
  api("POST", "/session/" + id + "/goog/cdp/execute", { cmd, params });

async function startDriver(proc, output, error) {
  for (let i = 0; i < 150; i++) {
    if (error.value) throw error.value;
    if (proc.exitCode !== null) throw new Error("ChromeDriver: " + output.join("").slice(-800));
    try {
      const status = await fetch(webDriverUrl + "/status");
      if (status.ok) return;
    } catch { /* Treiber startet noch. */ }
    await sleep(100);
  }
  throw new Error("ChromeDriver nicht bereit.");
}
async function startFixture() {
  const response = Buffer.from(fixture, "utf8");
  const server = createServer((req, res) => {
    if (new URL(req.url ?? "/", "http://127.0.0.1").pathname !== "/test.html") {
      res.writeHead(404); res.end(); return;
    }
    res.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
      "content-length": response.length,
      "cache-control": "no-store"
    });
    res.end(response);
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Fixture-Port unbekannt.");
  return { server, url: "http://127.0.0.1:" + address.port + "/test.html" };
}

// Samples und Zeitdeltas bleiben im Originalprofil erhalten; hier nur Hotspots verdichten.
function cpuAuswertung(profile) {
  const nodes = new Map((profile.nodes ?? []).map((node) => [node.id, node]));
  const times = new Map();
  const samples = profile.samples ?? [];
  const deltas = profile.timeDeltas ?? [];
  for (let index = 0; index < samples.length; index++) {
    const id = samples[index];
    const delta = deltas[index] ?? 0;
    times.set(id, (times.get(id) ?? 0) + delta);
  }
  const profiles = [...nodes.values()].map((node) => {
    const frame = node.callFrame ?? {};
    return {
      funktion: frame.functionName || "(anonym)",
      quelle: frame.url || "(ohne URL)",
      zeile: (frame.lineNumber ?? -1) + 1,
      selfMs: Number(((times.get(node.id) ?? 0) / 1000).toFixed(2)),
      samples: node.hitCount ?? 0
    };
  });
  const top = profiles.sort((a, b) => b.selfMs - a.selfMs).slice(0, 25);
  const bySource = new Map();
  for (const frame of profiles) {
    bySource.set(frame.quelle, (bySource.get(frame.quelle) ?? 0) + frame.selfMs);
  }
  const sources = [...bySource.entries()]
    .map(([quelle, selfMs]) => ({ quelle, selfMs: Number(selfMs.toFixed(2)) }))
    .sort((a, b) => b.selfMs - a.selfMs).slice(0, 25);
  return { sampleCount: samples.length, top, sources };
}
async function sitzung(withExtension) {
  const args = [
    "--headless=new", "--no-sandbox", "--disable-dev-shm-usage",
    "--no-first-run", "--disable-default-apps", "--window-size=1280,800"
  ];
  if (withExtension) {
    args.push("--disable-extensions-except=" + erweiterung,
      "--load-extension=" + erweiterung);
  }
  const response = await api("POST", "/session", { capabilities: { alwaysMatch: {
    browserName: "chrome", pageLoadStrategy: "eager",
    timeouts: { implicit: 0, pageLoad: 20_000, script: 20_000 },
    "goog:chromeOptions": { binary: chromium, args }
  } } });
  if (!response?.sessionId) throw new Error("Keine Chromium-Session-ID.");
  return response.sessionId;
}

async function browserlauf(url, mode, index) {
  let id;
  let profilerActive = false;
  try {
    id = await sitzung(mode === "extension");
    await api("POST", "/session/" + id + "/url", { url });
    await sleep(1_200);
    const initial = await js(id, "return window.__profilSnapshot();");
    await cdp(id, "Profiler.enable");
    await cdp(id, "Profiler.setSamplingInterval", { interval: 1000 });
    await cdp(id, "Profiler.start");
    profilerActive = true;
    await js(id, "window.__startProfilLast(arguments[0]); return true;", [durationMs]);
    const deadline = Date.now() + durationMs + 12_000;
    let completed = false;
    while (Date.now() < deadline) {
      if (await js(id, "return window.__profil.done;")) {
        completed = true;
        break;
      }
      await sleep(150);
    }
    if (!completed) throw new Error("Lokale Last nicht beendet.");
    await sleep(400);
    const nach400Ms = await js(id, "return window.__profilSnapshot();");
    await sleep(3_500);
    const nach3900Ms = await js(id, "return window.__profilSnapshot();");
    const response = await cdp(id, "Profiler.stop");
    profilerActive = false;
    const profile = response?.profile;
    if (!profile || !Array.isArray(profile.nodes)) {
      throw new Error("CDP hat kein gültiges CPU-Profil geliefert.");
    }
    const name = "cpu-" + index + "-" + mode + ".json";
    await writeFile(path.join(outputDir, name), JSON.stringify(profile));
    const cpu = cpuAuswertung(profile);
    const result = {
      modus: mode, initial, nach400Ms, nach3900Ms,
      profil: name, cpu
    };
    console.log("CHROMIUM-CPU " + index + " " + mode + " " +
      JSON.stringify({ nach400Ms, nach3900Ms, samples: cpu.sampleCount,
        top: cpu.top.slice(0, 7), sources: cpu.sources.slice(0, 8) }));
    return result;
  } finally {
    if (id) {
      if (profilerActive) {
        try { await cdp(id, "Profiler.stop"); } catch { /* Session wird beendet. */ }
      }
      try { await api("DELETE", "/session/" + id); }
      catch (error) { console.warn("Browser schließen: " + String(error)); }
    }
  }
}

const logs = [];
const error = { value: null };
const proc = spawn(driver, ["--port=" + port], { stdio: ["ignore", "pipe", "pipe"] });
proc.on("error", (err) => { error.value = err; });
proc.stdout.on("data", (chunk) => { logs.push(String(chunk)); });
proc.stderr.on("data", (chunk) => { logs.push(String(chunk)); });
let fixtureServer;
try {
  await mkdir(outputDir, { recursive: true });
  await startDriver(proc, logs, error);
  const website = await startFixture();
  fixtureServer = website.server;
  const runs = [];
  for (let pair = 0; pair < pairs; pair++) {
    const order = pair % 2 === 0
      ? ["baseline", "extension"] : ["extension", "baseline"];
    for (const mode of order) {
      runs.push({ paar: pair + 1, ...(await browserlauf(website.url, mode, pair + 1)) });
    }
  }
  const report = {
    version: 1,
    generatedAt: new Date().toISOString(),
    commit: process.env.GITHUB_SHA ?? null,
    chromium: spawnSync(chromium, ["--version"], { encoding: "utf8" }).stdout.trim(),
    durationMs, pairs, runs,
    hinweis: "Echtes Chromium-V8-Sampling mit Profiler-Overhead; keine Freigabe, " +
      "kein Hard-Gate und keine automatische kausale Attribution."
  };
  await writeFile(path.join(outputDir, "report.json"), JSON.stringify(report, null, 2) + "\n");
  console.log("CHROMIUM-CPU-REPORT " + JSON.stringify({
    durationMs, pairs,
    ergebnisse: runs.map((run) => ({
      modus: run.modus, unkorrigiert: run.nach3900Ms.unkorrigiert,
      samples: run.cpu.sampleCount, top: run.cpu.top.slice(0, 5)
    }))
  }));
} finally {
  if (fixtureServer) {
    await new Promise((resolve) => fixtureServer.close(resolve));
  }
  if (proc.exitCode === null) {
    proc.kill("SIGTERM");
    await Promise.race([new Promise((resolve) => proc.once("exit", resolve)), sleep(2_000)]);
    if (proc.exitCode === null) proc.kill("SIGKILL");
  }
}
