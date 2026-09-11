import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import { mapMappedSingular } from "../src/rules/person-lexicon";

describe("sechzehnte konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Tschech:innen", "Tschechen"],
    ["Ir:innen", "Iren"]
  ])("deckt eine eindeutig belegte Personenform ab: %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["tschech", "nominative", "tscheche"],
    ["tschech", "accusative", "tschechen"],
    ["tschech", "dative", "tschechen"],
    ["tschech", "genitive", "tschechen"],
    ["ir", "nominative", "ire"],
    ["ir", "accusative", "iren"],
    ["ir", "dative", "iren"],
    ["ir", "genitive", "iren"]
  ] as const)("stellt die schwache Singularflexion bereit: %s/%s", (base, grammaticalCase, expected) => {
    expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
  });

  it.each([
    "Alttschech:innen",
    "Nordir:innen"
  ])("erfasst ohne Beleg keine konstruierten Komposita: %s", (input) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
