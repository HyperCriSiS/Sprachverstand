import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import { mapMappedSingular } from "../src/rules/person-lexicon";

describe("vierundzwanzigste konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Belizer:innen", "Belizer"],
    ["Beniner:innen", "Beniner"],
    ["Bhutaner:innen", "Bhutaner"],
    ["Bolivianer:innen", "Bolivianer"],
    ["Botsuaner:innen", "Botsuaner"],
    ["Bruneier:innen", "Bruneier"],
    ["Burkiner:innen", "Burkiner"],
    ["Burundier:innen", "Burundier"],
    ["Beniner*innen", "Beniner"],
    ["Burundier_innen", "Burundier"]
  ])("deckt eine belegte Personenform ab: %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["belizer", "genitive", "belizers"],
    ["beniner", "genitive", "beniners"],
    ["bhutaner", "genitive", "bhutaners"],
    ["bolivianer", "genitive", "bolivianers"],
    ["botsuaner", "genitive", "botsuaners"],
    ["bruneier", "genitive", "bruneiers"],
    ["burkiner", "genitive", "burkiners"],
    ["burundier", "genitive", "burundiers"]
  ] as const)(
    "stellt die passende Singularflexion bereit: %s/%s",
    (base, grammaticalCase, expected) => {
      expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
    }
  );
});
