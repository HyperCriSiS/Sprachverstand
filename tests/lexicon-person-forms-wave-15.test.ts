import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import { mapMappedSingular } from "../src/rules/person-lexicon";

describe("fünfzehnte konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Finn:innen", "Finnen"],
    ["Dän:innen", "Dänen"]
  ])("deckt eine eindeutig belegte Personenform ab: %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["finn", "nominative", "finne"],
    ["finn", "accusative", "finnen"],
    ["finn", "dative", "finnen"],
    ["finn", "genitive", "finnen"],
    ["dän", "nominative", "däne"],
    ["dän", "accusative", "dänen"],
    ["dän", "dative", "dänen"],
    ["dän", "genitive", "dänen"]
  ] as const)("stellt die schwache Singularflexion bereit: %s/%s", (base, grammaticalCase, expected) => {
    expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
  });

  it.each([
    "Ausfinn:innen",
    "Norddän:innen"
  ])("erfasst ohne Beleg keine konstruierten Komposita: %s", (input) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
