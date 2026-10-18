import { build } from "esbuild";
import { JSDOM } from "jsdom";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { Buffer } from "node:buffer";

// Rein lokale CPU-/Warteschlangendiagnose; weder Browser- noch Release-Abnahme.
const arg = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index < 0 ? fallback : process.argv[index + 1];
};
const ticks = Number(arg("--ticks", "30"));
const output = path.resolve(arg("--output", "artifacts/dom-scheduler-cpu/report.json"));
if (!Number.isInteger(ticks) || ticks < 10 || ticks > 100) {
  throw new Error("--ticks muss zwischen 10 und 100 liegen.");
}

async function ladeModul(entry) {
  const built = await build({
    entryPoints: [entry], bundle: true, platform: "browser",
    format: "esm", write: false, outfile: "diagnose.js",
    logLevel: "silent"
  });
  const code = built.outputFiles?.[0]?.text;
  if (!code) throw new Error("Kein Diagnose-Bundle für " + entry);
  return import("data:text/javascript;base64," +
    Buffer.from(code).toString("base64"));
}

const dom = new JSDOM("<!doctype html><html lang='de'><body></body></html>", {
  url: "https://beispiel.invalid/"
});
const { window } = dom;
// Die DOM-Implementierung muss für die unveränderten Produktmethoden sichtbar sein.
for (const name of [
  "Node", "Text", "Element", "HTMLElement", "Document", "ShadowRoot",
  "NodeFilter", "MutationObserver", "Range"
]) {
  globalThis[name] = window[name];
}

const [{ DomProcessor }, { defaultRules }] = await Promise.all([
  ladeModul("src/core/dom-processor.ts"),
  ladeModul("src/rules/index.ts")
]);
const { document } = window;
const fragment = document.createDocumentFragment();
for (let index = 0; index < 1400; index++) {
  const p = document.createElement("p");
  p.textContent = index % 50 === 0
    ? "Nutzer:innen in der Dokumentation " + index
    : "Neutraler Abschnitt der Dokumentation Nummer " + index;
  fragment.append(p);
}
const root = document.createElement("div");
root.id = "dynamic-root";
const mutable = [];
for (let index = 0; index < 480; index++) {
  const span = document.createElement("span");
  span.textContent = "Nutzer:innen " + index;
  root.append(span);
  mutable.push(span);
}
fragment.append(root);
document.body.append(fragment);

const processor = new DomProcessor(document, {
  rules: defaultRules,
  profile: "aggressive",
  protectedTerms: [],
  processQuotedText: true,
  processAccessibleAttributes: true,
  processSubtitles: false,
  onReplacementCountChange: () => {}
});
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
processor.start();
processor.flush();
await pause(0);

// Exklusive Zeiten berücksichtigen verschachtelte instrumentierte Aufrufe;
// Summen enthalten aber weiterhin nicht instrumentierte Unterfunktionen.
const stats = new Map();
const stack = [];
for (const name of [
  "handleMutationRecords", "flushRegularNodesBudgeted", "processTraversalStep",
  "processTextNode", "transformValue", "getReplacementSummary",
  "takeNextReadyNode", "invalidateFollowingContext", "processFollowingContextStep",
  "invalidatePrecedingParticipleContext", "invalidateInlineProtectionAround",
  "queue", "scheduleFlush", "replaceTextKeepingRanges"
]) {
  const original = processor[name];
  if (typeof original !== "function") {
    throw new Error("Nicht vorhandene Profilfunktion: " + name);
  }
  processor[name] = function (...args) {
    const entry = { start: performance.now(), childrenMs: 0 };
    stack.push(entry);
    try {
      return original.apply(this, args);
    } finally {
      const inclusive = performance.now() - entry.start;
      stack.pop();
      const parent = stack[stack.length - 1];
      if (parent) parent.childrenMs += inclusive;
      const item = stats.get(name) ?? {
        calls: 0, inclusiveMs: 0, exclusiveMs: 0, maxInclusiveMs: 0
      };
      item.calls++;
      item.inclusiveMs += inclusive;
      item.exclusiveMs += Math.max(0, inclusive - entry.childrenMs);
      item.maxInclusiveMs = Math.max(item.maxInclusiveMs, inclusive);
      stats.set(name, item);
    }
  };
}

const snapshot = () => ({
  unveraendert: mutable.filter((element) =>
    element.textContent?.startsWith("Nutzer:innen")).length,
  korrigiert: mutable.filter((element) =>
    element.textContent?.startsWith("Nutzer ") ||
    element.textContent === "Nutzer").length,
  offeneKnoten: processor.pendingNodes.size,
  traversalAktiv: Boolean(processor.activeTraversal),
  offeneAttribute: processor.pendingAttributes.size,
  ersetzungen: processor.getReplacementCount()
});
const tickDelays = [];
let previousTick = performance.now();
let completed = 0;
const began = performance.now();
await new Promise((resolve) => {
  const timer = setInterval(() => {
    const now = performance.now();
    tickDelays.push(now - previousTick);
    previousTick = now;
    for (let offset = 0; offset < 48; offset++) {
      const index = (completed * 48 + offset) % mutable.length;
      mutable[index].textContent = "Nutzer:innen " + completed + "-" + offset;
    }
    completed++;
    if (completed >= ticks) {
      clearInterval(timer);
      resolve();
    }
  }, 40);
});
const unterLast = snapshot();
await pause(400);
const nach400Ms = snapshot();
await pause(3500);
const nach3900Ms = snapshot();
processor.stop();
dom.window.close();

const methoden = [...stats.entries()]
  .map(([name, value]) => ({ name, ...value }))
  .sort((a, b) => b.exclusiveMs - a.exclusiveMs);
const report = {
  schemaVersion: 1,
  hinweis: "JSDOM/Node-Profil; Instrumentierung verursacht Overhead. Keine realen Chromium-/Firefox-Laufzeiten oder Release-Gates.",
  commit: process.env.GITHUB_SHA ?? null,
  node: process.version,
  ticks: completed,
  intervalMs: 40,
  gesamteLastdauerMs: performance.now() - began - 3900,
  tickAbstandMaximumMs: Math.max(...tickDelays),
  nachLast: unterLast, nach400Ms, nach3900Ms, methoden
};
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(report, null, 2) + "\n");
console.log("DOM-SCHEDULER-DIAGNOSE " + JSON.stringify({
  ticks: completed, nach400Ms, nach3900Ms,
  teuersteMethoden: methoden.slice(0, 10)
}));
