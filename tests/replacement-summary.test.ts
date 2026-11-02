import { afterEach, describe, expect, it } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import { summarizeReplacements } from "../src/core/replacement-summary";
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

const doubleUserRule = createRegexRule({
  id: "test.summary.double-users",
  risk: "safe",
  pattern: /Nutzerinnen und Nutzer/gu,
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

  it("zeigt bei mehreren Regeltypen nur die tatsächlich geänderten Begriffe", async () => {
    document.body.innerHTML =
      "<p>Nutzerinnen und Nutzer lesen einen langen erklärenden Satz über Sprache und später Leser:innen weiter.</p>";

    processor = new DomProcessor(document, {
      rules: [doubleUserRule, readerRule],
      profile: "conservative"
    });
    processor.start();
    await Promise.resolve();

    expect(processor.getReplacementCount()).toBe(2);
    expect(processor.getReplacementSummary()).toEqual(
      expect.arrayContaining([
        {
          original: "Nutzerinnen und Nutzer",
          replacement: "Nutzer",
          count: 1
        },
        { original: "Leser:innen", replacement: "Leser", count: 1 }
      ])
    );
    expect(processor.getReplacementSummary()).toHaveLength(2);
    expect(
      processor
        .getReplacementSummary()
        .some((entry) => entry.original.includes("langen erklärenden Satz"))
    ).toBe(false);
  });

  it("trennt mehrere Treffer derselben verkürzenden Regel trotz langem Zwischenkontext", async () => {
    document.body.innerHTML =
      "<p>Nutzerinnen und Nutzer seien zuständig. Dieser sehr lange unveränderte Mittelteil darf nicht in der Übersicht erscheinen. Am Ende bleiben Nutzerinnen und Nutzer verantwortlich.</p>";

    processor = new DomProcessor(document, {
      rules: [doubleUserRule],
      profile: "conservative"
    });
    processor.start();
    await Promise.resolve();

    expect(processor.getReplacementCount()).toBe(2);
    expect(processor.getReplacementSummary()).toEqual([
      {
        original: "Nutzerinnen und Nutzer",
        replacement: "Nutzer",
        count: 2
      }
    ]);
    expect(
      processor
        .getReplacementSummary()
        .some((entry) => entry.original.includes("Mittelteil"))
    ).toBe(false);
  });
});

describe("Paarformen in der Ersetzungsübersicht", () => {
  it.each([
    ["der / die Nutzer*in", "der Nutzer", 1, "der / die Nutzer*in", "der Nutzer"],
    ["„der oder die Nutzer*in“ liest", "„der Nutzer“ liest", 1, "der oder die Nutzer*in", "der Nutzer"],
    ["des / der Nutzer*in", "des Nutzers", 1, "des / der Nutzer*in", "des Nutzers"],
    ["Nutzer und Nutzerinnen", "Nutzer", 1, "Nutzer und Nutzerinnen", "Nutzer"]
  ])("zeigt %s vollständig", (input, output, count, original, replacement) => {
    expect(summarizeReplacements(input, output, count)).toEqual([
      { original, replacement, count: 1 }
    ]);
  });

  it("erweitert gewöhnliche Änderungen nicht", () => {
    expect(summarizeReplacements("Nutzer*innen und Kund*innen", "Nutzer und Kunden", 2)).toEqual([
      { original: "Nutzer*innen", replacement: "Nutzer", count: 1 },
      { original: "Kund*innen", replacement: "Kunden", count: 1 }
    ]);
  });
});
