import { describe, expect, it } from "vitest";
import { knownPluralSeparatorsRule } from "../../src/rules/known-plural-separators";

// Begrenzte Gegenprobe anhand tatsächlich veröffentlichter Kurzformen.
// Die Tests prüfen die Runtime, nicht die Häufigkeit in einem Korpus.
describe("Realtext-Gegenprobe: Kurzformen und Kontextgrenzen", () => {
  it.each([
    ["Mitarbeiter/-innen", "Mitarbeiter"],
    ["Lehrer/-innen", "Lehrer"],
    ["Lehrer(innen)", "Lehrer"]
  ])("vereinfacht belegte Personenpluralform %s zu %s", (input, expected) => {
    expect(knownPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it("verarbeitet mehrere belegte Kurzformen ohne benachbarte Doppelnennung anzutasten", () => {
    expect(
      knownPluralSeparatorsRule.apply(
        "Mitarbeiter/-innen sowie Lehrer(innen) sprechen mit Kollegen/Kolleginnen."
      )
    ).toEqual({
      text: "Mitarbeiter sowie Lehrer sprechen mit Kollegen/Kolleginnen.",
      replacements: 2
    });
  });

  it.each([
    "Direktor/-in",
    "Lehrer(in)",
    "Arzt/Ärztin",
    "Kollegen/Kolleginnen",
    "Kolleg(inn)en",
    "Beamt/-in",
    "Mitarbeiterinnen",
    "Lehrer\u00AD/-innen"
  ])("bewahrt Singular-, Doppelnennungs- und Grenzfall %s unverändert", (input) => {
    expect(knownPluralSeparatorsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
