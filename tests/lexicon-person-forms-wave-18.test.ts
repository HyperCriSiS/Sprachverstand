import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import { mapMappedSingular } from "../src/rules/person-lexicon";

describe("achtzehnte konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Pol:innen", "Polen"],
    ["Ungar:innen", "Ungarn"],
    ["Serb:innen", "Serben"],
    ["Kroat:innen", "Kroaten"],
    ["Slowen:innen", "Slowenen"],
    ["Pol*innen", "Polen"],
    ["Serb_innen", "Serben"]
  ])("deckt eine eindeutig belegte Personenform ab: %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["pol", "nominative", "pole"],
    ["pol", "genitive", "polen"],
    ["ungar", "nominative", "ungar"],
    ["ungar", "genitive", "ungarn"],
    ["serb", "nominative", "serbe"],
    ["serb", "genitive", "serben"],
    ["kroat", "nominative", "kroate"],
    ["kroat", "genitive", "kroaten"],
    ["slowen", "nominative", "slowene"],
    ["slowen", "genitive", "slowenen"]
  ] as const)(
    "stellt die passende Singularflexion bereit: %s/%s",
    (base, grammaticalCase, expected) => {
      expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
    }
  );

  it.each([
    "Nordpol:innen",
    "Altungar:innen",
    "Neuserb:innen",
    "Altkroat:innen",
    "Südslowen:innen"
  ])("erfasst ohne Beleg keine konstruierten Komposita: %s", (input) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
