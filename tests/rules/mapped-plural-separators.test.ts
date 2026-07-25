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
    ["Aktivist.innen", "Aktivisten"],
    ["Journalist’innen", "Journalisten"],
    ["Architekt‘innen", "Architekten"],
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
    ["Bauer:innen", "Bauern"],
    ["Messebauer*innen", "Messebauer"],
    ["Modellbauer:innen", "Modellbauer"],
    ["Erbauer:innen", "Erbauer"],
    ["Mutter:innen", "Mütter"],
    ["Tochter:innen", "Töchter"],
    ["Bruder:innen", "Brüder"],
    ["Vater:innen", "Väter"]
  ])("wandelt %s in %s um", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it("unterstützt zusammengesetzte Wörter und Komposita", () => {
    const result = mappedPluralSeparatorsRule.apply(
      "Tierärzt:innen, Werkstudent*innen, Stammkund_innen, " +
        "Koautor/innen, Co-Moderator:innen, Ärzt:innenkammer, " +
        "Mutter:inneninitiative und Messebauer*innenverband"
    );

    expect(result).toEqual({
      text:
        "Tierärzte, Werkstudenten, Stammkunden, Koautoren, " +
        "Co-Moderatoren, Ärztekammer, Mütterinitiative und " +
        "Messebauerverband",
      replacements: 8
    });
  });

  it("erhält vollständige Großschreibung", () => {
    expect(mappedPluralSeparatorsRule.apply("TIERÄRZT:INNEN")).toEqual({
      text: "TIERÄRZTE",
      replacements: 1
    });
  });

  it("verändert keine nicht hinterlegten Formen", () => {
    const input = "Schwester:innen und Cousine:innen";

    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
