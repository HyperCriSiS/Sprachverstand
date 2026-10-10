import { DomProcessor } from "../src/core/dom-processor";
import type { Rule } from "../src/core/rule";

const sizes = [1000, 4000, 10000];
const methods = ["processRoot", "processElement", "processTextNode", "transformValue",
  "getInlineProtectionRanges", "shouldProtectFollowingParticiple",
  "needsLeadingContext", "replaceTextKeepingRanges", "isProcessableRoot",
  "scheduleCountNotification"];
type Metric = { calls: number; ownMs: number; totalMs: number };
type MethodMap = Record<string, (...args: unknown[]) => unknown>;

function instrument(processor: DomProcessor) {
  const instance = processor as unknown as MethodMap;
  const totals: Record<string, Metric> = {};
  const originals: Array<[string, MethodMap[string]]> = [];
  const stack: Array<{ childMs: number }> = [];
  for (const name of methods) {
    const original = instance[name];
    if (typeof original !== "function") continue;
    const metric: Metric = { calls: 0, ownMs: 0, totalMs: 0 };
    totals[name] = metric;
    originals.push([name, original]);
    instance[name] = function (this: MethodMap, ...args: unknown[]) {
      const parent = stack[stack.length - 1];
      const frame = { childMs: 0 };
      stack.push(frame);
      const start = performance.now();
      try {
        return original.apply(this, args);
      } finally {
        const elapsed = performance.now() - start;
        stack.pop();
        metric.calls++;
        metric.totalMs += elapsed;
        metric.ownMs += Math.max(0, elapsed - frame.childMs);
        if (parent) parent.childMs += elapsed;
      }
    };
  }
  return { totals, restore: () => {
    for (const [name, method] of originals) instance[name] = method;
  } };
}

function quantile(values: number[], fraction: number) {
  const ordered = [...values].sort((a, b) => a - b);
  return ordered[Math.ceil(ordered.length * fraction) - 1] ?? 0;
}

function measure(nodes: number) {
  document.body.replaceChildren();
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < nodes; index++) {
    const p = document.createElement("p");
    p.textContent = "Nutzer:innen " + index;
    fragment.append(p);
  }
  document.body.append(fragment);
  let calls = 0;
  const rule: Rule = {
    id: "audit.dom02.profile", risk: "safe",
    apply(value) {
      calls++;
      const text = value.replaceAll("Nutzer:innen", "Nutzer");
      return { text, replacements: text === value ? 0 : 1 };
    }
  };
  const processor = new DomProcessor(document, {
    rules: [rule], profile: "conservative", processAccessibleAttributes: false
  });
  const measured = instrument(processor);
  const start = performance.now();
  processor.start();
  const duration = performance.now() - start;
  measured.restore();
  const replacements = processor.getReplacementCount();
  processor.stop();
  document.body.replaceChildren();
  if (calls !== nodes || replacements !== nodes) {
    throw new Error("Ungültiger Initialscan: " + JSON.stringify({ nodes, calls, replacements }));
  }
  return { duration, methodProfile: measured.totals };
}

function run() {
  const scenarios = [];
  for (const nodes of sizes) {
    for (let i = 0; i < 2; i++) measure(nodes);
    const samplesMs: number[] = [];
    const aggregated: Record<string, Metric> = {};
    for (let i = 0; i < 7; i++) {
      const sample = measure(nodes);
      samplesMs.push(Math.round(sample.duration * 1000) / 1000);
      for (const [name, data] of Object.entries(sample.methodProfile)) {
        const sum = aggregated[name] ?? { calls: 0, ownMs: 0, totalMs: 0 };
        sum.calls += data.calls;
        sum.ownMs += data.ownMs;
        sum.totalMs += data.totalMs;
        aggregated[name] = sum;
      }
    }
    scenarios.push({
      id: "initial-scan-" + nodes, nodes, samplesMs,
      medianMs: quantile(samplesMs, 0.5),
      p95Ms: quantile(samplesMs, 0.95),
      ruleCalls: nodes, replacements: nodes,
      methodProfile: Object.fromEntries(Object.entries(aggregated)
        .map(([name, data]) => [name, {
          calls: data.calls,
          ownMs: Math.round(data.ownMs * 100) / 100,
          totalMs: Math.round(data.totalMs * 100) / 100
        }]))
    });
  }
  return { warmups: 2, iterations: 7, scenarios };
}

// Nur für den manuellen Audit; die Instrumentierung verändert die Messkosten.
(window as unknown as { __sprachverstandNativeScaleAudit: typeof run })
  .__sprachverstandNativeScaleAudit = run;
