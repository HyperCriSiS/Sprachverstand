import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import { mapMappedSingular } from "../src/rules/person-lexicon";

describe("einundzwanzigste konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Luxemburger:innen", "Luxemburger"],
    ["Bosnier:innen", "Bosnier"],
    ["Montenegriner:innen", "Montenegriner"],
    ["Litauer:innen", "Litauer"],
    ["Georgier:innen", "Georgier"],
    ["Armenier:innen", "Armenier"],
    ["Kasach:innen", "Kasachen"],
    ["Armenier*innen", "Armenier"],
    ["Kasach_innen", "Kasachen"]
  ])("deckt eine belegte Personenform ab: %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["luxemburger", "genitive", "luxemburgers"],
    ["bosnier", "genitive", "bosniers"],
    ["montenegriner", "genitive", "montenegriners"],
    ["litauer", "genitive", "litauers"],
    ["georgier", "genitive", "georgiers"],
    ["armenier", "genitive", "armeniers"],
    ["kasach", "nominative", "kasache"],
    ["kasach", "accusative", "kasachen"],
    ["kasach", "dative", "kasachen"],
    ["kasach", "genitive", "kasachen"]
  ] as const)(
    "stellt die passende Singularflexion bereit: %s/%s",
    (base, grammaticalCase, expected) => {
      expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
    }
  );
});
