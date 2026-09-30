import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";
import {
  getReviewedPersonFormsWave65,
  reviewedPersonFormCountWave65
} from "../src/rules/reviewed-person-forms-wave-65";

describe("fünfundsechzigste Lexikon-Ausbauwelle", () => {
  it("enthält genau den intern geprüften Exaktbestand", () => {
    expect(reviewedPersonFormCountWave65).toBe(2);

    for (const base of [
      "computervisualist",
      "eri-wart",
      "eutonist",
      "fennist",
      "mindermaschinenstricker",
      "modellist",
      "tapisserist",
      "verschmelzer",
      "wäscher",
      "registrarmaschine",
      "substitutgerät"
    ]) {
      expect(getReviewedPersonFormsWave65(base), base).toBeUndefined();
    }
  });

  it.each([
    ["Registrar:innen", "Registrare"],
    ["Substitut:innen", "Substitute"]
  ])("ersetzt den geprüften Plural %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["Registrar", "Registrarin", "Registrar"],
    ["Substitut", "Substitutin", "Substitut"]
  ])("erkennt das intern geprüfte Paar %s/%s", (masculine, feminine, expected) => {
    expect(mapMappedSingularPair(masculine, feminine)).toBe(expected);
  });

  it.each([
    ["registrar", "nominative", "registrar"],
    ["registrar", "genitive", "registrars"],
    ["substitut", "nominative", "substitut"],
    ["substitut", "genitive", "substituts"]
  ] as const)(
    "bildet die Basis %s im Kasus %s korrekt ab",
    (base, grammaticalCase, expected) => {
      expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
    }
  );
});
