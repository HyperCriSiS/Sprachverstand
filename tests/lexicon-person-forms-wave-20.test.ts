import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import { mapMappedSingular } from "../src/rules/person-lexicon";

describe("zwanzigste konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Holländer:innen", "Holländer"],
    ["Engländer:innen", "Engländer"],
    ["Thailänder:innen", "Thailänder"],
    ["Indonesier:innen", "Indonesier"],
    ["Philippiner:innen", "Philippiner"],
    ["Portugies:innen", "Portugiesen"],
    ["Thailänder*innen", "Thailänder"],
    ["Philippiner_innen", "Philippiner"]
  ])("deckt eine belegte Personenform ab: %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["holländer", "genitive", "holländers"],
    ["engländer", "genitive", "engländers"],
    ["thailänder", "genitive", "thailänders"],
    ["indonesier", "genitive", "indonesiers"],
    ["philippiner", "genitive", "philippiners"],
    ["portugies", "nominative", "portugiese"],
    ["portugies", "accusative", "portugiesen"],
    ["portugies", "dative", "portugiesen"],
    ["portugies", "genitive", "portugiesen"]
  ] as const)(
    "stellt die passende Singularflexion bereit: %s/%s",
    (base, grammaticalCase, expected) => {
      expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
    }
  );
});
