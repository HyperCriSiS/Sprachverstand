import { describe, expect, it } from "vitest";
import { binnenIPluralRule } from "../../src/rules/binnen-i";

describe("binnenIPluralRule", () => {
  it("wandelt sichere Pluralformen um", () => {
    const result = binnenIPluralRule.apply(
      "NutzerInnen, MitarbeiterInnen, ÄrztInnen, StudentInnen, " +
        "KollegInnen und KundInnen"
    );

    expect(result).toEqual({
      text: "Nutzer, Mitarbeiter, Ärzte, Studenten, Kollegen und Kunden",
      replacements: 6
    });
  });

  it("unterstützt zusammengesetzte Formen und Komposita", () => {
    const result = binnenIPluralRule.apply(
      "Online-NutzerInnen, TierärztInnen, WerkstudentInnen, " +
        "KoautorInnen, StammkundInnen, NutzerInnenkonto und " +
        "MutterInneninitiative"
    );

    expect(result).toEqual({
      text:
        "Online-Nutzer, Tierärzte, Werkstudenten, Koautoren, " +
        "Stammkunden, Nutzerkonto und Mütterinitiative",
      replacements: 7
    });
  });

  it("unterstützt unregelmäßige Familienpluralformen", () => {
    const result = binnenIPluralRule.apply(
      "MutterInnen, TochterInnen, BruderInnen und VaterInnen"
    );

    expect(result).toEqual({
      text: "Mütter, Töchter, Brüder und Väter",
      replacements: 4
    });
  });

  it("erhält die Schreibweise des maskulinen Wortteils", () => {
    expect(binnenIPluralRule.apply("NUTZERInnen und ÄRZTInnen")).toEqual({
      text: "NUTZER und ÄRZTE",
      replacements: 2
    });
  });

  it("verändert keine normalen Feminina oder Wörter mit Innen", () => {
    const input =
      "Nutzerinnen, Ärztinnen, Innen, Innenstadt, Innenminister, " +
        "LinkedIn und InDesign";

    expect(binnenIPluralRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });

  it("verändert keine unbekannten Binnen-I-Formen", () => {
    const input = "SchwesterInnen und CousineInnen";

    expect(binnenIPluralRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });

  it("interpretiert reine Versalschreibung nicht als Binnen-I", () => {
    const input = "NUTZERINNEN und ÄRZTINNEN";

    expect(binnenIPluralRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
