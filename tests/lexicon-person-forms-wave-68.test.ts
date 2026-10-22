import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";
import {
  getReviewedPersonFormsWave68,
  reviewedPersonFormCountWave68
} from "../src/rules/reviewed-person-forms-wave-68";

describe("achtundsechzigste Lexikon-Ausbauwelle", () => {
  it("enthält genau den intern geprüften Exaktbestand", () => {
    expect(reviewedPersonFormCountWave68).toBe(2);

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
      "fiaker",
      "mikrograf",
      "monitor",
      "walzer",
      "kettlermaschine",
      "mosterpresse"
    ]) {
      expect(getReviewedPersonFormsWave68(base), base).toBeUndefined();
    }
  });

  it.each([
    ["Kettler:innen", "Kettler"],
    ["Moster:innen", "Moster"]
  ])("ersetzt den geprüften Plural %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["Kettler", "Kettlerin", "Kettler"],
    ["Moster", "Mosterin", "Moster"]
  ])("erkennt das intern geprüfte Paar %s/%s", (masculine, feminine, expected) => {
    expect(mapMappedSingularPair(masculine, feminine)).toBe(expected);
  });

  it.each([
    ["kettler", "nominative", "kettler"],
    ["kettler", "genitive", "kettlers"],
    ["moster", "nominative", "moster"],
    ["moster", "genitive", "mosters"]
  ] as const)(
    "bildet die Basis %s im Kasus %s korrekt ab",
    (base, grammaticalCase, expected) => {
      expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
    }
  );
});
