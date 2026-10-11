import { createServer } from "node:http";
import { existsSync, statSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn, spawnSync } from "node:child_process";
import { createVerified60FpsWebm } from "./verified-60fps-media.mjs";
import { analysiereVideoCpu, frameLuecken } from "./video-frame-cpu-metrics.mjs";

// Ausschließlich lokale, manuelle V8-Profilierung. Die regulären Videogates bleiben unverändert.
const basis = process.cwd();
const extension = path.join(basis, "dist", "chromium");
const base = "http://127.0.0.1:9518";
const pairsIndex = process.argv.indexOf("--pairs");
const pairs = pairsIndex === -1 ? 2 : Number(process.argv[pairsIndex + 1]);
if (![1, 2, 3].includes(pairs)) throw new Error("--pairs erlaubt 1 bis 3.");
const mutationModeIndex = process.argv.indexOf("--mutation-mode");
const mutationMode = mutationModeIndex === -1 ? "marker" : process.argv[mutationModeIndex + 1];
if (!["marker", "neutral", "both"].includes(mutationMode)) {
  throw new Error("--mutation-mode erlaubt marker, neutral oder both.");
}
const cpuIndex = process.argv.indexOf("--cpu-profile");
const cpuProfileMode = cpuIndex === -1 ? "on" : process.argv[cpuIndex + 1];
if (!["on", "off"].includes(cpuProfileMode)) {
  throw new Error("--cpu-profile erlaubt on oder off.");
}
const cpuProfile = cpuProfileMode === "on";
const output = path.resolve(basis, "artifacts/video-frame-cpu");
const html = "<!doctype html><html lang=\"de\"><head><meta charset=\"utf-8\">\n<title>Videoframe-CPU-Korrelation</title></head><body>\n<p id=\"static-target\">Nutzer:innen</p>\n<video id=\"video\" muted autoplay playsinline preload=\"auto\" src=\"/video.webm\"\nstyle=\"width:320px;height:180px;background:#111\"></video>\n<div id=\"dynamic-root\"></div>\n<script>\n(() => {\n  const video = document.querySelector(\"#video\");\n  const mutationMode = new URL(location.href).searchParams.get(\"mutation-mode\");\n  if (mutationMode !== \"marker\" && mutationMode !== \"neutral\") {\n    throw new Error(\"Unbekannte Mutationslast: \" + mutationMode);\n  }\n  const metrics = { frameTimes: [], frameMetadata: [], longTasks: [],\n    timerTicks: [], errors: [], framesSupported: typeof video.requestVideoFrameCallback === \"function\",\n    longTaskSupported: false, done: false,\n    mutationMode, mutationRecords: {childList: 0, characterData: 0},\n    mutationBatches: [] };\n  window.__videoCpuMetrics = metrics;\n  const nodes = [];\n  const root = document.querySelector(\"#dynamic-root\");\n  for (let index = 0; index < 480; index++) {\n    const element = document.createElement(\"span\");\n    element.textContent = \"Neutraler Inhalt \" + index;\n    root.append(element);\n    nodes.push(element);\n  }\n  // Beide Lastformen erhalten denselben passiven Observer-Messaufwand.\n  new MutationObserver((records) => {\n    const deliveredAtMs = performance.now();\n    let childList = 0;\n    let characterData = 0;\n    for (const record of records) {\n      if (record.type === \"childList\") { metrics.mutationRecords.childList++; childList++; }\n      if (record.type === \"characterData\") { metrics.mutationRecords.characterData++; characterData++; }\n    }\n    // Die Zustellung erfolgt nach dem Schreib-Burst, nicht bei jedem replaceData().\n    metrics.mutationBatches.push({\n      deliveredAtMs, recordCount: records.length, childList, characterData,\n      observerMs: performance.now() - deliveredAtMs\n    });\n  }).observe(root, {subtree: true, characterData: true, childList: true});\n  try {\n    const observer = new PerformanceObserver((list) => {\n      for (const task of list.getEntries()) {\n        metrics.longTasks.push({ startMs: task.startTime, dauerMs: task.duration });\n      }\n    });\n    observer.observe({type:\"longtask\"});\n    metrics.longTaskSupported = true;\n  } catch { /* Nicht unterstützte Long-Task-API bleibt unbewertet. */ }\n  if (metrics.framesSupported) {\n    const onFrame = (now, metadata) => {\n      metrics.frameTimes.push(Number(now));\n      metrics.frameMetadata.push({\n        nowMs: Number(now),\n        erwarteteAnzeigeMs: Number(metadata.expectedDisplayTime),\n        zeitImVideoS: Number(metadata.mediaTime),\n        angezeigteFrames: Number(metadata.presentedFrames)\n      });\n      if (!metrics.done) video.requestVideoFrameCallback(onFrame);\n    };\n    video.requestVideoFrameCallback(onFrame);\n  }\n  for (const event of [\"error\", \"stalled\", \"waiting\"]) {\n    video.addEventListener(event, () => {\n      metrics.errors.push(event + \" bei \" + performance.now().toFixed(1) + \" ms\");\n    });\n  }\n  video.play().catch(error => metrics.errors.push(\"play: \" + String(error)));\n  const startMs = performance.now();\n  const timer = setInterval(() => {\n    const tick = metrics.timerTicks.length;\n    const startedAt = performance.now();\n    for (let offset = 0; offset < 48; offset++) {\n      const index = (tick * 48 + offset) % nodes.length;\n      nodes[index].textContent = (mutationMode === \"marker\" ? \"Nutzer:innen \" : \"Neutraler Inhalt \") + tick + \" / \" + offset;\n    }\n    const previous = metrics.timerTicks[metrics.timerTicks.length - 1];\n    metrics.timerTicks.push({ atMs: startedAt,\n      tickIntervalMs: previous ? startedAt - previous.atMs : null,\n      workMs: performance.now() - startedAt });\n  }, 50);\n  setTimeout(() => {\n    clearInterval(timer);\n    metrics.done = true;\n  }, 8000);\n  window.__videoCpuState = () => {\n    const quality = video.getVideoPlaybackQuality?.();\n    return { ...metrics, staticText: document.querySelector(\"#static-target\").textContent,\n      currentTime: video.currentTime, readyState: video.readyState,\n      width: video.videoWidth, height: video.videoHeight,\n      dropped: quality?.droppedVideoFrames ?? null,\n      visibility: document.visibilityState,\n      markersVerblieben: nodes.filter((node) => node.textContent.includes(\"Nutzer:innen\")).length,\n      korrigierteMarker: nodes.filter((node) => node.textContent.startsWith(\"Nutzer \")).length };\n  };\n})();\n</script></body></html>";
if (!existsSync(path.join(extension, "manifest.json"))) {
  throw new Error("Chromium-Erweiterung fehlt: npm run build:chromium.");
}
function executable(environment, name) {
  const configured = process.env[environment];
  if (configured && existsSync(configured) && statSync(configured).isFile()) return configured;
  if (configured && existsSync(path.join(configured, name))) return path.join(configured, name);
  const found = spawnSync("which", [name], { encoding: "utf8" });
  if (found.status === 0 && found.stdout.trim()) return found.stdout.trim();
  throw new Error("Programm nicht gefunden: " + name);
}
const chromium = process.env.CHROMIUM_BIN ?? executable("CHROMIUM_BIN", "chromium");
const driver = executable("CHROMEWEBDRIVER", "chromedriver");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function api(method, pathname, body) {
  const response = await fetch(base + pathname, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { value: text }; }
  if (!response.ok || json.value?.error) {
    throw new Error("WebDriver " + pathname + ": " + JSON.stringify(json).slice(0, 600));
  }
  return json.value;
}
const js = (id, script) =>
  api("POST", "/session/" + id + "/execute/sync", { script, args: [] });
const cdp = (id, cmd, params = {}) =>
  api("POST", "/session/" + id + "/goog/cdp/execute", { cmd, params });

async function startDriver(handle, error, logs) {
  for (let attempt = 0; attempt < 150; attempt++) {
    if (error.value) throw error.value;
    if (handle.exitCode !== null) throw new Error(logs.join("").slice(-800));
    try {
      const response = await fetch(base + "/status");
      if (response.ok) return;
    } catch { /* Der ChromeDriver startet. */ }
    await sleep(100);
  }
  throw new Error("ChromeDriver nicht erreichbar.");
}
async function openSession(withExtension) {
  const args = [
    "--headless=new", "--no-sandbox", "--disable-dev-shm-usage",
    "--no-first-run", "--disable-default-apps", "--autoplay-policy=no-user-gesture-required",
    "--mute-audio", "--window-size=1280,720"
  ];
  if (withExtension) args.push(
    "--disable-extensions-except=" + extension,
    "--load-extension=" + extension
  );
  const result = await api("POST", "/session", {
    capabilities: { alwaysMatch: {
      browserName: "chrome", pageLoadStrategy: "eager",
      timeouts: { implicit: 0, pageLoad: 20_000, script: 15_000 },
      "goog:chromeOptions": { binary: chromium, args }
    } }
  });
  if (!result?.sessionId) throw new Error("Sitzung ohne ID.");
  return result.sessionId;
}
async function openFixture() {
  const page = Buffer.from(html, "utf8");
  const media = createVerified60FpsWebm();
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    const asset = url.pathname === "/video.webm" ? media :
      url.pathname === "/test.html" ? page : null;
    if (!asset) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, {
      "content-type": url.pathname === "/video.webm" ?
        "video/webm" : "text/html; charset=utf-8",
      "cache-control": "no-store", "content-length": asset.length
    });
    res.end(asset);
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Fixture ohne Port.");
  return { server, url: "http://127.0.0.1:" + address.port + "/test.html" };
}

async function abgleichZeitachsen(id) {
  // CDP Timestamp und V8 Profiler.startTime nutzen die monotone Chromium-Uhr.
  // Die beiden performance.now()-Abfragen begrenzen den Zeitachsenfehler.
  const davor = await js(id, "return performance.now();");
  const result = await cdp(id, "Performance.getMetrics");
  const danach = await js(id, "return performance.now();");
  const timestamp = result?.metrics?.find((metric) => metric.name === "Timestamp")?.value;
  if (!Number.isFinite(timestamp) || !Number.isFinite(davor) ||
      !Number.isFinite(danach) || danach < davor) {
    throw new Error("Monotone Zeitachsen lassen sich nicht synchronisieren.");
  }
  return {
    offsetMs: (davor + danach) / 2 - timestamp * 1000,
    unschaerfeMs: (danach - davor) / 2
  };
}

async function browserlauf(url, mode, pair, lastart) {
  const id = await openSession(mode === "extension");
  let profileStarted = false;
  try {
    await api("POST", "/session/" + id + "/url", { url });
    let clock = null;
    if (cpuProfile) {
      await cdp(id, "Performance.enable");
      await cdp(id, "Profiler.enable");
      await cdp(id, "Profiler.setSamplingInterval", { interval: 1000 });
      await cdp(id, "Profiler.start");
      profileStarted = true;
      clock = await abgleichZeitachsen(id);
    }
    const deadline = Date.now() + 21_000;
    while (Date.now() < deadline) {
      if (await js(id, "return window.__videoCpuMetrics?.done === true;")) break;
      await sleep(200);
    }
    const state = await js(id, "return window.__videoCpuState?.();");
    if (!state?.done) throw new Error("Video-Fixturn nicht abgeschlossen.");
    let dateiname = null;
    let analyse;
    if (cpuProfile) {
      const response = await cdp(id, "Profiler.stop");
      profileStarted = false;
      const profile = response?.profile;
      dateiname = "cpu-" + pair + "-" + lastart + "-" + mode + ".json";
      if (!profile?.nodes || !clock) throw new Error("CPU-Profil ohne Zeitachse.");
      await writeFile(path.join(output, dateiname), JSON.stringify(profile));
      analyse = analysiereVideoCpu(profile, clock.offsetMs,
        state.frameTimes, state.longTasks);
    } else {
      const gaps = frameLuecken(state.frameTimes);
      analyse = {
        achsePlausibel: null,
        lueckenAb80Ms: gaps.length,
        lueckenAb120Ms: gaps.filter(g => g.dauerMs > 120).length,
        groessteLueckeMs: gaps[0]?.dauerMs ?? 0,
        spitzen: gaps.slice(0, 30).map(gap => ({
          ...gap, longTasks: state.longTasks.filter(task =>
            task.startMs < gap.endMs && task.startMs + task.dauerMs > gap.startMs),
          sampledCpuMs: null, topFunktionen: []
        })),
        topGesamt: []
      };
    }
    const frames = frameLuecken(state.frameTimes, 16, 0);
    const sorted = [...frames].sort((a, b) => a.dauerMs - b.dauerMs);
    const p95 = sorted.length ? sorted[Math.ceil(sorted.length * 0.95) - 1].dauerMs : null;
    const valide = state.currentTime >= 5 && state.readyState >= 2 &&
      state.width > 0 && state.height > 0 && state.frameTimes.length >= 90 &&
      state.timerTicks.length >= 100 && state.framesSupported &&
      state.staticText === (mode === "extension" ? "Nutzer" : "Nutzer:innen") &&
      state.mutationMode === lastart &&
      state.mutationRecords?.childList > 100 &&
      (lastart === "marker" ?
        (mode === "extension" ? state.mutationRecords.characterData > 50 :
          state.mutationRecords.characterData === 0) :
        state.mutationRecords.characterData === 0) &&
      (lastart === "neutral" ? state.markersVerblieben === 0 : true);
    const result = {
      modus: mode, paar: pair, lastart, profil: dateiname,
      gueltig: valide,
      frameCallbacks: state.frameTimes.length,
      p95FrameGapMs: p95,
      droppedVideoFrames: state.dropped,
      currentTime: state.currentTime,
      mutationTicks: state.timerTicks.length,
      mutationRecords: state.mutationRecords,
      mutationBatches: state.mutationBatches,
      markersVerblieben: state.markersVerblieben,
      korrigierteMarker: state.korrigierteMarker,
      visibility: state.visibility,
      fehler: state.errors,
      clock,
      longTaskSupported: state.longTaskSupported,
      longTasks: state.longTasks,
      timerTicks: state.timerTicks,
      frameMetadata: state.frameMetadata,
      analyse
    };
    console.log("VIDEO-FRAME-CPU " + JSON.stringify({
      paar: pair, modus: mode, lastart, cpuProfileMode, gueltig: valide,
      mutationRecords: state.mutationRecords,
      markersVerblieben: state.markersVerblieben,
      maxBatch: Math.max(0, ...state.mutationBatches.map(b => b.recordCount)),
      maxTickAbstandMs: Math.max(0, ...state.timerTicks.map(t => t.tickIntervalMs ?? 0)),
      frameCallbacks: result.frameCallbacks,
      p95FrameGapMs: p95, dropped: state.dropped, longTasks: state.longTasks.length,
      clockUnschaerfeMs: clock?.unschaerfeMs ?? null,
      maxGap: analyse.groessteLueckeMs,
      gapAb120: analyse.lueckenAb120Ms,
      top: analyse.topGesamt.slice(0, 4)
    }));
    // Die wichtigsten Spike-Details im Joblog halten, auch ohne Artefaktdownload.
    console.log("VIDEO-FRAME-CPU-SPITZEN " + JSON.stringify({
      paar: pair, modus: mode, lastart,
      topSpitzen: analyse.spitzen.slice(0, 5).map((gap) => ({
        beginnMs: gap.startMs, endeMs: gap.endMs, dauerMs: gap.dauerMs,
        tasks: gap.longTasks,
        cpuMs: gap.sampledCpuMs,
        funktionen: gap.topFunktionen.slice(0, 4),
        // Passive Observer-Zustellung folgt dem Schreib-Burst zeitlich nach.
        naheBatches: state.mutationBatches.filter(b =>
          b.deliveredAtMs >= gap.startMs - 100 &&
          b.deliveredAtMs <= gap.endMs + 200).slice(-10)
      })),
      topLongTasks: [...state.longTasks]
        .sort((a, b) => b.dauerMs - a.dauerMs).slice(0, 5)
    }));
    return result;
  } finally {
    if (profileStarted) {
      try { await cdp(id, "Profiler.stop"); } catch { /* Sitzung wird verworfen. */ }
    }
    try { await api("DELETE", "/session/" + id); }
    catch (error) { console.warn("Session schließen: " + String(error)); }
  }
}

const logs = [];
const error = { value: null };
const processHandle = spawn(driver, ["--port=9518"], {
  stdio: ["ignore", "pipe", "pipe"]
});
processHandle.on("error", (err) => { error.value = err; });
processHandle.stdout.on("data", (data) => logs.push(String(data)));
processHandle.stderr.on("data", (data) => logs.push(String(data)));
let fixture;
try {
  await mkdir(output, { recursive: true });
  await startDriver(processHandle, error, logs);
  fixture = await openFixture();
  const runs = [];
  for (let pair = 1; pair <= pairs; pair++) {
    const order = pair % 2 ? ["baseline", "extension"] :
      ["extension", "baseline"];
    const loadOrder = mutationMode === "both" ?
      (pair % 2 ? ["marker", "neutral"] : ["neutral", "marker"]) :
      [mutationMode];
    for (const lastart of loadOrder) {
      for (const mode of order) {
        const url = fixture.url + "?mutation-mode=" + lastart;
        runs.push(await browserlauf(url, mode, pair, lastart));
      }
    }
  }
  const alleGueltig = runs.every(run => run.gueltig &&
    (cpuProfile ? (run.analyse.achsePlausibel === true &&
      run.clock?.unschaerfeMs <= 100) :
      (run.clock === null && run.analyse.achsePlausibel === null)));
  const report = {
    version: 1, generatedAt: new Date().toISOString(),
    commit: process.env.GITHUB_SHA ?? null,
    chromium: spawnSync(chromium, ["--version"], { encoding: "utf8" }).stdout.trim(),
    pairs, mutationMode, cpuProfileMode, alleGueltig,
    hinweis: cpuProfile ?
      "V8-Sampling und Observer verändern Laufzeiten; keine automatische Freigabe." :
      "Ohne V8-Sampler, aber mit passivem DOM-/Long-Task-Observer; " +
      "keine Einzel-replaceData-Zeiten oder kausale Freigabe.",
    runs
  };
  await writeFile(path.join(output, "report.json"),
    JSON.stringify(report, null, 2) + "\n");
  console.log("VIDEO-FRAME-CPU-REPORT " + JSON.stringify({
    alleGueltig, cpuProfileMode,
    runs: runs.map((r) => ({
      modus: r.modus, paar: r.paar, lastart: r.lastart,
      mutationRecords: r.mutationRecords,
      markersVerblieben: r.markersVerblieben,
      maxBatch: Math.max(0, ...r.mutationBatches.map(b => b.recordCount)),
      maxTickAbstandMs: Math.max(0, ...r.timerTicks.map(t => t.tickIntervalMs ?? 0)),
      maxGap: r.analyse.groessteLueckeMs,
      gapAb120: r.analyse.lueckenAb120Ms,
      top15ExtensionCpuMs: cpuProfile ? r.analyse.topGesamt
        .filter((x) => x.name.startsWith("erweiterung |"))
        .reduce((sum, x) => sum + x.ms, 0) : null
    }))
  }));
  if (!alleGueltig) {
    throw new Error("Unvollständiger Browser- oder CPU-Zeitachsen-Nachweis; Rohdaten gesichert.");
  }
} finally {
  if (fixture?.server) {
    await new Promise((resolve) => fixture.server.close(resolve));
  }
  if (processHandle.exitCode === null) {
    processHandle.kill("SIGTERM");
    await Promise.race([
      new Promise((resolve) => processHandle.once("exit", resolve)),
      sleep(2_000)
    ]);
    if (processHandle.exitCode === null) processHandle.kill("SIGKILL");
  }
}
