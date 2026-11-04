import { afterEach, describe, expect, it } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import { technicalSpanRanges } from "../src/core/text-safety";
import { defaultRules } from "../src/rules";

let processor: DomProcessor | undefined;

afterEach(() => {
  processor?.stop({ restore: true });
  processor = undefined;
  document.body.replaceChildren();
});

function run(text: string): string {
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  document.body.append(paragraph);
  processor = new DomProcessor(document, {
    rules: defaultRules,
    profile: "aggressive",
    processAccessibleAttributes: false
  });
  processor.start();
  processor.flush();
  return paragraph.textContent ?? "";
}

// Webanalyse 21.10.2026: Dateinamen und URLs ohne Schema wurden wie Text
// umgewandelt (`…_Funktionaer_innen.pdf` → `…_Funktionaere.pdf`).
describe("Dateinamen und URLs ohne Schema im Textknoten", () => {
  it.each([
    ["Verhaltensregeln_Funktionaer_innen.pdf (120 KB)", "Verhaltensregeln_Funktionaer_innen.pdf (120 KB)"],
    ["Download: PreistraegerInnen_Filmpreis-2026.pdf", "Download: PreistraegerInnen_Filmpreis-2026.pdf"],
    ["PD Dr. Gösta Gabriel geschkult.fu-berlin.de/e/altorient/Mitarbeiter_innen/Gabriel.html",
      "PD Dr. Gösta Gabriel geschkult.fu-berlin.de/e/altorient/Mitarbeiter_innen/Gabriel.html"]
  ])("schützt: %s", (input, expected) => expect(run(input)).toBe(expected));

  it.each([
    // Natürlicher Text daneben wird weiter umgewandelt.
    ["Die Lehrer*innen finden die Liste in plan_lehrer_innen.pdf.", "Die Lehrer finden die Liste in plan_lehrer_innen.pdf."],
    ["Alle Mitarbeiter*innen lesen auf uni.de/info nach.", "Alle Mitarbeiter lesen auf uni.de/info nach."],
    // Ohne Dateiendung oder Pfad kein Schutz.
    ["Die Lehrer*innen. Danach die Schüler*innen.", "Die Lehrer. Danach die Schüler."]
  ])("%s", (input, expected) => expect(run(input)).toBe(expected));

  it("liefert getrennte Spannen für Dateiname und Host-Pfad", () => {
    const text = "Siehe a_b.pdf und uni.de/x heute";
    expect(technicalSpanRanges(text).map(({start, end}) => text.slice(start, end)))
      .toEqual(["a_b.pdf", "uni.de/x"]);
  });

  // Vierte Thunderbird-Leistungsrunde: Jedes Muster läuft nur, wenn sein
  // Literal vorkommt. Satzpunkte allein lösen keines mehr aus; die
  // Treffer selbst bleiben gleich, auch bei Großschreibung und Unicode-Folding.
  it.each([
    ["Die Lehrer:innen. Danach die Schüler*innen.", []],
    ["Zahl 3.5 bei den Nutzer:innen.", []],
    ["Siehe WWW.Example.DE heute", ["WWW.Example.DE"]],
    ["Lies HTTPS://example.org/Lehrer_innen jetzt", ["HTTPS://example.org/Lehrer_innen"]],
    ["Datei Plan.PDF liegt bei", ["Plan.PDF"]],
    ["Datei Plan.ſvg liegt bei", ["Plan.ſvg"]],
    ["Post an lehrer_innen@example.org bitte", ["lehrer_innen@example.org"]],
    ["Pfad uni.de/Mitarbeiter_innen/ oben", ["uni.de/Mitarbeiter_innen/"]]
  ])("%s", (text, expected) => {
    expect(technicalSpanRanges(text).map(({start, end}) => text.slice(start, end))).toEqual(expected);
  });
});
