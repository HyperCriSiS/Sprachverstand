import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import { mapMappedSingular } from "../src/rules/person-lexicon";

describe("siebzehnte konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Schwed:innen", "Schweden"],
    ["Lett:innen", "Letten"],
    ["Est:innen", "Esten"],
    ["Slowak:innen", "Slowaken"],
    ["Schwed*innen", "Schweden"],
    ["Lett_innen", "Letten"]
  ])("deckt eine eindeutig belegte Personenform ab: %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["schwed", "nominative", "schwede"],
    ["schwed", "accusative", "schweden"],
    ["schwed", "dative", "schweden"],
    ["schwed", "genitive", "schweden"],
    ["lett", "nominative", "lette"],
    ["lett", "genitive", "letten"],
    ["est", "nominative", "este"],
    ["est", "genitive", "esten"],
    ["slowak", "nominative", "slowake"],
    ["slowak", "genitive", "slowaken"]
  ] as const)(
    "stellt die schwache Singularflexion bereit: %s/%s",
    (base, grammaticalCase, expected) => {
      expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
    }
  );

  it.each([
    "Altschwed:innen",
    "Nordlett:innen",
    "Südest:innen",
    "AltSlowak:innen"
  ])("erfasst ohne Beleg keine konstruierten Komposita: %s", (input) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
