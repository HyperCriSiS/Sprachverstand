import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawn, spawnSync } from "node:child_process";

const root = process.cwd();
const driverPort = 9515;
const driverBase = `http://127.0.0.1:${driverPort}`;
const extensionDir = path.join(root, "dist", "chromium");
const videoPath = path.join(
  root,
  "tests",
  "browser",
  "video-playback-30fps.webm.b64"
);
const observationMs = 8_000;

if (!existsSync(path.join(extensionDir, "manifest.json"))) {
  throw new Error(
    "Der Chromium-Build fehlt. Vor dem Videotest zuerst npm run build:chromium ausführen."
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

const driver = executable("CHROMEWEBDRIVER", "chromedriver");
const chromium =
  process.env.CHROMIUM_BIN ?? command("chromium", "chromium-browser");

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
    waiting: 0,
    stalled: 0,
    playing: 0,
    errors: [],
    mutationTicks: 0
  };
  window.__sprachverstandVideoMetrics = metrics;
  window.__sprachverstandVideoDone = false;

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
    const onFrame = (now) => {
      metrics.frameTimes.push(Number(now));
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
  window.__videoTimeUpdates = 0;
  video.addEventListener("timeupdate", () => {
    window.__videoTimeUpdates += 1;
    if (window.__videoTimeUpdates % 2 === 0) {
      window.__subtitleTicks += 1;
      subtitle.textContent = "Nutzer:innen im Untertitel " + window.__subtitleTicks;
    }
  });
  video.play().catch(error => { window.__subtitlePlaybackError = String(error); });
})();
</script>`;
}

function startServer() {
  const html = Buffer.from(fixtureHtml(), "utf8");
  const subtitles = Buffer.from(subtitleFixtureHtml(), "utf8");
  const video = Buffer.from(readFileSync(videoPath, "utf8").trim(), "base64");
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
  if (withExtension) {
    args.push(
      `--disable-extensions-except=${extensionDir}`,
      `--load-extension=${extensionDir}`
    );
  }
  return sessionId(
    await request("POST", "/session", {
      capabilities: {
        alwaysMatch: {
          browserName: "chrome",
          pageLoadStrategy: "eager",
          timeouts: { implicit: 0, pageLoad: 20_000, script: 15_000 },
          "goog:chromeOptions": { binary: chromium, args }
        }
      }
    })
  );
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
      const video = document.querySelector("#video");
      const metrics = window.__sprachverstandVideoMetrics || {};
      const quality = typeof video?.getVideoPlaybackQuality === "function"
        ? video.getVideoPlaybackQuality()
        : undefined;
      return {
        staticText: document.querySelector("#static-target")?.textContent || "",
        currentTime: Number(video?.currentTime || 0),
        readyState: Number(video?.readyState || 0),
        videoWidth: Number(video?.videoWidth || 0),
        videoHeight: Number(video?.videoHeight || 0),
        frameTimes: Array.isArray(metrics.frameTimes) ? metrics.frameTimes : [],
        errors: Array.isArray(metrics.errors) ? metrics.errors : [],
        mutationTicks: Number(metrics.mutationTicks || 0),
        droppedVideoFrames: Number(quality?.droppedVideoFrames || 0)
      };
    `
  );
  return { mode, ...state, frames: summarize(state.frameTimes) };
}

async function run(url, mode) {
  const id = await createSession(mode === "extension");
  try {
    await request("POST", `/session/${id}/url`, { url });
    await waitForCompletion(id);
    return await collect(id, mode);
  } finally {
    try {
      await request("DELETE", `/session/${id}`);
    } catch (error) {
      console.error(String(error));
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
      `${result.mode}: Zu wenige präsentierte Frames (${result.frames.callbacks}).`
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
  const baseline = await run(url, "baseline");
  const extension = await run(url, "extension");

  console.log(
    `Video-Rohmessung (Durchlauf ${attempt}): ${JSON.stringify({
      baseline: {
        currentTime: baseline.currentTime,
        callbacks: baseline.frames.callbacks,
        p95GapMs: baseline.frames.p95GapMs,
        maximumGapMs: baseline.frames.maximumGapMs,
        gapsOver120Ms: baseline.frames.gapsOver120Ms,
        droppedVideoFrames: baseline.droppedVideoFrames
      },
      extension: {
        currentTime: extension.currentTime,
        callbacks: extension.frames.callbacks,
        p95GapMs: extension.frames.p95GapMs,
        maximumGapMs: extension.frames.maximumGapMs,
        gapsOver120Ms: extension.frames.gapsOver120Ms,
        droppedVideoFrames: extension.droppedVideoFrames
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
      normal: document.querySelector("#static-target")?.textContent,
      subtitle: document.querySelector("#subtitle-target")?.textContent,
      timeUpdates: window.__videoTimeUpdates ?? 0,
      ticks: window.__subtitleTicks ?? 0,
      ready: video?.readyState ?? 0,
      paused: video?.paused ?? true,
      error: window.__subtitlePlaybackError ?? null
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
  const result = (await request("POST", `/session/${id}/goog/cdp/execute`, {
    cmd: "Target.getTargets",
    params: {}
  })).value;
  const urls = (result?.targetInfos ?? []).map(target => target.url);
  const origin = urls.find(url => /^chrome-extension:\/\/[a-p]{32}\/background\.js/u.test(url));
  if (!origin) {
    throw new Error(`Erweiterungs-Serviceworker nicht gefunden: ${JSON.stringify(urls)}`);
  }
  return origin.split("/")[2];
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
        chrome.storage.local.get("settings").then(
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

async function validateSubtitleToggle(url) {
  const id = await createSession(true);
  try {
    const extension = await extensionId(id);
    await request("POST", `/session/${id}/url`, { url });
    const off = await waitSubtitle(id, false);
    const videoWindow = (await request("GET", `/session/${id}/window`)).value;

    const optionsWindow = (await request("POST", `/session/${id}/window/new`, {
      type: "tab"
    })).value.handle;
    if (!optionsWindow) throw new Error("Einstellungsfenster fehlt.");
    await request("POST", `/session/${id}/url`, {
      url: `chrome-extension://${extension}/options/options.html`
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
    if (on.timeUpdates <= off.timeUpdates) {
      throw new Error("Video wurde beim Einschalten unterbrochen.");
    }

    await request("POST", `/session/${id}/window`, { handle: optionsWindow });
    await setSubtitleCheckbox(id, false);
    await request("POST", `/session/${id}/window`, { handle: videoWindow });
    const againOff = await waitSubtitle(id, false);
    if (againOff.timeUpdates <= on.timeUpdates || againOff.ticks <= on.ticks) {
      throw new Error("Video oder Untertitel wurden beim Ausschalten unterbrochen.");
    }
    console.log(`Videountertitel-Schalter Aus/An/Aus erfolgreich: ${JSON.stringify({
      off, on, againOff
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
const driverProcess = spawn(driver, [`--port=${driverPort}`], {
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
  const fixture = await startServer();
  server = fixture.server;

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
        droppedVideoFrames: baseline.droppedVideoFrames
      },
      extension: {
        callbacks: extension.frames.callbacks,
        p95GapMs: extension.frames.p95GapMs,
        maximumGapMs: extension.frames.maximumGapMs,
        gapsOver120Ms: extension.frames.gapsOver120Ms,
        droppedVideoFrames: extension.droppedVideoFrames
      }
    })}`
  );

  await validateSubtitleToggle(fixture.subtitleUrl);
} finally {
  if (server) {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
  await stopDriver(driverProcess);
}