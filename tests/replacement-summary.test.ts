import { afterEach, describe, expect, it } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import { createRegexRule } from "../src/core/rule";

const userRule = createRegexRule({
  id: "test.summary.users",
  risk: "safe",
  pattern: /Nutzer:innen/gu,
  replace: () => "Nutzer"
});

const readerRule = createRegexRule({
  id: "test.summary.readers",
  risk: "safe",
  pattern: /Leser:innen/gu,
  replace: () => "Leser"
});

let processor: DomProcessor | undefined;

afterEach(() => {
  processor?.stop();
  processor = undefined;
  document.body.innerHTML = "";
});

describe("Ersetzungsübersicht", () => {
  it("fasst gleiche tatsächliche Ersetzungen für den aktuellen DOM zusammen", async () => {
    document.body.innerHTML = `
      <p>Nutzer:innen lesen.</p>
      <p>Noch einmal Nutzer:innen.</p>
    `;

    let latestSummary: readonly {
      readonly original: string;
      readonly replacement: string;
      readonly count: number;
    }[] = [];

    processor = new DomProcessor(document, {
      rules: [userRule],
      profile: "conservative",
      onReplacementCountChange: (_count, replacements) => {
        latestSummary = replacements;
      }
    });
    processor.start();
    await Promise.resolve();

    expect(processor.getReplacementCount()).toBe(2);
    expect(latestSummary).toEqual([
      { original: "Nutzer:innen", replacement: "Nutzer", count: 2 }
    ]);
  });

  it("führt mehrere Ersetzungen im selben Textknoten als einzelne Begriffe auf", async () => {
    document.body.innerHTML = "<p>Nutzer:innen und Leser:innen lesen.</p>";

    processor = new DomProcessor(document, {
      rules: [userRule, readerRule],
      profile: "conservative"
    });
    processor.start();
    await Promise.resolve();

    expect(processor.getReplacementCount()).toBe(2);
    expect(processor.getReplacementSummary()).toHaveLength(2);
    expect(processor.getReplacementSummary()).toEqual(
      expect.arrayContaining([
        { original: "Nutzer:innen", replacement: "Nutzer", count: 1 },
        { original: "Leser:innen", replacement: "Leser", count: 1 }
      ])
    );
  });
});
