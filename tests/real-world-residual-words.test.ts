import { describe, expect, it } from "vitest";
import { classifyVisibleMarkerNodes } from "../scripts/live-marker-dom-classification.mjs";
import { summarizeResidualMarkerWords } from "../scripts/real-world-residual-words.mjs";

describe("Lückensuche: verbliebene Markerwörter", () => {
  it("sammelt sichtbare, ungeschützte Markerwörter aller gängigen Schreibweisen", () => {
    document.body.innerHTML = [
      "<p>Die Nutzer:innen und Nutzer:innen, eine Lehrer*in, Kolleg/-innen, Ärzt(innen), die SchülerInnen.</p>",
      "<code>Entwickler:innen</code>",
      '<span contenteditable="true">Autor*innen</span>',
      "<p>Kein Treffer: Innenstadt, Berlin, Termin, und/in.</p>"
    ].join("");
    const audit = classifyVisibleMarkerNodes(document, { checkLayout: false, collectResidualWords: true });
    expect(audit.residualWords).toEqual({
      "Nutzer:innen": 2, "Lehrer*in": 1, "Kolleg/-innen": 1, "Ärzt(innen)": 1, "SchülerInnen": 1
    });
  });

  it("sammelt nur auf ausdrücklichen Wunsch", () => {
    document.body.innerHTML = "<p>Die Nutzer:innen</p>";
    expect(classifyVisibleMarkerNodes(document, { checkLayout: false })).not.toHaveProperty("residualWords");
  });

  it("fasst Erweiterungsläufe seitenübergreifend zusammen und nennt die Baseline", () => {
    const run = (residualWords: Record<string, number>) => ({ snapshot: { nodePatternAudit: { residualWords } } });
    const summary = summarizeResidualMarkerWords([
      { slug: "a", pairs: [
        { baseline: run({ "Azubi:innen": 3, "Lehrer:innen": 2 }), extension: run({ "Azubi:innen": 3 }) },
        { baseline: run({ "Azubi:innen": 3 }), extension: run({ "Azubi:innen": 3 }) }
      ] },
      { slug: "b", baseline: run({ "Fan*innen": 1 }), extension: run({ "Fan*innen": 1 }) }
    ]);
    expect(summary).toEqual([
      { word: "Azubi:innen", count: 6, baselineCount: 6, sites: ["a"] },
      { word: "Fan*innen", count: 1, baselineCount: 1, sites: ["b"] }
    ]);
  });
});
