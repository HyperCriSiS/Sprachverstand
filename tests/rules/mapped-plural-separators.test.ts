import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../../src/rules/mapped-plural-separators";

describe("mappedPluralSeparatorsRule", () => {
  it.each([
    ["Ärzt:innen", "Ärzte"],
    ["Student*innen", "Studenten"],
    ["Kolleg_innen", "Kollegen"],
    ["Kund/innen", "Kunden"],
    ["Autor·innen", "Autoren"],
    ["Moderator•innen", "Moderatoren"],
    ["Lieferant:innen", "Lieferanten"],
    ["Praktikant:innen", "Praktikanten"],
    ["Doktorand:innen", "Doktoranden"],
    ["Patient:innen", "Patienten"],
    ["Journalist:innen", "Journalisten"],
    ["Architekt:innen", "Architekten"],
    ["Ingenieur:innen", "Ingenieure"],
    ["Professor:innen", "Professoren"],
    ["Aktionär:innen", "Aktionäre"],
    ["Friseur:innen", "Friseure"],
    ["Akteur:innen", "Akteure"],
    ["Bauer:innen", "Bauern"]
  ])("wandelt %s in %s um", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it("unterstützt zusammengesetzte Wörter", () => {
    const result = mappedPluralSeparatorsRule.apply(
      "Tierärzt:innen, Werkstudent*innen, Stammkund_innen, " +
        "Koautor/innen und Co-Moderator:innen"
    );

    expect(result).toEqual({
      text: "Tierärzte, Werkstudenten, Stammkunden, Koautoren und Co-Moderatoren",
      replacements: 5
    });
  });

  it("erhält vollständige Großschreibung", () => {
    expect(mappedPluralSeparatorsRule.apply("TIERÄRZT:INNEN")).toEqual({
      text: "TIERÄRZTE",
      replacements: 1
    });
  });

  it("behandelt Bauer nur als vollständiges Wort", () => {
    const input = "Erbauer:innen und Modellbauer:innen";

    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });

  it("verändert keine nicht hinterlegten Formen", () => {
    const input = "Mutter:innen, Tochter:innen und Bruder:innen";

    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
