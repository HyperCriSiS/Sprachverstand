import { afterEach, describe, expect, it } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import { defaultRules } from "../src/rules";
import { aggregateReplacementSummaries } from "../src/core/replacement-summary";

let processor: DomProcessor | undefined;
function start(): void {
  processor = new DomProcessor(document, {rules: defaultRules, profile: "aggressive",
    processAccessibleAttributes: true});
  processor.start(); processor.flush();
}
async function flush(): Promise<void> {
  await Promise.resolve(); processor?.flush(); await Promise.resolve();
}
afterEach(() => {processor?.stop({restore: true}); processor = undefined; document.body.replaceChildren();});

describe("Inkrementelle Übersicht aller verbleibenden Ersetzungen", () => {
  it("gleicht Texte, Attribute, externe Änderungen, Entfernen und Optionswechsel ab", async () => {
    document.body.innerHTML = '<p>Nutzer:innen</p><p>Nutzer:innen</p><button title="Lehrer:innen">neutral</button>';
    start();
    expect(processor?.getReplacementSummary()).toEqual([
      {original: "Nutzer:innen", replacement: "Nutzer", count: 2},
      {original: "Lehrer:innen", replacement: "Lehrer", count: 1}
    ]);
    document.querySelector("p")!.textContent = "Lehrer:innen";
    document.querySelector("button")!.removeAttribute("title");
    await flush();
    expect(processor?.getReplacementSummary()).toEqual([
      {original: "Lehrer:innen", replacement: "Lehrer", count: 1},
      {original: "Nutzer:innen", replacement: "Nutzer", count: 1}
    ]);
    document.querySelectorAll("p")[1]!.remove();
    await flush();
    expect(processor?.getReplacementSummary()).toEqual([
      {original: "Lehrer:innen", replacement: "Lehrer", count: 1}
    ]);
    processor?.updateOptions({rules: [], profile: "aggressive"});
    processor?.flush();
    expect(processor?.getReplacementSummary()).toEqual([]);
    expect(document.querySelector("p")!.textContent).toBe("Lehrer:innen");
  });

  it("lässt Aufrufer mit einer veränderbaren Kopie die Zähler nicht verändern", () => {
    document.body.innerHTML = "<p>Nutzer:innen</p>"; start();
    const snapshot = processor!.getReplacementSummary();
    (snapshot[0] as {count: number}).count = 999;
    snapshot.length = 0;
    expect(processor?.getReplacementSummary()).toEqual([
      {original: "Nutzer:innen", replacement: "Nutzer", count: 1}
    ]);
    processor?.restoreAll();
    expect(processor?.getReplacementSummary()).toEqual([]);
  });

  it("trennt Paare mit Nullzeichen und ordnet gleichlautende Quellen stabil", () => {
    expect(aggregateReplacementSummaries([
      {original: "a\u0000b", replacement: "c", count: 1},
      {original: "a", replacement: "b\u0000c", count: 2},
      {original: "gleich", replacement: "z", count: 1},
      {original: "gleich", replacement: "a", count: 1}
    ])).toEqual([
      {original: "a", replacement: "b\u0000c", count: 2},
      {original: "a\u0000b", replacement: "c", count: 1},
      {original: "gleich", replacement: "a", count: 1},
      {original: "gleich", replacement: "z", count: 1}
    ]);
  });
});
