import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { join, resolve } from "node:path";

const browser = process.argv[2];
if (!["chromium", "firefox"].includes(browser)) {
  throw new Error("Browserparameter muss chromium oder firefox sein.");
}
const ausgabe = resolve("reports");
const dateien = {
  baseline: readFileSync(resolve("baseline-native.js")),
  current: readFileSync(resolve("current-native.js"))
};

function programm(...namen) {
  for (const name of namen) {
    const gefunden = spawnSync("which", [name], { encoding: "utf8" });
    if (gefunden.status === 0 && gefunden.stdout.trim()) return gefunden.stdout.trim();
  }
  throw new Error("Kein ausführbares Programm: " + namen.join(", "));
}

// CI kann sowohl die ausführbare Datei als auch deren Verzeichnis angeben.
function treiberPfad(umgebungsvariable, dateiname) {
  const konfiguriert = process.env[umgebungsvariable];
  if (konfiguriert) {
    if (existsSync(konfiguriert) && statSync(konfiguriert).isFile()) {
      return konfiguriert;
    }
    const pfad = join(konfiguriert, dateiname);
    if (existsSync(pfad) && statSync(pfad).isFile()) {
      return pfad;
    }
  }
  return programm(dateiname);
}
const treiber = browser === "chromium"
  ? treiberPfad("CHROMEWEBDRIVER", "chromedriver")
  : treiberPfad("GECKOWEBDRIVER", "geckodriver");
const browserProgramm = browser === "chromium"
  ? process.env.CHROMIUM_BIN ?? programm("chromium", "chromium-browser")
  : process.env.FIREFOX_BIN ?? programm("firefox");
const treiberPort = browser === "chromium" ? 9515 : 4444;
const treiberUrl = "http://127.0.0.1:" + treiberPort;
const schlaf = (dauer) => new Promise((fertig) => setTimeout(fertig, dauer));

async function webdriver(methode, pfad, inhalt) {
  const antwort = await fetch(treiberUrl + pfad, {
    method: methode,
    headers: inhalt === undefined ? undefined : { "content-type": "application/json" },
    body: inhalt === undefined ? undefined : JSON.stringify(inhalt)
  });
  const daten = await antwort.json();
  if (!antwort.ok || daten?.value?.error) {
    throw new Error("WebDriver " + methode + " " + pfad + ": " + JSON.stringify(daten));
  }
  return daten.value;
}

function serverStarten() {
  const server = createServer((anfrage, antwort) => {
    const adresse = new URL(anfrage.url ?? "/", "http://127.0.0.1");
    const version = adresse.pathname === "/baseline.js" ? "baseline"
      : adresse.pathname === "/current.js" ? "current" : null;
    if (version) {
      antwort.writeHead(200, {
        "content-type": "application/javascript; charset=utf-8",
        "cache-control": "no-store"
      });
      antwort.end(dateien[version]);
      return;
    }
    // Keine Anfrageparameter in HTML interpolieren; ausschließlich feste Testseiten.
    if (adresse.pathname === "/baseline.html") {
      antwort.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
      antwort.end('<!doctype html><html lang="de"><head><meta charset="utf-8"></head><body><script src="/baseline.js"></script></body></html>');
      return;
    }
    if (adresse.pathname === "/current.html") {
      antwort.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
      antwort.end('<!doctype html><html lang="de"><head><meta charset="utf-8"></head><body><script src="/current.js"></script></body></html>');
      return;
    }
    antwort.writeHead(404);
    antwort.end();
  });
  return new Promise((fertig, fehler) => {
    server.once("error", fehler);
    server.listen(0, "127.0.0.1", () => {
      const anschluss = server.address();
      if (!anschluss || typeof anschluss === "string") {
        fehler(new Error("Testserver ohne Netzwerkport.")); return;
      }
      fertig({ server, url: "http://127.0.0.1:" + anschluss.port });
    });
  });
}

const treiberLogs = [];
let startfehler;
const argumente = browser === "chromium" ? ["--port=" + treiberPort]
  : ["--host", "127.0.0.1", "--port", String(treiberPort)];
const prozess = spawn(treiber, argumente, { stdio: ["ignore", "pipe", "pipe"] });
prozess.on("error", (fehler) => { startfehler = fehler; });
prozess.stdout.on("data", (daten) => treiberLogs.push(daten.toString()));
prozess.stderr.on("data", (daten) => treiberLogs.push(daten.toString()));
let server;
let sitzung;

try {
  const frist = Date.now() + 20_000;
  let bereit = false;
  while (Date.now() < frist) {
    if (startfehler || prozess.exitCode !== null) break;
    try {
      const antwort = await fetch(treiberUrl + "/status");
      if (antwort.ok) { bereit = true; break; }
    } catch {
      // Der Browser-Treiber benötigt noch Zeit zum Start.
    }
    await schlaf(125);
  }
  if (!bereit) throw new Error("WebDriver-Start fehlgeschlagen: " + String(startfehler) + "\n" + treiberLogs.join("").slice(-4000));
  const fixture = await serverStarten();
  server = fixture.server;
  const optionen = browser === "chromium"
    ? { browserName: "chrome", "goog:chromeOptions": {
        binary: browserProgramm,
        args: ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage",
          "--no-first-run", "--disable-default-apps", "--disable-extensions"]
      } }
    : { browserName: "firefox", "moz:firefoxOptions": {
        binary: browserProgramm, args: ["-headless"]
      } };
  const eroeffnet = await webdriver("POST", "/session", {
    capabilities: { alwaysMatch: optionen }
  });
  sitzung = eroeffnet?.sessionId;
  if (!sitzung) throw new Error("Keine WebDriver-Sitzung.");
  const version = eroeffnet?.capabilities?.browserVersion ?? "unbekannt";
  await webdriver("POST", "/session/" + sitzung + "/timeouts", { script: 120_000 });
  const zeilen = { baseline: [], current: [] };
  // Umkehrung der Reihenfolge begrenzt Warmup-/Lastvorteile eines Durchlaufs.
  const reihenfolge = ["baseline", "current", "current", "baseline"];
  for (const [index, quelle] of reihenfolge.entries()) {
    await webdriver("POST", "/session/" + sitzung + "/url", {
      url: fixture.url + "/" + quelle + ".html"
    });
    const ergebnis = await webdriver("POST", "/session/" + sitzung + "/execute/sync", {
      script: "if (!window.__sprachverstandNativeScaleAudit) throw new Error('Test-Bundle fehlt'); return window.__sprachverstandNativeScaleAudit();",
      args: []
    });
    if (!ergebnis || !Array.isArray(ergebnis.scenarios) || ergebnis.scenarios.length !== 3) {
      throw new Error("Nicht alle native Messgrößen sind vorhanden.");
    }
    zeilen[quelle].push(ergebnis);
    console.log("Native Messung " + browser + " " + quelle + " Runde " + index + " erfolgreich.");
  }
  mkdirSync(ausgabe, { recursive: true });
  for (const quelle of ["baseline", "current"]) {
    const quellPfad = resolve(quelle === "baseline" ? "baseline" : "aktuell");
    const gitSha = execFileSync("git", ["-C", quellPfad, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    const paket = JSON.parse(readFileSync(resolve(quellPfad, "package.json"), "utf8"));
    const bericht = {
      schemaVersion: 1,
      sourceSha: gitSha,
      packageVersion: paket.version,
      nodeVersion: process.version,
      browser: browser,
      browserVersion: version,
      passes: zeilen[quelle]
    };
    writeFileSync(resolve(ausgabe, "native-" + browser + "-" + quelle + ".json"),
      JSON.stringify(bericht, null, 2) + "\n");
  }
  console.log("Echte " + browser + "-Messungen vollständig.");
} finally {
  if (sitzung) {
    try { await webdriver("DELETE", "/session/" + sitzung); }
    catch (fehler) { console.error(String(fehler)); }
  }
  if (server) {
    await new Promise((fertig) => server.close(() => fertig()));
  }
  if (prozess.exitCode === null) {
    prozess.kill("SIGTERM");
    await Promise.race([
      new Promise((fertig) => prozess.once("exit", fertig)),
      schlaf(2000)
    ]);
    if (prozess.exitCode === null) prozess.kill("SIGKILL");
  }
}