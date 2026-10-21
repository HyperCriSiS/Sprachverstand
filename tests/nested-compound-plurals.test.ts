import { afterEach, describe, expect, it } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

let processor: DomProcessor | undefined;

afterEach(() => {
  processor?.stop({ restore: true });
  processor = undefined;
  document.body.replaceChildren();
});

// Webanalyse 21.10.2026 (CMP-02): `Patient*innenvertreter*innen` blieb als
// `Patientenvertreter*innen` stehen, weil der äußere Teil erst nach der
// Auflösung des inneren erkennbar war.
describe("verschachtelte Komposita mit zwei Markern", () => {
  it.each([
    ["Patient*innenvertreter*innen", "Patientenvertreter"],
    ["Patient:innenvertreter:innen", "Patientenvertreter"],
    ["Patient/innenvertreter/innen", "Patientenvertreter"],
    ["Doktorand*innenvertreter*innen", "Doktorandenvertreter"],
    ["Held:innenbesucher:innen", "Heldenbesucher"],
    ["Schüler*innenvertreter*innen", "Schülervertreter"],
    ["Bürger*innenmeister*innen", "Bürgermeister"],
    ["PATIENT*INNENVERTRETER*INNEN", "PATIENTENVERTRETER"],
    // Gemischte Marker sind eine Ausgangsvariante derselben Form.
    ["Patient*innenvertreter:innen", "Patientenvertreter"],
    // Der äußere Marker läuft danach durch die üblichen Regeln.
    ["Gespräch mit Patient*innenvertreter*innen", "Gespräch mit Patientenvertretern"],
    ["den Schüler*innenvertreter*innen", "den Schülervertretern"],
    ["Patient*innenvertreter*in", "Patientenvertreter"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));

  it.each([
    // Äußeres Wort ist keine Person: nur der bisherige Präfixpfad.
    ["Nutzer*innenkonto*innen", "Nutzerkonto*innen"],
    ["Expert*innenbeirat*innen", "Expertenbeirat*innen"],
    // Der Singularschutz für mehrdeutige Begleitwörter bleibt erhalten.
    ["eine Patient*innenvertreter*in", "eine Patientenvertreter*in"],
    // Bisherige einfache Komposita unverändert.
    ["Ärzt*innenvertretung", "Ärztevertretung"],
    ["Expert*innen-Workshops", "Experten-Workshops"],
    ["Patientenvertreter", "Patientenvertreter"],
    ["Patientenvertretung", "Patientenvertretung"]
  ])("bleibt: %s", (input, expected) => expect(t(input)).toBe(expected));

  it("wirkt auch im DomProcessor und stellt beim Ausschalten wieder her", () => {
    document.body.innerHTML = "<p>Wir suchen Patient*innenvertreter*innen.</p>";
    processor = new DomProcessor(document, {
      rules: defaultRules,
      profile: "aggressive",
      processAccessibleAttributes: false
    });
    processor.start();
    processor.flush();
    const p = document.querySelector("p")!;
    expect(p.textContent).toBe("Wir suchen Patientenvertreter.");
    processor.stop({ restore: true });
    processor = undefined;
    expect(p.textContent).toBe("Wir suchen Patient*innenvertreter*innen.");
  });
});
