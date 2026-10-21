import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import { mapMappedSingular } from "../src/rules/person-lexicon";

describe("vierzehnte konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Operator:innen", "Operatoren"],
    ["Trauzeug:innen", "Trauzeugen"],
    ["Sünder:innen", "Sünder"],
    ["Ries:innen", "Riesen"]
  ])("deckt eine eindeutig belegte Personenform ab: %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["operator", "genitive", "operators"],
    ["trauzeug", "nominative", "trauzeuge"],
    ["trauzeug", "accusative", "trauzeugen"],
    ["trauzeug", "dative", "trauzeugen"],
    ["trauzeug", "genitive", "trauzeugen"],
    ["sünder", "genitive", "sünders"],
    ["ries", "nominative", "riese"],
    ["ries", "genitive", "riesen"]
  ] as const)("stellt die passende Singularflexion bereit: %s/%s", (base, grammaticalCase, expected) => {
    expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
  });
});
