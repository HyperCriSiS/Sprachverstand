import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";
import { substantivizedAdjectivesRule } from "../src/rules/substantivized-adjectives";

describe("dreiundvierzigste konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Tischler:innen", "Tischler"],
    ["Torhüter*innen", "Torhüter"],
    ["Turner_innen", "Turner"],
    ["Torwart:innen", "Torwarte"],
    ["Vorfahr:innen", "Vorfahren"]
  ])("normalisiert die neue Personenform %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["tischler", "genitive", "tischlers"],
    ["torhüter", "genitive", "torhüters"],
    ["turner", "genitive", "turners"],
    ["torwart", "genitive", "torwarts"],
    ["vorfahr", "nominative", "vorfahre"],
    ["vorfahr", "accusative", "vorfahren"]
  ] as const)("bildet %s im Kasus %s korrekt ab", (base, grammaticalCase, expected) => {
    expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
  });

  it.each([
    ["Tischler", "Tischlerin", "Tischler"],
    ["Torhüter", "Torhüterin", "Torhüter"],
    ["Turner", "Turnerin", "Turner"],
    ["Torwart", "Torwartin", "Torwart"],
    ["Vorfahre", "Vorfahrin", "Vorfahre"]
  ])("erkennt das Paar %s/%s", (masculine, feminine, expected) => {
    expect(mapMappedSingularPair(masculine, feminine)).toBe(expected);
  });

  it.each([
    ["Verbündete:r", "Verbündeter"],
    ["Verdächtige:n", "Verdächtigen"],
    ["Vertraute:r", "Vertrauter"],
    ["ein:e Verbündete:r", "ein Verbündeter"],
    ["den:die Verdächtige:n", "den Verdächtigen"]
  ])("normalisiert die substantivierte Form %s", (input, expected) => {
    expect(substantivizedAdjectivesRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["Verwandte:r", "Verwandter"],
    ["Vorgesetzte:r", "Vorgesetzter"],
    ["Vorsitzende:r", "Vorsitzender"],
    ["Verantwortliche:r", "Verantwortlicher"]
  ])("bestätigt die bereits vorhandene Adjektivabdeckung für %s", (input, expected) => {
    expect(substantivizedAdjectivesRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    "Typ:innen",
    "Waise:innen",
    "Vordermann:innen",
    "Teilnehmerliste:innen"
  ])("lässt ungeeignete oder nicht personenbezogene Kurzformen unverändert: %s", (input) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
