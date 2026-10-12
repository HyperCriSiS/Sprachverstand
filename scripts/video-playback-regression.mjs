import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import {mkdir, writeFile} from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn, spawnSync } from "node:child_process";
import { createVerified60FpsWebm } from "./verified-60fps-media.mjs";
import { videoGapEpisodes, videoCallbackGapEpisodes } from "./video-gap-episodes.mjs";
import {startChromiumBrowserTrace} from "./chromium-browser-trace.mjs";

const root = process.cwd();
const browserIndex = process.argv.indexOf("--browser");
const browser = browserIndex === -1 ? "chromium" : process.argv[browserIndex + 1];
if (browser !== "chromium" && browser !== "firefox") throw new Error("--browser erlaubt chromium oder firefox.");
const driverPort = Number(process.env.WEBDRIVER_PORT ?? 9515);
if (!Number.isInteger(driverPort) || driverPort < 1 || driverPort > 65535) throw new Error("Ungültiger WEBDRIVER_PORT.");
const driverBase = `http://127.0.0.1:${driverPort}`;
const extensionDir = process.env.VIDEO_EXTENSION_DIR
  ? path.resolve(process.env.VIDEO_EXTENSION_DIR) : path.join(root, "dist", browser);
const firefoxUuid = "1a84d6d8-77d0-4c83-9490-18fc51c5bb5a";
const firefoxArtifacts = process.env.VIDEO_ARTIFACTS_DIR
  ? path.resolve(root, process.env.VIDEO_ARTIFACTS_DIR) : path.join(root, "artifacts/video-playback");
const firefoxXpi = path.join(firefoxArtifacts, "firefox-video-probe.xpi");
const videoPath = path.join(
  root,
  "tests",
  "browser",
  "video-playback-30fps.webm.b64"
);
const observationMs = 8_000;
// Der Standard-CI-Vertrag bleibt 30 FPS; 60 FPS ist eine separate manuelle Diagnose.
const fpsArgumentIndex = process.argv.indexOf("--fps");
const diagnosticFps = fpsArgumentIndex < 0 ? 30 :
  Number(process.argv[fpsArgumentIndex + 1]);
// Nur manuelle Diagnose: Wechselkosten und tatsächliche Cue-Latenz trennen.
const diagnoseCuePhases = process.argv.includes("--diagnose-cue-phases");
// Im manuellen Diagnoseworkflow auch bei rotem Frame-Gate getrennt messen.
const subtitleOnly = process.argv.includes("--subtitle-only");
// Separate, opt-in sustained load; ordinary video CI remains unchanged.
const subtitleDomLoad = process.argv.includes("--subtitle-dom-load");
const subtitleBaseline = process.argv.includes("--subtitle-baseline");
const browserTrace = process.argv.includes("--browser-trace");
const videoPairOrder = process.env.VIDEO_PAIR_ORDER || "baseline-first";
if (!["baseline-first", "extension-first"].includes(videoPairOrder)) {
  throw new Error("VIDEO_PAIR_ORDER erlaubt nur baseline-first oder extension-first.");
}
const mainTaskDiagnostics = process.argv.includes("--diagnose-main-tasks");
const domPhaseDiagnostics = process.argv.includes("--diagnose-dom-phases");
const engineControl = process.env.VIDEO_ENGINE_CONTROL || "standard";
if (!["standard", "no-concurrent-recompilation"].includes(engineControl)) {
  throw new Error("Unbekannte Engine-Gegenprobe.");
}
if (engineControl !== "standard" && (browser !== "chromium" || subtitleOnly || !browserTrace)) {
  throw new Error("Engine-Gegenprobe benötigt einen ausdrücklich instrumentierten vollständigen Chromium-Videotrace.");
}
if (!domPhaseDiagnostics && existsSync(path.join(extensionDir, "dom-phase-diagnostic.json"))) {
  throw new Error("Der DOM-Diagnosebuild muss ausdrücklich mit --diagnose-dom-phases gekennzeichnet werden.");
}
if (domPhaseDiagnostics && (browser !== "chromium" || subtitleOnly ||
    !existsSync(path.join(extensionDir, "dom-phase-diagnostic.json")))) {
  throw new Error("DOM-Phasendiagnose benötigt den isolierten Chromium-Diagnosebuild und den vollständigen Videostartvergleich.");
}
const focusedStart = process.argv.includes("--focused-start");
if (mainTaskDiagnostics && subtitleOnly) throw new Error("Main-Task-Diagnose benötigt den vollständigen Videostartvergleich.");
const debuggerAddresses = new Map();
if (browserTrace && (browser !== "chromium" || (subtitleOnly && !subtitleDomLoad))) {
  throw new Error("Browsertrace benötigt Chromium und ein vollständiges Video- oder Untertitel-/DOM-Messfenster.");
}
if (subtitleBaseline && (!subtitleOnly || !subtitleDomLoad)) {
  throw new Error("--subtitle-baseline benötigt --subtitle-only --subtitle-dom-load.");
}
const subtitleDurationMs = Number(process.env.SUBTITLE_DURATION_MS ?? 30_000);
const subtitleLoad = process.env.SUBTITLE_LOAD ?? "stress";
if (!Number.isInteger(subtitleDurationMs) || subtitleDurationMs < 30_000 ||
    subtitleDurationMs > 600_000 || !["none", "moderate", "stress", "burst", "removal"].includes(subtitleLoad)) {
  throw new Error("Untertiteldiagnose: Dauer 30000..600000 ms, Last none/moderate/stress/burst/removal erforderlich.");
}
if (diagnosticFps !== 30 && diagnosticFps !== 60) {
  throw new Error("--fps erlaubt ausschließlich 30 oder 60.");
}

if (!existsSync(path.join(extensionDir, "manifest.json"))) {
  throw new Error(
    "Der Build fehlt. Vor dem Videotest zuerst npm run build:" + browser + " ausführen."
  );
}

function command(...names) {
  for (const name of names) {
    const result = spawnSync("which", [name], { encoding: "utf8" });
    if (result.status === 0 && result.stdout.trim()) {
      return result.stdout.trim();
    }
  }
  throw new Error(`Keines der Programme wurde gefunden: ${names.join(", ")}`);
}

function executable(environmentName, fallback) {
  const configured = process.env[environmentName];
  if (configured) {
    if (existsSync(configured) && statSync(configured).isFile()) {
      return configured;
    }
    const nested = path.join(configured, fallback);
    if (existsSync(nested)) {
      return nested;
    }
  }
  return fallback;
}

const driver = browser === "firefox" ? executable("GECKOWEBDRIVER", "geckodriver") : executable("CHROMEWEBDRIVER", "chromedriver");
const chromium = browser === "chromium" ?
  process.env.CHROMIUM_BIN ?? command("chromium", "chromium-browser") : undefined;

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function request(method, pathname, body) {
  const response = await fetch(`${driverBase}${pathname}`, {
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

let driverStartError;
async function waitForDriver(processHandle, logs) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (driverStartError) {
      throw new Error(
        `ChromeDriver konnte nicht gestartet werden: ${driverStartError.message}\n${logs.join("")}`
      );
    }
    if (processHandle.exitCode !== null) {
      throw new Error(`ChromeDriver wurde vorzeitig beendet.\n${logs.join("")}`);
    }
    try {
      const response = await fetch(`${driverBase}/status`);
      if (response.ok) {
        return;
      }
    } catch {
      // Der Treiber startet noch.
    }
    await sleep(100);
  }
  throw new Error(`ChromeDriver wurde nicht rechtzeitig bereit.\n${logs.join("")}`);
}

function sessionId(response) {
  const id = response?.value?.sessionId ?? response?.sessionId;
  if (typeof id !== "string" || !id) {
    throw new Error(`WebDriver lieferte keine Session-ID: ${JSON.stringify(response)}`);
  }
  return id;
}

function fixtureHtml() {
  return `<!doctype html>
<html lang="de">
<meta charset="utf-8">
<title>Sprachverstand Video-Regression</title>
<body>
<p id="static-target">Nutzer:innen</p>
<video id="video" muted autoplay playsinline preload="auto" src="/video.webm"
  style="width:320px;height:180px;background:#111"></video>
<div id="dynamic-root"></div>
<script>
(() => {
  const video = document.querySelector("#video");
  const root = document.querySelector("#dynamic-root");
  const metrics = {
    frameTimes: [],
    frameSamples: [],
    waiting: 0,
    stalled: 0,
    playing: 0,
    errors: [],
    mutationTicks: 0
  };
  window.__sprachverstandVideoMetrics = metrics;
  window.__sprachverstandVideoDone = false;
  if (${browserTrace || mainTaskDiagnostics}) {
    metrics.longTasks = [];
    metrics.visibilityEvents = [];
    const visibility = () => metrics.visibilityEvents.push({nowMs: performance.now(),
      state: document.visibilityState, focused: document.hasFocus()});
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("focus", visibility); window.addEventListener("blur", visibility);
    visibility();
    metrics.longTaskSupported = PerformanceObserver.supportedEntryTypes?.includes("longtask") === true;
    if (metrics.longTaskSupported) new PerformanceObserver(list => {
      for (const task of list.getEntries()) metrics.longTasks.push({startMs: task.startTime, durationMs: task.duration});
    }).observe({type: "longtask"});
  }

  const nodes = [];
  for (let index = 0; index < 480; index += 1) {
    const span = document.createElement("span");
    span.textContent = "Neutraler Inhalt " + index;
    root.append(span);
    nodes.push(span);
  }

  const timer = setInterval(() => {
    const tick = metrics.mutationTicks;
    for (let offset = 0; offset < 48; offset += 1) {
      const index = (tick * 48 + offset) % nodes.length;
      nodes[index].textContent = "Nutzer:innen " + tick + " / " + offset;
    }
    metrics.mutationTicks += 1;
  }, 50);

  for (const name of ["waiting", "stalled", "playing"]) {
    video.addEventListener(name, () => { metrics[name] += 1; });
  }
  video.addEventListener("error", () => {
    metrics.errors.push(String(video.error?.message || video.error?.code || "Video-Fehler"));
  });

  if (typeof video.requestVideoFrameCallback === "function") {
    const onFrame = (now, metadata) => {
      const callbackAtMs = ${browserTrace || mainTaskDiagnostics} ? performance.now() : undefined;
      metrics.frameTimes.push(Number(now));
      const sample = {nowMs: Number(now), mediaTime: metadata.mediaTime,
        presentedFrames: metadata.presentedFrames};
      if (${browserTrace || mainTaskDiagnostics}) Object.assign(sample, {
        callbackAtMs, presentationTimeMs: metadata.presentationTime,
        expectedDisplayTimeMs: metadata.expectedDisplayTime,
        processingDurationMs: typeof metadata.processingDuration === "number"
          ? metadata.processingDuration * 1000 : null,
        visibilityAtFrame: document.visibilityState, focusedAtFrame: document.hasFocus()});
      metrics.frameSamples.push(sample);
      if (!window.__sprachverstandVideoDone) {
        video.requestVideoFrameCallback(onFrame);
      }
    };
    video.requestVideoFrameCallback(onFrame);
  }

  video.play().catch((error) => {
    metrics.errors.push(String(error?.message || error));
  });

  setTimeout(() => {
    clearInterval(timer);
    window.__sprachverstandVideoDone = true;
  }, ${observationMs});
})();
</script>
</body>
</html>`;
}

function subtitleFixtureHtml() {
  return `<!doctype html>
<html lang="de"><meta charset="utf-8">
<title>Untertitel mit Videowiedergabe</title>
<p id="static-target">Nutzer:innen</p>
<video id="video" muted autoplay loop playsinline preload="auto" src="/video.webm"></video>
<div class="ytp-caption-window-container" aria-label="Untertitel">
  <span id="subtitle-target" class="ytp-caption-segment">Nutzer:innen im Untertitel 0</span>
</div>
<script>
(() => {
  const video = document.querySelector("#video");
  const subtitle = document.querySelector("#subtitle-target");
  window.__subtitleTicks = 0;
  window.__subtitleCueIssuedAt = null;
  window.__subtitleCueLatenciesMs = [];
  window.__subtitleCueObservedTicks = new Set();
  window.__subtitleCueRecords = [];
  window.__subtitleLongTasks = [];
  window.__controlledCueMode = false;
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__subtitleLongTasks.push({
          startMs: entry.startTime,
          durationMs: entry.duration
        });
      }
    }).observe({ type: "longtask" });
  } catch { /* Fehlende Longtask-Unterstützung ist kein Testfehler. */ }
  window.__issueSubtitleCue = (source, text) => {
    window.__subtitleTicks += 1;
    const tick = window.__subtitleTicks;
    const issuedAt = performance.now();
    window.__subtitleCueIssuedAt = issuedAt;
    window.__subtitleCueRecords.push({
      tick, source, issuedAt,
      visibilityAtIssue: document.visibilityState,
      focusAtIssue: document.hasFocus(),
      correctedAt: null,
      latencyMs: null,
      visibilityAtCorrection: null
    });
    subtitle.textContent = text ?? "Nutzer:innen im Untertitel " + tick;
    return tick;
  };
  // Die erste Mutation ist das originale Cue, die folgende nach Korrektur
  // liefert die tatsächlich verstrichene Zeit bis zum korrigierten Text.
  new MutationObserver(() => {
    const tick = window.__subtitleTicks;
    if (subtitle.textContent.startsWith("Nutzer im Untertitel ") &&
        window.__subtitleCueIssuedAt !== null &&
        !window.__subtitleCueObservedTicks.has(tick)) {
      window.__subtitleCueObservedTicks.add(tick);
      const correctedAt = performance.now();
      const latencyMs = Math.max(0, correctedAt - window.__subtitleCueIssuedAt);
      window.__subtitleCueLatenciesMs.push(latencyMs);
      const record = window.__subtitleCueRecords.find((item) => item.tick === tick);
      if (record) {
        record.correctedAt = correctedAt;
        record.latencyMs = latencyMs;
        record.visibilityAtCorrection = document.visibilityState;
      }
    }
  }).observe(subtitle, { subtree: true, characterData: true, childList: true });
  window.__videoTimeUpdates = 0;
  video.addEventListener("timeupdate", () => {
    window.__videoTimeUpdates += 1;
    if (window.__videoTimeUpdates % 2 === 0 && !window.__controlledCueMode) {
      window.__issueSubtitleCue("video-timeupdate");
    }
  });
  video.play().catch(error => { window.__subtitlePlaybackError = String(error); });
})();
</script>`;
}

function startServer() {
  const html = Buffer.from(fixtureHtml(), "utf8");
  const subtitles = Buffer.from(subtitleFixtureHtml(), "utf8");
  const video = diagnosticFps === 60
    ? createVerified60FpsWebm()
    : Buffer.from(readFileSync(videoPath, "utf8").trim(), "base64");
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    if (url.pathname === "/video-playback.html") {
      res.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store"
      });
      res.end(html);
      return;
    }
    if (url.pathname === "/subtitle-video.html") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
      res.end(subtitles);
      return;
    }
    if (url.pathname === "/video.webm") {
      res.writeHead(200, {
        "content-type": "video/webm",
        "content-length": String(video.length),
        "cache-control": "no-store"
      });
      res.end(video);
      return;
    }
    res.writeHead(404);
    res.end();
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
        url: `http://127.0.0.1:${address.port}/video-playback.html`,
        subtitleUrl: `http://127.0.0.1:${address.port}/subtitle-video.html`
      });
    });
  });
}

async function createSession(withExtension) {
  if (browser === "firefox") {
    const addonId = JSON.parse(readFileSync(path.join(extensionDir, "manifest.json"), "utf8"))
      .browser_specific_settings.gecko.id;
    const response = await request("POST", "/session", {capabilities: {alwaysMatch: {
      browserName: "firefox", pageLoadStrategy: "eager",
      timeouts: {implicit: 0, pageLoad: 20_000, script: 15_000},
      "moz:firefoxOptions": {
        ...(process.env.FIREFOX_BIN ? {binary: process.env.FIREFOX_BIN} : {}),
        args: ["-headless"], prefs: {
          "media.autoplay.default": 0,
          "extensions.webextensions.uuids": JSON.stringify({[addonId]: firefoxUuid})
        }
      }
    }}});
    const id = sessionId(response);
    try {
      if (withExtension) await request("POST", `/session/${id}/moz/addon/install`, {
        addon: readFileSync(firefoxXpi).toString("base64"), temporary: true
      });
      return id;
    } catch (error) {
      try {await request("DELETE", `/session/${id}`);} catch { /* Driver wird geschlossen. */ }
      throw error;
    }
  }
  const args = [
    "--headless=new",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--no-first-run",
    "--disable-default-apps",
    "--autoplay-policy=no-user-gesture-required",
    "--mute-audio",
    "--window-size=1280,720"
  ];
  if (engineControl !== "standard") args.push("--js-flags=--no-concurrent-recompilation");
  if (withExtension) {
    args.push(
      `--disable-extensions-except=${extensionDir}`,
      `--load-extension=${extensionDir}`
    );
  }
  const response = await request("POST", "/session", {
      capabilities: {
        alwaysMatch: {
          browserName: "chrome",
          pageLoadStrategy: "eager",
          timeouts: { implicit: 0, pageLoad: 20_000, script: 15_000 },
          "goog:chromeOptions": { binary: chromium, args }
        }
      }
    });
  const id = sessionId(response);
  if (browserTrace) {
    try {
      const commandLine = (await request("POST", `/session/${id}/goog/cdp/execute`, {
        cmd:"Browser.getBrowserCommandLine", params:{}
      })).value;
      const present = commandLine?.arguments?.includes("--js-flags=--no-concurrent-recompilation");
      if (present !== (engineControl !== "standard")) throw new Error("Engine-Gegenprobe: Chromium-Argument nicht verifiziert.");
    } catch (error) {
      try {await request("DELETE", `/session/${id}`);} catch { /* Driver wird geschlossen. */ }
      throw error;
    }
  }
  if (browserTrace) debuggerAddresses.set(id, response.value?.capabilities?.["goog:chromeOptions"]?.debuggerAddress);
  return id;
}

async function execute(id, script) {
  return (
    await request("POST", `/session/${id}/execute/sync`, {
      script,
      args: []
    })
  ).value;
}

async function waitForCompletion(id) {
  const deadline = Date.now() + observationMs + 10_000;
  while (Date.now() < deadline) {
    if (
      await execute(
        id,
        "return Boolean(window.__sprachverstandVideoDone);"
      )
    ) {
      await sleep(350);
      return;
    }
    await sleep(100);
  }
  throw new Error("Der lokale Videotest wurde nicht rechtzeitig abgeschlossen.");
}

function percentile(values, fraction) {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[
    Math.min(
      sorted.length - 1,
      Math.max(0, Math.ceil(sorted.length * fraction) - 1)
    )
  ];
}

function summarize(frameTimes) {
  const gaps = [];
  for (let index = 1; index < frameTimes.length; index += 1) {
    const gap = Number(frameTimes[index]) - Number(frameTimes[index - 1]);
    if (Number.isFinite(gap) && gap >= 0) {
      gaps.push(gap);
    }
  }
  // Start- und Decoderanlauf nicht als Ruckeln bewerten.
  const settled = gaps.slice(Math.min(15, gaps.length));
  return {
    callbacks: frameTimes.length,
    p95GapMs: percentile(settled, 0.95),
    maximumGapMs: settled.length ? Math.max(...settled) : 0,
    gapsOver120Ms: settled.filter((gap) => gap > 120).length
  };
}

async function collect(id, mode) {
  const state = await execute(
    id,
    `
      let domPhases;
      if (${domPhaseDiagnostics && mode === "extension"}) {
        document.dispatchEvent(new Event("__svPhaseDiagnosticCollect"));
        domPhases = JSON.parse(document.documentElement.getAttribute("data-sv-phase-diagnostic") || "null");
        if (!domPhases?.methods?.start?.calls || domPhases.slow?.length > 128) {
          throw new Error("DOM-Phasendaten fehlen oder sind ungültig.");
        }
      }
      const video = document.querySelector("#video");
      const metrics = window.__sprachverstandVideoMetrics || {};
      const quality = typeof video?.getVideoPlaybackQuality === "function"
        ? video.getVideoPlaybackQuality()
        : undefined;
      return {
        ...(domPhases ? {domPhases} : {}),
        staticText: document.querySelector("#static-target")?.textContent || "",
        currentTime: Number(video?.currentTime || 0),
        readyState: Number(video?.readyState || 0),
        videoWidth: Number(video?.videoWidth || 0),
        videoHeight: Number(video?.videoHeight || 0),
        frameTimes: Array.isArray(metrics.frameTimes) ? metrics.frameTimes : [],
        frameSamples: Array.isArray(metrics.frameSamples) ? metrics.frameSamples : [],
        errors: Array.isArray(metrics.errors) ? metrics.errors : [],
        mutationTicks: Number(metrics.mutationTicks || 0),
        longTaskSupported: metrics.longTaskSupported ?? null,
        longTasks: Array.isArray(metrics.longTasks) ? metrics.longTasks : [],
        visibilityEvents: Array.isArray(metrics.visibilityEvents) ? metrics.visibilityEvents : [],
        visibilityState: document.visibilityState, focused: document.hasFocus(),
        droppedVideoFrames: Number(quality?.droppedVideoFrames || 0)
      };
    `
  );
  const frameSamples = state.frameSamples;
  const callbackEpisodes = videoCallbackGapEpisodes(frameSamples,
    state.longTaskSupported === true ? state.longTasks : []);
  return { mode, ...state, frames: summarize(state.frameTimes),
    ...(callbackEpisodes ? {callbackGapEpisodes: state.longTaskSupported === true
      ? callbackEpisodes : callbackEpisodes.map(({longTasks, ...episode}) => episode)} : {}),
    presentedFramesDelta: frameSamples.length > 1
      ? frameSamples.at(-1).presentedFrames - frameSamples[0].presentedFrames : 0,
    // Only the opt-in instrumented fixture observes long tasks. Default
    // absence of correlation stays explicitly unmeasured.
    gapEpisodes: state.longTaskSupported === true
      ? videoGapEpisodes(frameSamples, state.longTasks)
      : videoGapEpisodes(frameSamples, []).map(({longTasks, ...episode}) => episode)
  };
}

async function run(url, mode, attempt) {
  const id = await createSession(mode === "extension");
  let trace;
  const traceFile = `video-browser-trace-${browser}-${diagnosticFps}-${mode}-${attempt}.json`;
  try {
    if (browserTrace) {
      await mkdir(firefoxArtifacts, {recursive: true});
      trace = await startChromiumBrowserTrace(debuggerAddresses.get(id),
        "v8,devtools.timeline,disabled-by-default-v8.compile,media");
    }
    if (focusedStart) {
      const handle = (await request("GET", `/session/${id}/window`)).value;
      await request("POST", `/session/${id}/window`, {handle});
      if (browser === "chromium") await request("POST", `/session/${id}/goog/cdp/execute`, {cmd: "Page.bringToFront", params: {}});
    }
    await request("POST", `/session/${id}/url`, { url });
    if (focusedStart && !await execute(id, 'return document.visibilityState === "visible" && document.hasFocus();')) {
      throw new Error("Fokussierter Videostart nicht erreicht.");
    }
    const traceClock = trace ? await synchronizeTraceClock(id) : undefined;
    await waitForCompletion(id);
    return {...await collect(id, mode), instrumented: Boolean(trace) || mainTaskDiagnostics || domPhaseDiagnostics,
      mainTaskDiagnostics,
      domPhaseDiagnostics,
      focusedStart,
      ...(trace ? {traceFile, traceClock, engineControl, engineControlArgumentVerified:true} : {})};
  } finally {
    try {
      if (trace) await trace.save(path.join(firefoxArtifacts, traceFile));
    } finally {
      try {await request("DELETE", `/session/${id}`);} catch (error) {console.error(String(error));}
    }
  }
}

function validateRun(result) {
  if (result.errors.length) {
    throw new Error(`${result.mode}: Videofehler: ${result.errors.join(" | ")}`);
  }
  if (result.currentTime < 5) {
    throw new Error(
      `${result.mode}: Video lief nicht ausreichend weit (${result.currentTime.toFixed(2)} s).`
    );
  }
  if (result.videoWidth <= 0 || result.videoHeight <= 0 || result.readyState < 2) {
    throw new Error(`${result.mode}: Video wurde nicht korrekt dekodiert.`);
  }
  if (result.frames.callbacks < 90) {
    throw new Error(
      `${result.mode}: Zu wenige Videoframe-Callbacks (${result.frames.callbacks}).`
    );
  }
}

class VideoFrameRatioError extends Error {
  constructor(message) {
    super(message);
    this.name = "VideoFrameRatioError";
  }
}

function validateComparison(baseline, extension) {
  if (baseline.staticText !== "Nutzer:innen" || extension.staticText !== "Nutzer") {
    throw new Error(
      `Erweiterungszustand im Videotest unerwartet: ${JSON.stringify({
        baseline: baseline.staticText,
        extension: extension.staticText
      })}`
    );
  }
  if (extension.mutationTicks < 100) {
    throw new Error(
      `Zu wenig dynamische DOM-Last erzeugt: ${extension.mutationTicks} Takte.`
    );
  }

  const frameRatio = extension.frames.callbacks / baseline.frames.callbacks;
  if (frameRatio < 0.8) {
    throw new VideoFrameRatioError(
      `Videoframes mit Erweiterung zu stark reduziert: ${(frameRatio * 100).toFixed(1)} % der Baseline.`
    );
  }

  const extraLongGaps =
    extension.frames.gapsOver120Ms - baseline.frames.gapsOver120Ms;
  if (extraLongGaps > 2) {
    throw new Error(
      `Zu viele zusätzliche Frame-Lücken >120 ms: ${extraLongGaps}.`
    );
  }

  const allowedP95 = Math.max(120, baseline.frames.p95GapMs + 60);
  if (extension.frames.p95GapMs > allowedP95) {
    throw new Error(
      `P95-Frameabstand zu hoch: ${extension.frames.p95GapMs.toFixed(1)} ms; erlaubt ${allowedP95.toFixed(1)} ms.`
    );
  }

  const allowedMaximum = Math.max(300, baseline.frames.maximumGapMs + 160);
  if (extension.frames.maximumGapMs > allowedMaximum) {
    throw new Error(
      `Maximale Frame-Lücke zu hoch: ${extension.frames.maximumGapMs.toFixed(1)} ms; erlaubt ${allowedMaximum.toFixed(1)} ms.`
    );
  }

  if (extension.droppedVideoFrames > baseline.droppedVideoFrames + 5) {
    throw new Error(
      `Zu viele verworfene Videoframes: Baseline ${baseline.droppedVideoFrames}, Erweiterung ${extension.droppedVideoFrames}.`
    );
  }
}

async function measureVideoPair(url, attempt) {
  // Keep labels independent of execution order. Both orders retain the same
  // fixture and gates; the explicit control exposes native timing order bias.
  let baseline, extension;
  if (videoPairOrder === "extension-first") {
    extension = await run(url, "extension", attempt);
    baseline = await run(url, "baseline", attempt);
  } else {
    baseline = await run(url, "baseline", attempt);
    extension = await run(url, "extension", attempt);
  }
  await mkdir(firefoxArtifacts, {recursive: true});
  await writeFile(path.join(firefoxArtifacts,
    `video-pair-${browser}-${diagnosticFps}-${attempt}.json`),
    JSON.stringify({pairOrder: videoPairOrder, baseline, extension}, null, 2) + "\n");

  console.log(
    `Video-Rohmessung (Durchlauf ${attempt}): ${JSON.stringify({
      pairOrder: videoPairOrder,
      baseline: {
        currentTime: baseline.currentTime,
        callbacks: baseline.frames.callbacks,
        p95GapMs: baseline.frames.p95GapMs,
        maximumGapMs: baseline.frames.maximumGapMs,
        gapsOver120Ms: baseline.frames.gapsOver120Ms,
        droppedVideoFrames: baseline.droppedVideoFrames,
        presentedFramesDelta: baseline.presentedFramesDelta,
        gapEpisodes: baseline.gapEpisodes
      },
      extension: {
        currentTime: extension.currentTime,
        callbacks: extension.frames.callbacks,
        p95GapMs: extension.frames.p95GapMs,
        maximumGapMs: extension.frames.maximumGapMs,
        gapsOver120Ms: extension.frames.gapsOver120Ms,
        droppedVideoFrames: extension.droppedVideoFrames,
        presentedFramesDelta: extension.presentedFramesDelta,
        gapEpisodes: extension.gapEpisodes
      }
    })}`
  );

  validateRun(baseline);
  validateRun(extension);
  return { baseline, extension };
}

async function subtitleState(id) {
  return execute(id, `
    const video = document.querySelector("#video");
    return {
      url: location.href,
      normal: document.querySelector("#static-target")?.textContent,
      subtitle: document.querySelector("#subtitle-target")?.textContent,
      timeUpdates: window.__videoTimeUpdates ?? 0,
      ticks: window.__subtitleTicks ?? 0,
      ready: video?.readyState ?? 0,
      paused: video?.paused ?? true,
      error: window.__subtitlePlaybackError ?? null,
      cueLatenciesMs: [...(window.__subtitleCueLatenciesMs ?? [])],
      cueRecords: [...(window.__subtitleCueRecords ?? [])],
      longTasks: [...(window.__subtitleLongTasks ?? [])],
      visibilityState: document.visibilityState
    };
  `);
}

async function waitSubtitle(id, corrected) {
  const deadline = Date.now() + 8_000;
  let state;
  while (Date.now() < deadline) {
    state = await subtitleState(id);
    const expected = corrected
      ? /^Nutzer im Untertitel \d+$/u
      : /^Nutzer:innen im Untertitel \d+$/u;
    if (state.normal === "Nutzer" && expected.test(state.subtitle ?? "") &&
        state.ready >= 2 && !state.paused && state.ticks >= 1) {
      return state;
    }
    await sleep(100);
  }
  throw new Error(`Untertitelzustand ${corrected} nicht erreicht: ${JSON.stringify(state)}`);
}

async function extensionId(id) {
  if (browser === "firefox") return firefoxUuid;
  // Ein MV3-Serviceworker kann beim Sitzungsstart noch nicht registriert
  // oder zwischenzeitlich wieder eingeschlafen sein. Erst nach dem
  // erfolgreichen Content-Script-Smoke suchen und die Zielabfrage begrenzen.
  const deadline = Date.now() + 8_000;
  let urls = [];
  while (Date.now() < deadline) {
    const result = (await request("POST", `/session/${id}/goog/cdp/execute`, {
      cmd: "Target.getTargets",
      params: {}
    })).value;
    urls = (result?.targetInfos ?? []).map((target) => target.url);
    const origin = urls.find((url) =>
      /^chrome-extension:\/\/[a-p]{32}\/(?:background\.js|.+)/u.test(url)
    );
    if (origin) {
      return origin.split("/")[2];
    }
    await sleep(200);
  }
  throw new Error(
    `Extension-Target nach geprüftem Content-Script-Start nicht erreichbar: ${JSON.stringify(urls)}`
  );
}

async function setSubtitleCheckbox(id, enabled) {
  const switched = await execute(id, `
    const input = document.querySelector("#process-subtitles");
    const save = document.querySelector("#save-settings");
    if (!input || !save) return false;
    if (input.checked !== ${enabled}) input.click();
    save.click();
    return input.checked === ${enabled};
  `);
  if (!switched) throw new Error("Untertitel-Schalter konnte nicht bedient werden.");

  const deadline = Date.now() + 8_000;
  while (Date.now() < deadline) {
    const saved = (await request("POST", `/session/${id}/execute/async`, {
      script: `
        const done = arguments[arguments.length - 1];
        (globalThis.browser ?? globalThis.chrome).storage.local.get("settings").then(
          result => done(result.settings?.processSubtitles),
          error => done(String(error))
        );
      `,
      args: []
    })).value;
    if (saved === enabled) return;
    await sleep(100);
  }
  throw new Error(`Untertitel-Einstellung ${enabled} nicht gespeichert.`);
}

// WebDriver-Laufzeit fließt nicht in die Cue-Latenz ein: Die Zeitstempel
// entstehen ausschließlich in der Video-Seite unmittelbar vor der DOM-Mutation
// und im auf die Korrektur reagierenden MutationObserver.
async function measureControlledSubtitleCues(id, number = 6, repeated = false) {
  await execute(id, "window.__controlledCueMode = true; return true;");
  const results = [];
  try {
    // Regelengine und Tabwechsel hatten hier bereits Zeit anzulaufen.
    await sleep(250);
    for (let index = 0; index < number; index += 1) {
      const tick = await execute(id,
        repeated ? 'return window.__issueSubtitleCue("kontrolliert-wiederholt", "Nutzer:innen im Untertitel Wiederholung");'
          : 'return window.__issueSubtitleCue("kontrolliert");');
      const deadline = Date.now() + 2_000;
      let record;
      while (Date.now() < deadline) {
        const state = await subtitleState(id);
        record = state.cueRecords.find((item) => item.tick === tick);
        if (record?.correctedAt !== null && record?.correctedAt !== undefined) {
          results.push(record);
          break;
        }
        await sleep(25);
      }
      if (!results.some((item) => item.tick === tick)) {
        throw new Error("Kontrollierter Cue wurde nicht korrigiert: " +
          JSON.stringify({ tick, record }));
      }
      await sleep(125);
    }
  } finally {
    await execute(id, "window.__controlledCueMode = false; return true;");
  }
  return results;
}

async function synchronizeTraceClock(id) {
    await request("POST", `/session/${id}/goog/cdp/execute`, {cmd: "Performance.enable", params: {}});
    const before = await execute(id, "return performance.now();");
    const metrics = (await request("POST", `/session/${id}/goog/cdp/execute`, {
      cmd: "Performance.getMetrics", params: {}
    })).value;
    const after = await execute(id, "return performance.now();");
    const timestamp = metrics?.metrics?.find(metric => metric.name === "Timestamp")?.value;
    if (!Number.isFinite(timestamp) || !Number.isFinite(before) || !Number.isFinite(after) ||
        after < before || after - before > 200) throw new Error("Trace-Zeitachsenabgleich fehlt oder ist zu ungenau.");
    return {offsetMs: (before + after) / 2 - timestamp * 1000, uncertaintyMs: (after - before) / 2};
}

async function measureSubtitleDomLoad(id) {
  if (!browserTrace) return measureSubtitleDomLoadResult(id, {instrumented: false});
  await mkdir(firefoxArtifacts, {recursive: true});
  const trace = await startChromiumBrowserTrace(debuggerAddresses.get(id));
  const traceFile = `subtitle-browser-trace-${browser}-${diagnosticFps}-${subtitleBaseline ? "baseline" : "extension"}-${subtitleLoad}-${subtitleDurationMs}.json`;
  try {
    const traceClock = await synchronizeTraceClock(id);
    return await measureSubtitleDomLoadResult(id, {instrumented: true, traceFile, traceClock});
  } finally {
    await trace.save(path.join(firefoxArtifacts, traceFile));
  }
}

async function measureSubtitleDomLoadResult(id, diagnostics) {
  const mutationsPerTick = ["none", "burst", "removal"].includes(subtitleLoad) ? 0 : subtitleLoad === "moderate" ? 4 : 48;
  const mutationIntervalMs = subtitleLoad === "moderate" ? 500 : 50;
  await request("POST", `/session/${id}/timeouts`, {script: subtitleDurationMs + 10_000});
  const result = (await request("POST", `/session/${id}/execute/async`, {
    script: `
      const done = arguments[arguments.length - 1];
      const video = document.querySelector("#video");
      const root = document.createElement("div");
      document.body.append(root);
      const nodes = Array.from({length: 480}, (_, index) => {
        const node = document.createElement("span");
        node.textContent = "Neutraler Inhalt " + index;
        root.append(node); return node;
      });
      let bulkRoot, bulkFragment, bulkTail, bulkAppliedAt = null, bulkCorrectedAt = null;
      let removal = null;
      if (${["burst", "removal"].includes(subtitleLoad)}) {
        // Prepare outside the measured window; isolate extension intake rather
        // than the page's own allocation and visible layout cost.
        bulkRoot = document.createElement("div"); bulkRoot.style.display = "none"; root.append(bulkRoot);
        bulkFragment = document.createDocumentFragment();
        for (let index = 0; index < 50000; index++) {
          const span = document.createElement("span"); span.textContent = "neutral "; bulkFragment.append(span);
        }
        bulkTail = document.createElement("span"); bulkTail.textContent = "Nutzer:innen im normalen Text";
        bulkFragment.append(bulkTail);
        new MutationObserver(() => {
          if (bulkTail.textContent === "Nutzer im normalen Text" && bulkCorrectedAt === null) {
            bulkCorrectedAt = performance.now();
          }
        }).observe(bulkTail, {subtree: true, childList: true, characterData: true});
      }
      const startedAt = performance.now();
      const qualityBefore = video.getVideoPlaybackQuality?.();
      const frames = [];
      let ticks = 0, stopped = false;
      const frame = (now, metadata) => {
        if (stopped) return;
        frames.push({nowMs: now, mediaTime: metadata.mediaTime,
          presentedFrames: metadata.presentedFrames});
        video.requestVideoFrameCallback(frame);
      };
      if (typeof video.requestVideoFrameCallback === "function") {
        video.requestVideoFrameCallback(frame);
      }
      const timer = setInterval(() => {
        for (let offset = 0; offset < ${mutationsPerTick}; offset++) {
          const index = (ticks * ${mutationsPerTick} + offset) % nodes.length;
          nodes[index].textContent = "Nutzer:innen " + ticks + " / " + offset;
        }
        ticks++;
      }, ${mutationIntervalMs});
      const burstTimer = bulkRoot ? setTimeout(() => {
        bulkRoot.append(bulkFragment); bulkAppliedAt = performance.now();
        window.__issueSubtitleCue("dom-burst");
      }, 500) : null;
      const removalTimer = ${subtitleLoad === "removal"} ? setTimeout(() => {
        const startedAt = performance.now();
        const correctedBefore = bulkTail.textContent === "Nutzer im normalen Text";
        bulkRoot.replaceChildren();
        const mutationFinishedAt = performance.now();
        removal = {startedAt, pageMutationMs: mutationFinishedAt - startedAt,
          correctedBefore, operationToFirstFrameMs: null};
        window.__issueSubtitleCue("dom-removal");
        requestAnimationFrame(() => {
          removal.operationToFirstFrameMs = performance.now() - startedAt;
        });
      }, 5000) : null;
      setTimeout(() => {
        clearInterval(timer); if (burstTimer !== null) clearTimeout(burstTimer); stopped = true;
        if (removalTimer !== null) clearTimeout(removalTimer);
        const endedAt = performance.now();
        const qualityAfter = video.getVideoPlaybackQuality?.();
        // Freeze natural cues while checking the final cue and normal texts.
        window.__controlledCueMode = true;
        setTimeout(() => {
          done({startedAt, endedAt, ticks, frames, removal,
            bulk: bulkRoot ? {nodes: bulkRoot.childNodes.length,
              tail: bulkTail.textContent, appliedAt: bulkAppliedAt, correctedAt: bulkCorrectedAt,
              settleMs: bulkAppliedAt !== null && bulkCorrectedAt !== null
                ? bulkCorrectedAt - bulkAppliedAt : null} : null,
            visibility: document.visibilityState, focused: document.hasFocus(),
            paused: video.paused, readyState: video.readyState,
            error: window.__subtitlePlaybackError ?? null,
            droppedFrames: qualityBefore && qualityAfter
              ? qualityAfter.droppedVideoFrames - qualityBefore.droppedVideoFrames : null,
            totalFrames: qualityBefore && qualityAfter
              ? qualityAfter.totalVideoFrames - qualityBefore.totalVideoFrames : null,
            cueRecords: window.__subtitleCueRecords.filter(record =>
              record.issuedAt >= startedAt && record.issuedAt <= endedAt),
            longTaskSupported: PerformanceObserver.supportedEntryTypes?.includes("longtask") === true,
            longTasks: window.__subtitleLongTasks.filter(task =>
              task.startMs >= startedAt && task.startMs <= endedAt),
            normalCorrected: nodes.filter(node => node.textContent.startsWith("Nutzer ")).length,
            staticText: document.querySelector("#static-target").textContent,
            subtitle: document.querySelector("#subtitle-target").textContent});
          root.remove(); window.__controlledCueMode = false;
        }, 350);
      }, ${subtitleDurationMs});
    `,
    args: []
  })).value;
  const latencies = result.cueRecords.map(record => record.latencyMs)
    .filter(value => typeof value === "number" && Number.isFinite(value));
  const report = {browser, fps: diagnosticFps, durationMs: subtitleDurationMs,
    ...diagnostics,
    mode: subtitleBaseline ? "baseline" : "extension",
    load: subtitleLoad, mutationsPerTick, mutationIntervalMs,
    cueCount: result.cueRecords.length, correctedCues: latencies.length,
    cueP95Ms: latencies.length ? percentile(latencies, 0.95) : null,
    cueP99Ms: latencies.length ? percentile(latencies, 0.99) : null,
    cueMaximumMs: latencies.length ? Math.max(...latencies) : null,
    frameSummary: summarize(result.frames.map(frame => frame.nowMs)),
    gapEpisodes: videoGapEpisodes(result.frames, result.longTasks),
    ...result};
  await mkdir(firefoxArtifacts, {recursive: true});
  await writeFile(path.join(firefoxArtifacts,
    `subtitle-dom-load-${browser}-${diagnosticFps}-${report.mode}-${subtitleLoad}-${subtitleDurationMs}.json`), JSON.stringify(report, null, 2) + "\n");
  console.log("Untertitel unter DOM-Last: " + JSON.stringify({
    ...diagnostics,
    browser, fps: diagnosticFps, mode: report.mode, load: subtitleLoad, durationMs: subtitleDurationMs, ticks: result.ticks,
    cues: report.cueCount, correctedCues: report.correctedCues,
    cueP95Ms: report.cueP95Ms, cueP99Ms: report.cueP99Ms,
    cueMaximumMs: report.cueMaximumMs,
    frames: report.frameSummary, droppedFrames: result.droppedFrames, totalFrames: result.totalFrames,
    gapEpisodes: report.gapEpisodes,
    bulk: result.bulk,
    removal: result.removal,
    removalCueMs: result.cueRecords.find(record => record.source === "dom-removal")?.latencyMs ?? null,
    burstCueMs: result.cueRecords.find(record => record.source === "dom-burst")?.latencyMs ?? null,
    longTasks: result.longTaskSupported ? result.longTasks.length : null,
    normalCorrected: result.normalCorrected
  }));
  const expectedNormal = subtitleBaseline ? 0 : Math.min(480, result.ticks * mutationsPerTick);
  const presentedFrames = result.frames.length > 1
    ? result.frames.at(-1).presentedFrames - result.frames[0].presentedFrames : 0;
  const minimumTicks = Math.max(subtitleLoad === "stress" ? 500 : 0,
    subtitleDurationMs / mutationIntervalMs * 0.8);
  if (result.ticks < minimumTicks || report.cueCount < subtitleDurationMs / 1000 ||
      report.correctedCues !== (subtitleBaseline ? 0 : report.cueCount) || result.normalCorrected !== expectedNormal ||
      result.staticText !== (subtitleBaseline ? "Nutzer:innen" : "Nutzer") ||
      result.cueRecords.some(record => record.visibilityAtIssue !== "visible" || !record.focusAtIssue) ||
      presentedFrames < subtitleDurationMs / 1000 * 10 ||
      (subtitleLoad === "burst" && (result.bulk?.nodes !== 50001 ||
        result.bulk.tail !== (subtitleBaseline ? "Nutzer:innen im normalen Text" : "Nutzer im normalen Text"))) ||
      (subtitleLoad === "removal" && (result.bulk?.nodes !== 0 ||
        result.bulk.tail !== "Nutzer:innen im normalen Text" ||
        result.removal?.correctedBefore !== !subtitleBaseline ||
        typeof result.removal?.operationToFirstFrameMs !== "number")) ||
      result.frames.length < 200 || result.visibility !== "visible" ||
      !result.focused || result.paused || result.readyState < 2 || result.error ||
      !(subtitleBaseline ? /^Nutzer:innen im Untertitel \d+$/u : /^Nutzer im Untertitel \d+$/u).test(result.subtitle)) {
    throw new Error("Untertitel-/DOM-Lastprobe unvollständig; Rohbericht gespeichert.");
  }
  return report;
}

async function validateSubtitleToggle(url) {
  const id = await createSession(true);
  try {
    // Die Navigation löst den Content-Script-Start aus. Das statische
    // Transformationssignal belegt vor der ID-Suche die aktive Erweiterung.
    await request("POST", `/session/${id}/url`, { url });
    const off = await waitSubtitle(id, false);
    const extension = await extensionId(id);
    const videoWindow = (await request("GET", `/session/${id}/window`)).value;

    const optionsWindow = (await request("POST", `/session/${id}/window/new`, {
      type: "tab"
    })).value.handle;
    if (!optionsWindow) throw new Error("Einstellungsfenster fehlt.");
    // ChromeDriver kann nach window/new weiterhin das ursprüngliche Tab aktiv lassen.
    await request("POST", `/session/${id}/window`, { handle: optionsWindow });
    await request("POST", `/session/${id}/url`, {
      url: `${browser === "firefox" ? "moz-extension" : "chrome-extension"}://${extension}/options/options.html`
    });
    const deadline = Date.now() + 8_000;
    while (Date.now() < deadline) {
      if (await execute(id, 'return document.querySelector("#enabled")?.checked === true;')) break;
      await sleep(100);
    }
    if (!await execute(id, 'return document.querySelector("#enabled")?.checked === true;')) {
      throw new Error("Optionsseite nicht initialisiert.");
    }
    if (await execute(id, 'return document.querySelector("#process-subtitles")?.checked;')) {
      throw new Error("Untertitel sind nicht standardmäßig ausgeschaltet.");
    }
    await setSubtitleCheckbox(id, true);
    await request("POST", `/session/${id}/window`, { handle: videoWindow });
    const on = await waitSubtitle(id, true);
    // In der optionalen 60-FPS-Diagnose weitere echte Untertitelwechsel abwarten.
    if (diagnosticFps === 60) await sleep(2_200);
    const onWithCues = diagnosticFps === 60 ? await subtitleState(id) : on;
    const controlledCues = diagnoseCuePhases
      ? await measureControlledSubtitleCues(id)
      : [];
    const repeatedCues = diagnoseCuePhases
      ? await measureControlledSubtitleCues(id, 6, true)
      : [];
    if (diagnosticFps === 60 && onWithCues.cueLatenciesMs.length === 0) {
      throw new Error("Aktive Untertitel konnten nicht mit Cue-Latenz erfasst werden.");
    }
    if (on.timeUpdates <= off.timeUpdates) {
      throw new Error("Video wurde beim Einschalten unterbrochen.");
    }

    if (subtitleDomLoad) await measureSubtitleDomLoad(id);

    await request("POST", `/session/${id}/window`, { handle: optionsWindow });
    await setSubtitleCheckbox(id, false);
    await request("POST", `/session/${id}/window`, { handle: videoWindow });
    const againOff = await waitSubtitle(id, false);
    if (againOff.timeUpdates <= on.timeUpdates || againOff.ticks <= on.ticks) {
      throw new Error("Video oder Untertitel wurden beim Ausschalten unterbrochen.");
    }
    console.log(`Videountertitel-Schalter Aus/An/Aus erfolgreich: ${JSON.stringify({
      fps: diagnosticFps, off, on: onWithCues, againOff,
      controlledCues, repeatedCues
    })}`);
  } finally {
    try {
      await request("DELETE", `/session/${id}`);
    } catch (error) {
      console.error(String(error));
    }
  }
}

async function stopDriver(handle) {
  if (handle.exitCode !== null) {
    return;
  }
  handle.kill("SIGTERM");
  const exited = await Promise.race([
    new Promise((resolve) => handle.once("exit", () => resolve(true))),
    sleep(2_000).then(() => false)
  ]);
  if (!exited && handle.exitCode === null) {
    handle.kill("SIGKILL");
  }
}

const logs = [];
// Gecko requires this for navigating to its installed addon's options page.
// It applies only to the fresh local test browser, not extension permissions.
const driverProcess = spawn(driver, [`--port=${driverPort}`,
  ...(browser === "firefox" ? ["--allow-system-access"] : [])], {
  stdio: ["ignore", "pipe", "pipe"]
});
driverProcess.on("error", (error) => {
  driverStartError = error;
  logs.push(`${error.stack ?? error.message}\n`);
});
driverProcess.stdout.on("data", (chunk) => logs.push(chunk.toString()));
driverProcess.stderr.on("data", (chunk) => logs.push(chunk.toString()));

let server;
try {
  await waitForDriver(driverProcess, logs);
  if (browser === "firefox") {
    await mkdir(firefoxArtifacts, {recursive: true});
    const {cmd} = await import("web-ext");
    await cmd.build({sourceDir: extensionDir, artifactsDir: firefoxArtifacts,
      filename: path.basename(firefoxXpi), overwriteDest: true}, {showReadyMessage: false});
  }
  const fixture = await startServer();
  server = fixture.server;

  console.log("Verifiziertes lokales Videomaterial:", diagnosticFps, "FPS");
  if (!subtitleOnly) {
    let { baseline, extension } = await measureVideoPair(fixture.url, 1);
    try {
      validateComparison(baseline, extension);
    } catch (error) {
      if (!(error instanceof VideoFrameRatioError)) {
        throw error;
      }

      // Nur die stark schwankende Frame-Anzahl durch einen zweiten Messlauf bestätigen.
      // Alle bisherigen Grenzwerte gelten unverändert; ein zweiter Fehlschlag ist endgültig.
      console.warn(`Erste Video-Frame-Prüfung fehlgeschlagen: ${error.message}`);
      console.warn("Einmalige Bestätigungsmessung mit neuen Browser-Sitzungen.");

      ({ baseline, extension } = await measureVideoPair(fixture.url, 2));
      validateComparison(baseline, extension);
    }

    console.log(
      `Video-Playback-Regression erfolgreich: ${JSON.stringify({
        baseline: {
          callbacks: baseline.frames.callbacks,
          p95GapMs: baseline.frames.p95GapMs,
          maximumGapMs: baseline.frames.maximumGapMs,
          gapsOver120Ms: baseline.frames.gapsOver120Ms,
          droppedVideoFrames: baseline.droppedVideoFrames,
          presentedFramesDelta: baseline.presentedFramesDelta,
          gapEpisodes: baseline.gapEpisodes
        },
        extension: {
          callbacks: extension.frames.callbacks,
          p95GapMs: extension.frames.p95GapMs,
          maximumGapMs: extension.frames.maximumGapMs,
          gapsOver120Ms: extension.frames.gapsOver120Ms,
          droppedVideoFrames: extension.droppedVideoFrames,
          presentedFramesDelta: extension.presentedFramesDelta,
          gapEpisodes: extension.gapEpisodes
        }
      })}`
    );
  }

  if (subtitleBaseline) {
    const id = await createSession(false);
    try {
      await request("POST", `/session/${id}/url`, {url: fixture.subtitleUrl});
      const deadline = Date.now() + 8_000;
      while (Date.now() < deadline) {
        if (await execute(id, 'return document.querySelector("#video").currentTime > 0.5 && window.__subtitleTicks > 0;')) break;
        await sleep(50);
      }
      if (!await execute(id, 'return document.querySelector("#video").currentTime > 0.5 && window.__subtitleTicks > 0;')) {
        throw new Error("Baseline-Video oder Untertitelwechsel nicht angelaufen.");
      }
      await measureSubtitleDomLoad(id);
    } finally {
      await request("DELETE", `/session/${id}`);
    }
  } else {
    await validateSubtitleToggle(fixture.subtitleUrl);
  }
} finally {
  if (server) {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
  await stopDriver(driverProcess);
}
