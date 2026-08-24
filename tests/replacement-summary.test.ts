import { afterEach, describe, expect, it } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import { createRegexRule } from "../src/core/rule";

const rule = createRegexRule({
  id: "test.summary",
  risk: "safe",
  pattern: /Nutzer:innen/gu,
  replace: () => "Nutzer"
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
      rules: [rule],
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
});
