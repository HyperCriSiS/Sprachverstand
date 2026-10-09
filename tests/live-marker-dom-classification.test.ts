import { describe, expect, it } from "vitest";
import { classifyVisibleMarkerNodes } from "../scripts/live-marker-dom-classification.mjs";

describe("Live-Diagnose: tatsächliche DOM-Textknoten", () => {
  it("unterscheidet Codebeispiele, Editoren und normalen Text", () => {
    document.body.innerHTML = [
      "<p>Die Nutzer:innen werden begrüßt.</p>",
      "<code>Nutzer:innen</code>",
      "<pre>Mitarbeiter*innen</pre>",
      '<span contenteditable="true">Student*innen</span>',
      "<div data-sprachverstand-ignore>Forscher:innen</div>",
      "<p hidden>Ein weiterer Nutzer:innen-Hinweis</p>"
    ].join("");
    const audit = classifyVisibleMarkerNodes(document, { checkLayout: false });
    expect(audit.matchedTextNodeOccurrences).toBe(5);
    expect(audit.otherOccurrences).toBe(1);
    expect(audit.excludedOccurrences).toBe(4);
    expect(audit.reasons).toEqual({ other: 1, code: 2, editor: 1, ignore: 1 });
    expect(audit.samples.find((sample) => sample.word === "Mitarbeiter*innen"))
      .toMatchObject({ reason: "code" });
  });

  it("berücksichtigt aria-hidden und geschützte Rollen über Vorfahren", () => {
    document.body.innerHTML = [
      '<section aria-hidden="true"><span>Leser:innen</span></section>',
      '<div role="textbox"><span>SchülerInnen</span></div>',
      "<p>Die LehrerInnen diskutieren.</p>"
    ].join("");
    const result = classifyVisibleMarkerNodes(document, { checkLayout: false });
    expect(result.matchedTextNodeOccurrences).toBe(3);
    expect(result.reasons).toEqual({ "aria-hidden": 1, "excluded-role": 1, other: 1 });
  });

  it("ändert keine DOM-Textknoten und gibt nur kurze Wortproben aus", () => {
    const marker = "Nutzer:innen";
    document.body.innerHTML = "<code>" + marker + "</code>";
    const before = document.body.innerHTML;
    const audit = classifyVisibleMarkerNodes(document, { checkLayout: false });
    expect(document.body.innerHTML).toBe(before);
    expect(audit.samples).toEqual([
      { id: "separator-innen", word: marker, reason: "code" }
    ]);
  });
});
