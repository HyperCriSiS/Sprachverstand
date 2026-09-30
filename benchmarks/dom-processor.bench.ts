import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import type { Rule } from "../src/core/rule";

interface Counters {
  readonly ruleCalls: number;
  readonly rootCalls: number;
  readonly replacements: number;
}

interface ScenarioResult extends Counters {
  readonly id: string;
  readonly samplesMs: readonly number[];
  readonly medianMs: number;
  readonly p95Ms: number;
}

interface IterationResult extends Counters {
  readonly durationMs: number;
}

const sampleCount = 7;
const warmupCount = 2;
const results: ScenarioResult[] = [];

function percentile(values: readonly number[], fraction: number): number {
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(sorted.length * fraction) - 1)
  );
  return sorted[index] ?? 0;
}

function roundMilliseconds(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function createRule(counter: { value: number }): Rule {
  return {
    id: "benchmark.gendered-plural",
    risk: "safe",
    apply(input) {
      counter.value += 1;
      const text = input.replaceAll("Nutzer:innen", "Nutzer");
      return {
        text,
        replacements: text === input ? 0 : 1
      };
    }
  };
}

function instrumentRootCalls(processor: DomProcessor): { value: number } {
  const counter = { value: 0 };
  const originalProcessRoot = processor.processRoot.bind(processor);
  processor.processRoot = (root: Node) => {
    counter.value += 1;
    originalProcessRoot(root);
  };
  return counter;
}

function resetDocument(): void {
  document.body.replaceChildren();
}

async function measureScenario(
  id: string,
  run: () => IterationResult | Promise<IterationResult>
): Promise<ScenarioResult> {
  for (let index = 0; index < warmupCount; index += 1) {
    resetDocument();
    await run();
  }

  const iterations: IterationResult[] = [];
  for (let index = 0; index < sampleCount; index += 1) {
    resetDocument();
    iterations.push(await run());
  }

  const samplesMs = iterations.map((iteration) =>
    roundMilliseconds(iteration.durationMs)
  );
  const last = iterations.at(-1);
  if (!last) {
    throw new Error(`Keine Benchmark-Messung für ${id}.`);
  }

  const result: ScenarioResult = {
    id,
    samplesMs,
    medianMs: roundMilliseconds(percentile(samplesMs, 0.5)),
    p95Ms: roundMilliseconds(percentile(samplesMs, 0.95)),
    ruleCalls: last.ruleCalls,
    rootCalls: last.rootCalls,
    replacements: last.replacements
  };
  results.push(result);
  return result;
}

function writeReport(): void {
  const reportPath = process.env.PERFORMANCE_REPORT_PATH;
  if (!reportPath) {
    return;
  }

  mkdirSync(path.dirname(reportPath), { recursive: true });
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    gitSha: process.env.GITHUB_SHA ?? null,
    gitRef: process.env.GITHUB_REF ?? null,
    runner: {
      node: process.version,
      platform: process.platform,
      arch: process.arch
    },
    scenarios: results
  };
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const lines = [
    "## DOM-Performance",
    "",
    `Commit: \`${report.gitSha ?? "lokal"}\``,
    "",
    "| Szenario | Median | P95 | Regelaufrufe | Root-Aufrufe | Ersetzungen |",
    "| --- | ---: | ---: | ---: | ---: | ---: |",
    ...results.map(
      (result) =>
        `| \`${result.id}\` | ${result.medianMs.toFixed(3)} ms | ${result.p95Ms.toFixed(3)} ms | ${result.ruleCalls} | ${result.rootCalls} | ${result.replacements} |`
    ),
    ""
  ];

  const markdown = `${lines.join("\n")}\n`;
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    appendFileSync(summaryPath, markdown, "utf8");
  }
  process.stdout.write(markdown);
}

afterAll(() => {
  writeReport();
  resetDocument();
});

describe("DomProcessor Performance-Baseline", () => {
  it("misst den vollständigen Initialscan mit 4.000 Textknoten", async () => {
    const result = await measureScenario("initial-scan-4000", () => {
      const ruleCounter = { value: 0 };
      const fragment = document.createDocumentFragment();
      for (let index = 0; index < 4_000; index += 1) {
        const paragraph = document.createElement("p");
        paragraph.textContent = `Nutzer:innen ${index}`;
        fragment.append(paragraph);
      }
      document.body.append(fragment);

      const processor = new DomProcessor(document, {
        rules: [createRule(ruleCounter)],
        profile: "conservative",
        processAccessibleAttributes: false
      });
      const rootCounter = instrumentRootCalls(processor);
      const startedAt = performance.now();
      processor.start();
      const durationMs = performance.now() - startedAt;
      const replacements = processor.getReplacementCount();
      processor.stop();

      return {
        durationMs,
        ruleCalls: ruleCounter.value,
        rootCalls: rootCounter.value,
        replacements
      };
    });

    expect(result.ruleCalls).toBe(4_000);
    expect(result.replacements).toBe(4_000);
  });

  it("misst stark überlappende Mutations-Roots wie bei Framework-Hydrierung", async () => {
    const result = await measureScenario("overlapping-roots-1500", () => {
      const ruleCounter = { value: 0 };
      const processor = new DomProcessor(document, {
        rules: [createRule(ruleCounter)],
        profile: "conservative",
        processAccessibleAttributes: false
      });
      const rootCounter = instrumentRootCalls(processor);
      processor.start();
      ruleCounter.value = 0;
      rootCounter.value = 0;

      const section = document.createElement("section");
      const textNodes: Text[] = [];
      const elements: HTMLElement[] = [];
      for (let index = 0; index < 1_500; index += 1) {
        const span = document.createElement("span");
        const text = document.createTextNode(`Nutzer:innen ${index}`);
        span.append(text);
        section.append(span);
        elements.push(span);
        textNodes.push(text);
      }
      document.body.append(section);

      const queue = (
        processor as unknown as { queue(node: Node): void }
      ).queue.bind(processor);
      queue(section);
      for (let index = 0; index < textNodes.length; index += 1) {
        queue(elements[index] as HTMLElement);
        queue(textNodes[index] as Text);
      }

      const startedAt = performance.now();
      processor.flush();
      const durationMs = performance.now() - startedAt;
      const replacements = processor.getReplacementCount();
      processor.stop();

      return {
        durationMs,
        ruleCalls: ruleCounter.value,
        rootCalls: rootCounter.value,
        replacements
      };
    });

    expect(result.ruleCalls).toBe(1_500);
    expect(result.replacements).toBe(1_500);
    expect(result.rootCalls).toBeGreaterThanOrEqual(1_501);
  });

  it("misst wiederholte externe Text-Rewrites desselben Knotens", async () => {
    const result = await measureScenario("framework-rewrites-500", () => {
      const paragraph = document.createElement("p");
      paragraph.textContent = "Neutral";
      document.body.append(paragraph);

      const ruleCounter = { value: 0 };
      const processor = new DomProcessor(document, {
        rules: [createRule(ruleCounter)],
        profile: "conservative",
        processAccessibleAttributes: false
      });
      const rootCounter = instrumentRootCalls(processor);
      processor.start();
      ruleCounter.value = 0;
      rootCounter.value = 0;

      const textNode = paragraph.firstChild as Text;
      const queue = (
        processor as unknown as { queue(node: Node): void }
      ).queue.bind(processor);
      const startedAt = performance.now();
      for (let index = 0; index < 500; index += 1) {
        textNode.data = `Nutzer:innen ${index}`;
        queue(textNode);
        processor.flush();
      }
      const durationMs = performance.now() - startedAt;
      const replacements = processor.getReplacementCount();
      processor.stop();

      return {
        durationMs,
        ruleCalls: ruleCounter.value,
        rootCalls: rootCounter.value,
        replacements
      };
    });

    expect(result.ruleCalls).toBe(500);
    expect(result.rootCalls).toBe(500);
    expect(result.replacements).toBe(1);
  });
});
