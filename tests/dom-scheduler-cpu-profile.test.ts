import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Gezielte DOM-Last-CPU-Diagnose", () => {
  const script = readFileSync("scripts/dom-scheduler-cpu-profile.mjs", "utf8");
  const workflow = readFileSync(".github/workflows/dom-scheduler-cpu-profile.yml", "utf8");

  it("profiliert die tatsächliche Pipeline und die Queue getrennt", () => {
    for (const name of [
      "handleMutationRecords", "flushRegularNodesBudgeted",
      "processTextNode", "transformValue", "getReplacementSummary",
      "takeNextReadyNode", "invalidateFollowingContext", "processFollowingContextStep",
      "replaceTextKeepingRanges"
    ]) {
      expect(script).toContain('"' + name + '"');
    }
    expect(script).toContain("exclusiveMs");
    expect(script).toContain("nach3900Ms");
    expect(script).toContain("480");
    expect(script).toContain("1400");
  });

  it("bleibt auf lokale Daten und manuelle Diagnose beschränkt", () => {
    expect(script).toContain("src/rules/index.ts");
    expect(script).toContain("src/core/dom-processor.ts");
    expect(script).not.toContain("fetch(");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).not.toMatch(/^\s*(push|pull_request|schedule):/mu);
    expect(workflow).toContain("actions/upload-artifact@");
  });
});
