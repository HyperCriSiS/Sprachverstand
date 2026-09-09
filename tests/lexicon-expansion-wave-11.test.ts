import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import { mapMappedSingular } from "../src/rules/person-lexicon";

describe("elfte konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Reprograf:innen", "Reprografen"],
    ["Modist:innen", "Modisten"],
    ["Visagist:innen", "Visagisten"],
    ["Katechet:innen", "Katecheten"],
    ["Kartograf:innen", "Kartografen"],
    ["Galerist:innen", "Galeristen"],
    ["Chemigraf:innen", "Chemigrafen"],
    ["Flexograf:innen", "Flexografen"],
    ["Illusionist:innen", "Illusionisten"],
    ["Humorist:innen", "Humoristen"],
    ["Orientalist:innen", "Orientalisten"]
  ])("deckt eine eindeutig schwach flektierende Personenform ab: %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["reprograf", "accusative", "reprografen"],
    ["modist", "dative", "modisten"],
    ["visagist", "genitive", "visagisten"],
    ["katechet", "accusative", "katecheten"],
    ["kartograf", "genitive", "kartografen"],
    ["galerist", "dative", "galeristen"],
    ["chemigraf", "genitive", "chemigrafen"],
    ["flexograf", "accusative", "flexografen"],
    ["illusionist", "genitive", "illusionisten"],
    ["humorist", "dative", "humoristen"],
    ["orientalist", "genitive", "orientalisten"]
  ])("stellt die schwache Singularflexion bereit: %s/%s", (base, grammaticalCase, expected) => {
    expect(mapMappedSingular(base, grammaticalCase as "nominative" | "accusative" | "dative" | "genitive")).toBe(expected);
  });

  it.each([
    "Graf:innen",
    "Fraud-Analyst:innen"
  ])("lässt mehrdeutige oder unregelmäßige Nachbarformen unverändert: %s", (input) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
