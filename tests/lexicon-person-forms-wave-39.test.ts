import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";
import { substantivizedAdjectivesRule } from "../src/rules/substantivized-adjectives";

describe("neununddreißigste konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Adjutant:innen", "Adjutanten"],
    ["Autodidakt*innen", "Autodidakten"],
    ["Banaus_innen", "Banausen"],
    ["Kulturbanaus:innen", "Kulturbanausen"],
    ["Dilettant:innen", "Dilettanten"]
  ])("normalisiert die neue schwache Personenform %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["adjutant", "nominative", "adjutant"],
    ["adjutant", "accusative", "adjutanten"],
    ["autodidakt", "dative", "autodidakten"],
    ["banaus", "nominative", "banause"],
    ["kulturbanaus", "genitive", "kulturbanausen"],
    ["dilettant", "genitive", "dilettanten"]
  ] as const)("bildet %s im Kasus %s korrekt ab", (base, grammaticalCase, expected) => {
    expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
  });

  it.each([
    ["Adjutant", "Adjutantin", "Adjutant"],
    ["Autodidakt", "Autodidaktin", "Autodidakt"],
    ["Banause", "Banausin", "Banause"],
    ["Kulturbanause", "Kulturbanausin", "Kulturbanause"],
    ["Dilettant", "Dilettantin", "Dilettant"]
  ])("erkennt das Paar %s/%s", (masculine, feminine, expected) => {
    expect(mapMappedSingularPair(masculine, feminine)).toBe(expected);
  });

  it.each([
    ["Angeklagte:r", "Angeklagter"],
    ["Befragte:n", "Befragten"],
    ["Bankangestellte:r", "Bankangestellter"],
    ["ein:e Befragte:r", "ein Befragter"],
    ["den:die Angeklagte:n", "den Angeklagten"]
  ])("normalisiert die substantivierte Form %s", (input, expected) => {
    expect(substantivizedAdjectivesRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    "Alumnus:innen",
    "Connaisseur:innen",
    "Dompteur:innen"
  ])("lässt unregelmäßige, nicht abgesicherte Kurzformen unverändert: %s", (input) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
