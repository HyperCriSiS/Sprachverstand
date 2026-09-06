import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const html = readFileSync("static/popup/popup.html", "utf8");
const css = readFileSync("static/popup/popup.css", "utf8");
const popup = readFileSync("src/popup.ts", "utf8");
const controller = readFileSync("src/palemoon/controller.ts", "utf8");
const content = readFileSync("src/palemoon/content.ts", "utf8");
const core = readFileSync("src/core/dom-processor.ts", "utf8");
const summary = readFileSync("src/core/replacement-summary.ts", "utf8");

describe("Pale-Moon-Feature-Parität", () => {
  it("spiegelt die detaillierte Änderungsansicht", () => {
    for (const id of ["main-view", "open-replacements", "details-view", "details-count", "details-unique-count", "replacement-list", "close-replacements"]) {
      expect(html).toContain(`id="${id}"`);
    }
    expect(css).toContain(".replacement-item");
    expect(css).toContain(".details-summary");
  });

  it("transportiert Ersetzungsdetails über die Legacy-Bridge", () => {
    expect(popup).toContain('type: "sprachverstand.get-replacement-state"');
    expect(popup).toContain("renderReplacementDetails");
    expect(popup).toContain("replacementStateRefreshIntervalMs = 750");
    expect(controller).toContain("replacementSummaryFromSandbox");
    expect(controller).not.toContain("replacements: []");
    expect(content).toContain("getReplacementSummary()");
    expect(core).toContain("transformTextWithSummary");
  });

  it("bleibt innerhalb des es2017-Laufzeitziels", () => {
    expect(summary).not.toContain(".at(-1)");
    expect(summary).not.toContain("\\p{L}");
  });
});
