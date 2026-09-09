import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import { mapMappedSingular } from "../src/rules/person-lexicon";

describe("zwölfte konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Graveur:innen", "Graveure"],
    ["Edelsteingraveur:innen", "Edelsteingraveure"],
    ["Rotisseur:innen", "Rotisseure"],
    ["Poissonnier:innen", "Poissonniers"],
    ["Desinfektor:innen", "Desinfektoren"],
    ["Präparator:innen", "Präparatoren"],
    ["Korrepetitor:innen", "Korrepetitoren"],
    ["Ballettrepetitor:innen", "Ballettrepetitoren"],
    ["Arrangeur:innen", "Arrangeure"],
    ["Gardemanger:innen", "Gardemangers"],
    ["Prior:innen", "Prioren"]
  ])("deckt einen eindeutig gemappten Sonderplural ab: %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["graveur", "genitive", "graveurs"],
    ["edelsteingraveur", "genitive", "edelsteingraveurs"],
    ["rotisseur", "genitive", "rotisseurs"],
    ["poissonnier", "genitive", "poissonniers"],
    ["desinfektor", "genitive", "desinfektors"],
    ["präparator", "genitive", "präparators"],
    ["korrepetitor", "genitive", "korrepetitors"],
    ["ballettrepetitor", "genitive", "ballettrepetitors"],
    ["arrangeur", "genitive", "arrangeurs"],
    ["gardemanger", "genitive", "gardemangers"],
    ["prior", "genitive", "priors"]
  ])("stellt die passende Genitivform bereit: %s", (base, grammaticalCase, expected) => {
    expect(mapMappedSingular(base, grammaticalCase as "genitive")).toBe(expected);
  });

  it.each([
    "Portier:innen",
    "Nachtportier:innen",
    "Diakon:innen",
    "Fraud-Analyst:innen"
  ])("friert einen bewusst mehrdeutigen Restfall ein: %s", (input) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
