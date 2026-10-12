import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn, spawnSync } from "node:child_process";
import { createVerified60FpsWebm } from "./verified-60fps-media.mjs";
import { analysiereVideoCpu, frameLuecken } from "./video-frame-cpu-metrics.mjs";
import {startChromiumBrowserTrace} from "./chromium-browser-trace.mjs";

// Lokale gepaarte Videodiagnose; V8-Profilierung nur in Chromium.
const basis = process.cwd();
const browserIndex = process.argv.indexOf("--browser");
const browser = browserIndex === -1 ? "chromium" : process.argv[browserIndex + 1];
if (browser !== "chromium" && browser !== "firefox") throw new Error("--browser erlaubt chromium oder firefox.");
const extension = path.join(basis, "dist", browser);
const driverPort = Number(process.env.WEBDRIVER_PORT ?? 9518);
if (!Number.isInteger(driverPort) || driverPort < 1 || driverPort > 65535) throw new Error("Ungültiger WEBDRIVER_PORT.");
const base = "http://127.0.0.1:" + driverPort;
const pairsIndex = process.argv.indexOf("--pairs");
const pairs = pairsIndex === -1 ? 2 : Number(process.argv[pairsIndex + 1]);
if (![1, 2, 3].includes(pairs)) throw new Error("--pairs erlaubt 1 bis 3.");
const mutationModeIndex = process.argv.indexOf("--mutation-mode");
const mutationMode = mutationModeIndex === -1 ? "marker" : process.argv[mutationModeIndex + 1];
if (!["marker", "neutral", "both"].includes(mutationMode)) {
  throw new Error("--mutation-mode erlaubt marker, neutral oder both.");
}
const cpuIndex = process.argv.indexOf("--cpu-profile");
const cpuProfileMode = cpuIndex === -1 ? browser === "chromium" ? "on" : "off" : process.argv[cpuIndex + 1];
if (!["on", "off"].includes(cpuProfileMode)) {
  throw new Error("--cpu-profile erlaubt on oder off.");
}
const cpuProfile = cpuProfileMode === "on";
const browserTrace = process.argv.includes("--browser-trace");
if (browserTrace && browser !== "chromium") throw new Error("--browser-trace erfordert Chromium.");
const allocationProfile = process.argv.includes("--allocation-profile");
if (allocationProfile && browser !== "chromium") throw new Error("--allocation-profile erfordert Chromium.");
const waitStrategyIndex = process.argv.indexOf("--wait-strategy");
const waitStrategy = waitStrategyIndex < 0 ? "poll" : process.argv[waitStrategyIndex + 1];
if (!["poll", "async"].includes(waitStrategy)) throw new Error("--wait-strategy erlaubt poll oder async.");
const debuggerAddresses = new Map();
const throttleIndex = process.argv.indexOf("--cpu-throttle");
const cpuThrottle = throttleIndex === -1 ? 1 : Number(process.argv[throttleIndex + 1]);
if (!Number.isInteger(cpuThrottle) || cpuThrottle < 1 || cpuThrottle > 16) {
  throw new Error("--cpu-throttle erlaubt ganze Zahlen von 1 bis 16.");
}
if (browser === "firefox" && (cpuProfile || cpuThrottle !== 1)) {
  throw new Error("Firefox unterstützt hier kein CDP-Sampling oder CPU-Throttling; --cpu-profile off --cpu-throttle 1 verwenden.");
}
let browserVersion;
const output = path.resolve(basis, "artifacts/video-frame-cpu");
const firefoxXpi = path.join(output, "firefox-video-probe.xpi");
const html = "<!doctype html><html lang=\"de\"><head><meta charset=\"utf-8\">\n<title>Videoframe-CPU-Korrelation</title></head><body>\n<p id=\"static-target\">Nutzer:innen</p>\n<video id=\"video\" muted autoplay playsinline preload=\"auto\" src=\"/video.webm\"\nstyle=\"width:320px;height:180px;background:#111\"></video>\n<div id=\"dynamic-root\"></div>\n<script>\n(() => {\n  const video = document.querySelector(\"#video\");\n  const mutationMode = new URL(location.href).searchParams.get(\"mutation-mode\");\n  if (mutationMode !== \"marker\" && mutationMode !== \"neutral\") {\n    throw new Error(\"Unbekannte Mutationslast: \" + mutationMode);\n  }\n  const metrics = { frameTimes: [], frameMetadata: [], longTasks: [],\n    timerTicks: [], errors: [], framesSupported: typeof video.requestVideoFrameCallback === \"function\",\n    longTaskSupported: false, done: false,\n    mutationMode, mutationRecords: {childList: 0, characterData: 0},\n    mutationBatches: [] };\n  window.__videoCpuMetrics = metrics;\n  const nodes = [];\n  const root = document.querySelector(\"#dynamic-root\");\n  for (let index = 0; index < 480; index++) {\n    const element = document.createElement(\"span\");\n    element.textContent = \"Neutraler Inhalt \" + index;\n    root.append(element);\n    nodes.push(element);\n  }\n  // Beide Lastformen erhalten denselben passiven Observer-Messaufwand.\n  new MutationObserver((records) => {\n    const deliveredAtMs = performance.now();\n    let childList = 0;\n    let characterData = 0;\n    for (const record of records) {\n      if (record.type === \"childList\") { metrics.mutationRecords.childList++; childList++; }\n      if (record.type === \"characterData\") { metrics.mutationRecords.characterData++; characterData++; }\n    }\n    // Die Zustellung erfolgt nach dem Schreib-Burst, nicht bei jedem replaceData().\n    metrics.mutationBatches.push({\n      deliveredAtMs, recordCount: records.length, childList, characterData,\n      observerMs: performance.now() - deliveredAtMs\n    });\n  }).observe(root, {subtree: true, characterData: true, childList: true});\n  try {\n    const observer = new PerformanceObserver((list) => {\n      for (const task of list.getEntries()) {\n        metrics.longTasks.push({ startMs: task.startTime, dauerMs: task.duration });\n      }\n    });\n    observer.observe({type:\"longtask\"});\n    metrics.longTaskSupported = PerformanceObserver.supportedEntryTypes?.includes(\"longtask\") === true;\n  } catch { /* Nicht unterstützte Long-Task-API bleibt unbewertet. */ }\n  if (metrics.framesSupported) {\n    const onFrame = (now, metadata) => {\n      metrics.frameTimes.push(Number(now));\n      metrics.frameMetadata.push({\n        nowMs: Number(now),\n        erwarteteAnzeigeMs: Number(metadata.expectedDisplayTime),\n        zeitImVideoS: Number(metadata.mediaTime),\n        angezeigteFrames: Number(metadata.presentedFrames)\n      });\n      if (!metrics.done) video.requestVideoFrameCallback(onFrame);\n    };\n    video.requestVideoFrameCallback(onFrame);\n  }\n  for (const event of [\"error\", \"stalled\", \"waiting\"]) {\n    video.addEventListener(event, () => {\n      metrics.errors.push(event + \" bei \" + performance.now().toFixed(1) + \" ms\");\n    });\n  }\n  video.play().catch(error => metrics.errors.push(\"play: \" + String(error)));\n  const startMs = performance.now();\n  const timer = setInterval(() => {\n    const tick = metrics.timerTicks.length;\n    const startedAt = performance.now();\n    for (let offset = 0; offset < 48; offset++) {\n      const index = (tick * 48 + offset) % nodes.length;\n      nodes[index].textContent = (mutationMode === \"marker\" ? \"Nutzer:innen \" : \"Neutraler Inhalt \") + tick + \" / \" + offset;\n    }\n    const previous = metrics.timerTicks[metrics.timerTicks.length - 1];\n    metrics.timerTicks.push({ atMs: startedAt,\n      tickIntervalMs: previous ? startedAt - previous.atMs : null,\n      workMs: performance.now() - startedAt });\n  }, 50);\n  setTimeout(() => {\n    clearInterval(timer);\n    metrics.done = true;\n  }, 8000);\n  window.__videoCpuState = () => {\n    const quality = video.getVideoPlaybackQuality?.();\n    return { ...metrics, staticText: document.querySelector(\"#static-target\").textContent,\n      currentTime: video.currentTime, readyState: video.readyState,\n      width: video.videoWidth, height: video.videoHeight,\n      dropped: quality?.droppedVideoFrames ?? null,\n      visibility: document.visibilityState,\n      markersVerblieben: nodes.filter((node) => node.textContent.includes(\"Nutzer:innen\")).length,\n      korrigierteMarker: nodes.filter((node) => node.textContent.startsWith(\"Nutzer \")).length };\n  };\n})();\n</script></body></html>";
if (!existsSync(path.join(extension, "manifest.json"))) {
  throw new Error("Erweiterung fehlt: npm run build:" + browser + ".");
}
function executable(environment, name) {
  const configured = process.env[environment];
  if (configured && existsSync(configured) && statSync(configured).isFile()) return configured;
  if (configured && existsSync(path.join(configured, name))) return path.join(configured, name);
  const found = spawnSync("which", [name], { encoding: "utf8" });
  if (found.status === 0 && found.stdout.trim()) return found.stdout.trim();
  throw new Error("Programm nicht gefunden: " + name);
}
const chromium = browser === "chromium" ? process.env.CHROMIUM_BIN ?? executable("CHROMIUM_BIN", "chromium") : undefined;
const driver = browser === "firefox" ? executable("GECKOWEBDRIVER", "geckodriver") : executable("CHROMEWEBDRIVER", "chromedriver");
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
  throw new Error("WebDriver nicht erreichbar.");
}
async function openSession(withExtension) {
  if (browser === "firefox") {
    const result = await api("POST", "/session", {capabilities: {alwaysMatch: {
      browserName: "firefox", pageLoadStrategy: "eager",
      timeouts: {implicit: 0, pageLoad: 20_000, script: 15_000},
      "moz:firefoxOptions": {
        ...(process.env.FIREFOX_BIN ? {binary: process.env.FIREFOX_BIN} : {}),
        args: ["-headless"], prefs: {"media.autoplay.default": 0}
      }
    }}});
    if (!result?.sessionId) throw new Error("Sitzung ohne ID.");
    browserVersion = result.capabilities?.browserVersion;
    try {
      if (withExtension) await api("POST", "/session/" + result.sessionId + "/moz/addon/install", {
        addon: readFileSync(firefoxXpi).toString("base64"), temporary: true
      });
      return result.sessionId;
    } catch (error) {
      try {await api("DELETE", "/session/" + result.sessionId);} catch { /* Driver wird geschlossen. */ }
      throw error;
    }
  }
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
  browserVersion = result.capabilities?.browserVersion;
  await cdp(result.sessionId, "Emulation.setCPUThrottlingRate", { rate: cpuThrottle });
  if (browserTrace) debuggerAddresses.set(result.sessionId, result.capabilities?.["goog:chromeOptions"]?.debuggerAddress);
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
  let allocationStarted = false;
  let trace;
  try {
    if (browserTrace) trace = await startChromiumBrowserTrace(debuggerAddresses.get(id));
    if (cpuProfile) {
      await cdp(id, "Performance.enable");
      await cdp(id, "Profiler.enable");
      await cdp(id, "Profiler.setSamplingInterval", { interval: 1000 });
      await cdp(id, "Profiler.start");
      profileStarted = true;
    }
    if (allocationProfile) {
      await cdp(id, "HeapProfiler.enable");
      await cdp(id, "HeapProfiler.startSampling", {
        samplingInterval: 16_384,
        includeObjectsCollectedByMajorGC: true,
        includeObjectsCollectedByMinorGC: true
      });
      allocationStarted = true;
    }
    // Start sampling before navigation so content-script initialization and
    // early page Long Tasks are covered. Align to the new document's clock.
    await api("POST", "/session/" + id + "/url", { url });
    const clock = cpuProfile ? await abgleichZeitachsen(id) : null;
    if (waitStrategy === "async") {
      await api("POST", "/session/" + id + "/timeouts", {script: 25_000});
      const completed = await api("POST", "/session/" + id + "/execute/async", {
        script: "const done=arguments[arguments.length-1];const deadline=performance.now()+21000;" +
          "const poll=()=>{if(window.__videoCpuMetrics?.done===true)done(true);" +
          "else if(performance.now()>=deadline)done(false);else setTimeout(poll,200);};poll();",
        args: []
      });
      if (!completed) throw new Error("Video-Fixturn nicht abgeschlossen.");
    } else {
      const deadline = Date.now() + 21_000;
      while (Date.now() < deadline) {
        if (await js(id, "return window.__videoCpuMetrics?.done === true;")) break;
        await sleep(200);
      }
    }
    const state = await js(id, "return window.__videoCpuState?.();");
    if (!state?.done) throw new Error("Video-Fixturn nicht abgeschlossen.");
    const traceFile = browserTrace ? "trace-" + pair + "-" + lastart + "-" + mode + ".json" : null;
    const allocationProfileFile = allocationProfile
      ? "allocation-" + pair + "-" + lastart + "-" + mode + ".json" : null;
    // Keep frame/CPU metrics from the load window. Separately require the
    // final visible text to complete after writes stop, including all nodes.
    let settledState = state;
    const settlingStarted = performance.now();
    if (mode === "extension" && lastart === "marker") {
      while (settledState.markersVerblieben > 0 && performance.now() - settlingStarted < 4_000) {
        await sleep(50);
        settledState = await js(id, "return window.__videoCpuState?.();");
        if (!settledState?.done) throw new Error("Unvollständiger dynamischer Abschlusszustand.");
      }
    }
    const completeAfterLoad = mode !== "extension" || lastart !== "marker" ||
      (settledState.markersVerblieben === 0 && settledState.korrigierteMarker === 480);
    const settleAfterLoadMs = Math.round(performance.now() - settlingStarted);
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
    // Fetching a trace stream can take time. Keep it outside both the
    // completion deadline above and the active V8 sampling window.
    if (allocationProfile) {
      const response = await cdp(id, "HeapProfiler.stopSampling");
      allocationStarted = false;
      if (!response?.profile?.head || !Array.isArray(response.profile.samples) ||
          response.profile.samples.length === 0) {
        throw new Error("Allokationsprofil enthält keine Samples.");
      }
      await writeFile(path.join(output, allocationProfileFile), JSON.stringify(response.profile));
    }
    if (trace) {await trace.save(path.join(output, traceFile)); trace = undefined;}
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
      markersVerbliebenNachAuslauf: settledState.markersVerblieben,
      korrigierteMarkerNachAuslauf: settledState.korrigierteMarker,
      completeAfterLoad,
      traceFile,
      allocationProfileFile,
      settleAfterLoadMs,
      rawMaximumFrameGapMs: frameLuecken(state.frameTimes, 1, 0)[0]?.dauerMs ?? 0,
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
      p95FrameGapMs: p95, dropped: state.dropped,
      longTasks: state.longTaskSupported ? state.longTasks.length : null,
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
    if (allocationStarted) {
      try {await cdp(id, "HeapProfiler.stopSampling");} catch { /* Sitzung wird verworfen. */ }
    }
    trace?.cancel();
    debuggerAddresses.delete(id);
    if (profileStarted) {
      try { await cdp(id, "Profiler.stop"); } catch { /* Sitzung wird verworfen. */ }
    }
    try { await api("DELETE", "/session/" + id); }
    catch (error) { console.warn("Session schließen: " + String(error)); }
  }
}

const logs = [];
const error = { value: null };
const processHandle = spawn(driver, ["--port=" + driverPort], {
  stdio: ["ignore", "pipe", "pipe"]
});
processHandle.on("error", (err) => { error.value = err; });
processHandle.stdout.on("data", (data) => logs.push(String(data)));
processHandle.stderr.on("data", (data) => logs.push(String(data)));
let fixture;
try {
  await mkdir(output, { recursive: true });
  await startDriver(processHandle, error, logs);
  if (browser === "firefox") {
    const {cmd} = await import("web-ext");
    await cmd.build({sourceDir: extension, artifactsDir: output,
      filename: path.basename(firefoxXpi), overwriteDest: true}, {showReadyMessage: false});
  }
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
  const alleTexteNachAuslaufVollstaendig = runs.every(run => run.completeAfterLoad);
  const report = {
    version: 2, generatedAt: new Date().toISOString(),
    alleTexteNachAuslaufVollstaendig,
    commit: process.env.GITHUB_SHA ?? null,
    browser, browserVersion: browserVersion ?? null,
    browserSource: process.env.SPRACHVERSTAND_TEST_BROWSER_SOURCE ?? "configured-or-system",
    chromium: browser === "chromium" ? browserVersion ?? null : null,
    pairs, mutationMode, cpuProfileMode, profileIncludesNavigation: cpuProfile,
    browserTrace, allocationProfile, waitStrategy, cpuThrottle, alleGueltig,
    allocationSamplingIntervalBytes: allocationProfile ? 16_384 : null,
    allocationHinweis: allocationProfile
      ? "Allokationssampling inklusive gesammelter Objekte verändert Laufzeiten; keine automatische Freigabe." : null,
    traceHinweis: browserTrace ? "Browsertrace aktiv; Render-/Compilerdiagnostik verändert Laufzeiten." : null,
    hinweis: cpuProfile ?
      "V8-Sampling und Observer verändern Laufzeiten; keine automatische Freigabe." :
      "Ohne V8-Sampler, aber mit passivem DOM-/Long-Task-Observer; " +
      "keine Einzel-replaceData-Zeiten oder kausale Freigabe.",
    runs
  };
  await writeFile(path.join(output, "report.json"),
    JSON.stringify(report, null, 2) + "\n");
  console.log("VIDEO-FRAME-CPU-REPORT " + JSON.stringify({
    alleGueltig, alleTexteNachAuslaufVollstaendig, cpuProfileMode, browserTrace, allocationProfile,
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
  if (!alleTexteNachAuslaufVollstaendig) {
    throw new Error("Dynamische Texte nach Auslauf nicht vollständig korrigiert; Rohdaten gesichert.");
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
