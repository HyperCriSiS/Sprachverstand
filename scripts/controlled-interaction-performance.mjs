import { createServer } from "node:http";
import { existsSync, statSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn, spawnSync } from "node:child_process";
import { pruefePaar, zusammenfassung } from "./interaction-performance-metrics.mjs";

// Ausschließlich lokale, synthetische Last. Keine fremden Seiten oder Mess-Drittdienste.
const basis = process.cwd();
const erweiterung = path.join(basis, "dist", "chromium");
const portTreiber = 9515;
const serverTreiber = `http://127.0.0.1:${portTreiber}`;
const anzahlPaare = positiveZahl("--pairs", 3, 1, 5);
const dauerMs = positiveZahl("--duration-ms", 4_000, 1_000, 10_000);
const ausgabe = path.resolve(basis, argument("--output", "artifacts/interaction-performance/report.json"));

function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return String(fallback);
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(name + " benötigt einen Wert.");
  return value;
}

function positiveZahl(name, fallback, min, max) {
  const wert = Number(argument(name, fallback));
  if (!Number.isInteger(wert) || wert < min || wert > max) {
    throw new Error(name + " benötigt eine Zahl von " + min + " bis " + max + ".");
  }
  return wert;
}

function executable(umgebung, name) {
  const direkt = process.env[umgebung];
  if (direkt) {
    if (existsSync(direkt) && statSync(direkt).isFile()) return direkt;
    const enthalten = path.join(direkt, name);
    if (existsSync(enthalten)) return enthalten;
  }
  const found = spawnSync("which", [name], { encoding: "utf8" });
  if (found.status === 0 && found.stdout.trim()) return found.stdout.trim();
  throw new Error(name + " nicht gefunden.");
}

if (!existsSync(path.join(erweiterung, "manifest.json"))) {
  throw new Error("Chromium-Erweiterungsbuild fehlt: zuerst npm run build:chromium.");
}

const driver = executable("CHROMEWEBDRIVER", "chromedriver");
const chromium = process.env.CHROMIUM_BIN ??
  executable("CHROMIUM_BIN", "chromium");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function api(method, pathname, body) {
  const response = await fetch(serverTreiber + pathname, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const raw = await response.text();
  let payload;
  try { payload = JSON.parse(raw); } catch { payload = { value: raw }; }
  if (!response.ok || payload?.value?.error) {
    throw new Error("WebDriver " + method + " " + pathname + ": " +
      JSON.stringify(payload).slice(0, 1_000));
  }
  return payload.value;
}

function html() {
  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><title>Kontrollierte DOM-Interaktionslast</title></head>
<body>
<button id="trigger-action" type="button">Aktion ausführen</button>
<input id="protected-field" value="Nutzer:innen" aria-label="Unveränderliche Eingabe">
<code id="protected-code">Nutzer:innen</code>
<p id="static-target">Nutzer:innen</p>
<p id="action-target">Wartet auf Klick</p>
<div id="dynamic-root"></div>
<section id="bulk-root"></section>
<script>
(() => {
  const bulk = document.querySelector("#bulk-root");
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < 1400; index++) {
    const text = document.createElement("p");
    text.textContent = index % 50 === 0 ? "Nutzer:innen in der Dokumentation " + index :
      "Neutraler Abschnitt der Dokumentation Nummer " + index;
    fragment.appendChild(text);
  }
  bulk.appendChild(fragment);
  const mutable = [];
  const root = document.querySelector("#dynamic-root");
  for (let index = 0; index < 480; index++) {
    const node = document.createElement("span");
    node.id = "dynamic-target-" + index;
    node.textContent = "Nutzer:innen " + index;
    root.appendChild(node);
    mutable.push(node);
  }

  const m = {
    rafTimes: [], longTasks: [], inputFrameTimes: [], clickFrameTimes: [],
    inputEvents: 0, clicks: 0, mutationTicks: 0, longTaskSupported: false
  };
  window.__perfMetrics = m;
  window.__perfDone = false;
  function nextFrame(target) {
    const start = performance.now();
    requestAnimationFrame(() => { target.push(performance.now() - start); });
  }
  document.querySelector("#trigger-action").addEventListener("click", () => {
    m.clicks++;
    nextFrame(m.clickFrameTimes);
    document.querySelector("#action-target").textContent = "Nutzer:innen haben geklickt";
  });
  document.querySelector("#protected-field").addEventListener("input", () => {
    m.inputEvents++;
    nextFrame(m.inputFrameTimes);
  });

  window.__startSyntheticLoad = (duration) => {
    m.rafTimes.length = 0;
    const began = performance.now();
    const onFrame = (now) => {
      m.rafTimes.push(now);
      if (!window.__perfDone) requestAnimationFrame(onFrame);
    };
    requestAnimationFrame(onFrame);
    try {
      const obs = new PerformanceObserver((list) => {
        for (const item of list.getEntries()) {
          if (item.startTime >= began && item.startTime < began + duration) {
            m.longTasks.push(Number(item.duration));
          }
        }
      });
      obs.observe({ type: "longtask" });
      m.longTaskSupported = true;
    } catch {
      m.longTaskSupported = false;
    }
    const timer = setInterval(() => {
      const tick = m.mutationTicks;
      for (let offset = 0; offset < 48; offset++) {
        const idx = (tick * 48 + offset) % mutable.length;
        mutable[idx].textContent = "Nutzer:innen " + tick + "-" + offset;
      }
      m.mutationTicks++;
    }, 40);
    setTimeout(() => {
      clearInterval(timer);
      window.__perfDone = true;
    }, duration);
    return true;
  };
})();
</script></body></html>`;
}

function serverStart() {
  const website = Buffer.from(html(), "utf8");
  const server = createServer((req, res) => {
    if (new URL(req.url ?? "/", "http://127.0.0.1").pathname !== "/test.html") {
      res.writeHead(404); res.end(); return;
    }
    res.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "content-length": website.length
    });
    res.end(website);
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Kein lokaler Testport.")); return;
      }
      resolve({ server, url: "http://127.0.0.1:" + address.port + "/test.html" });
    });
  });
}

async function sitzung(mitErweiterung) {
  const args = [
    "--headless=new", "--no-sandbox", "--disable-dev-shm-usage",
    "--no-first-run", "--disable-default-apps", "--window-size=1280,800"
  ];
  if (mitErweiterung) {
    args.push("--disable-extensions-except=" + erweiterung,
      "--load-extension=" + erweiterung);
  }
  const wert = await api("POST", "/session", {
    capabilities: { alwaysMatch: {
      browserName: "chrome", pageLoadStrategy: "eager",
      timeouts: { implicit: 0, pageLoad: 20_000, script: 20_000 },
      "goog:chromeOptions": { binary: chromium, args }
    } }
  });
  const id = wert?.sessionId;
  if (typeof id !== "string" || !id) throw new Error("WebDriver-Sitzung ohne ID.");
  return id;
}

async function js(id, script, args = []) {
  return api("POST", "/session/" + id + "/execute/sync", { script, args });
}

async function element(id, selector) {
  const wert = await api("POST", "/session/" + id + "/element", {
    using: "css selector", value: selector
  });
  const key = "element-6066-11e4-a52e-4f735466cecf";
  if (!wert?.[key]) throw new Error("WebDriver-Element fehlt: " + selector);
  return wert[key];
}

async function browserlauf(url, modus) {
  let id;
  try {
    id = await sitzung(modus === "extension");
    await api("POST", "/session/" + id + "/url", { url });
    // Identisches warmes DOM vor Beginn der kontrollierten Last.
    await sleep(1_000);
    await js(id, "return window.__startSyntheticLoad(arguments[0]);", [dauerMs]);
    await sleep(250);

    const button = await element(id, "#trigger-action");
    await api("POST", "/session/" + id + "/element/" + button + "/click", {});
    const eingabe = await element(id, "#protected-field");
    await api("POST", "/session/" + id + "/element/" + eingabe + "/value", {
      text: " test", value: [..." test"]
    });

    const deadline = Date.now() + dauerMs + 5_000;
    let fertig = false;
    while (Date.now() < deadline) {
      if (await js(id, "return window.__perfDone === true;")) {
        fertig = true; break;
      }
      await sleep(150);
    }
    if (!fertig) throw new Error("Synthetische Last nicht beendet.");
    await sleep(400);

    const details = await js(id, `
      const m = window.__perfMetrics;
      const gaps = [];
      for (let i = 16; i < m.rafTimes.length; i++) {
        const diff = m.rafTimes[i] - m.rafTimes[i - 1];
        if (Number.isFinite(diff) && diff >= 0) gaps.push(diff);
      }
      const sorted = [...gaps].sort((a, b) => a - b);
      const percentile = (values) => {
        if (!values.length) return null;
        const ordered = [...values].sort((a, b) => a - b);
        return ordered[Math.ceil(ordered.length * 0.95) - 1];
      };
      return {
        staticText: document.querySelector("#static-target")?.textContent,
        dynamicText: document.querySelector("#dynamic-target-0")?.textContent?.split(" ")[0],
        protectedOk: document.querySelector("#protected-field")?.value === "Nutzer:innen test" &&
          document.querySelector("#protected-code")?.textContent === "Nutzer:innen",
        interactionCount: m.clicks + m.inputEvents,
        mutationTicks: m.mutationTicks, rafCount: m.rafTimes.length,
        rafP95Ms: percentile(gaps),
        rafMaximumMs: gaps.length ? Math.max(...gaps) : null,
        rafGapsOver120: gaps.filter((value) => value > 120).length,
        longTaskSupported: m.longTaskSupported,
        longTaskCount: m.longTaskSupported ? m.longTasks.length : null,
        longTaskTotalMs: m.longTaskSupported ?
          m.longTasks.reduce((sum, value) => sum + value, 0) : null,
        longTaskMaximumMs: m.longTaskSupported ?
          Math.max(0, ...m.longTasks) : null,
        clickNextFrameMs: percentile(m.clickFrameTimes),
        inputNextFrameMs: percentile(m.inputFrameTimes)
      };
    `);
    return { status: "ok", ...details };
  } catch (error) {
    return { status: "error", error: String(error?.message ?? error) };
  } finally {
    if (id) {
      try { await api("DELETE", "/session/" + id); }
      catch (error) { console.warn("Chromium-Sitzung nicht geschlossen: " + String(error)); }
    }
  }
}

async function treiberStart(prozess, protokoll, gestartet) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (gestartet.error) throw new Error("ChromeDriver: " + String(gestartet.error));
    if (prozess.exitCode !== null) throw new Error("ChromeDriver vorzeitig beendet: " + protokoll.join("").slice(-800));
    try {
      const antwort = await fetch(serverTreiber + "/status");
      if (antwort.ok) return;
    } catch { /* ChromeDriver startet. */ }
    await sleep(100);
  }
  throw new Error("ChromeDriver nicht erreichbar.");
}

async function beenden(prozess) {
  if (prozess.exitCode !== null) return;
  prozess.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => prozess.once("exit", resolve)),
    sleep(2_000)
  ]);
  if (prozess.exitCode === null) prozess.kill("SIGKILL");
}

const fehler = { error: null };
const logs = [];
const prozess = spawn(driver, ["--port=" + portTreiber], {
  stdio: ["ignore", "pipe", "pipe"]
});
prozess.on("error", (error) => { fehler.error = error; });
prozess.stdout.on("data", (data) => logs.push(String(data)));
prozess.stderr.on("data", (data) => logs.push(String(data)));
let testserver;

try {
  await treiberStart(prozess, logs, fehler);
  const website = await serverStart();
  testserver = website.server;
  const paare = [];
  for (let index = 0; index < anzahlPaare; index++) {
    const reihenfolge = index % 2 === 0 ?
      ["baseline", "extension"] : ["extension", "baseline"];
    const ergebnisse = {};
    for (const modus of reihenfolge) {
      ergebnisse[modus] = await browserlauf(website.url, modus);
      console.log("INTERAKTION " + (index + 1) + "/" + anzahlPaare + " " +
        modus + " " + JSON.stringify(ergebnisse[modus]));
    }
    paare.push({
      index: index + 1, reihenfolge,
      baseline: ergebnisse.baseline, extension: ergebnisse.extension
    });
  }
  const gesamt = zusammenfassung(paare);
  await mkdir(path.dirname(ausgabe), { recursive: true });
  await writeFile(ausgabe, JSON.stringify({
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    commit: process.env.GITHUB_SHA ?? null,
    environment: {
      node: process.version,
      chromium: spawnSync(chromium, ["--version"], {encoding:"utf8"}).stdout.trim(),
      durationMs: dauerMs,
      pairs: anzahlPaare
    },
    paare, gesamt
  }, null, 2) + "\n");
  console.log("INTERAKTION-GESAMT " + JSON.stringify(gesamt));
  const fehlerhafte = paare.map((paar, index) => ({
    index: index + 1, ...pruefePaar(paar)
  })).filter((pruefung) => !pruefung.ok);
  if (fehlerhafte.length) {
    throw new Error("Ungültige A/B-Paare: " + JSON.stringify(fehlerhafte));
  }
  // Reale Reaktionszeit und Langtasks werden absichtlich nicht schöngefärbt
  // und noch nicht als universell kalibrierte harte Freigabeschwelle ausgegeben.
} finally {
  if (testserver) {
    await new Promise((resolve) => testserver.close(resolve));
  }
  await beenden(prozess);
}