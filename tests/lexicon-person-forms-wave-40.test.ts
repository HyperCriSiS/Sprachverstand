import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";
import { substantivizedAdjectivesRule } from "../src/rules/substantivized-adjectives";

describe("vierzigste konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Egoman:innen", "Egomanen"],
    ["Ehegatt*innen", "Ehegatten"],
    ["Ergonom_innen", "Ergonomen"],
    ["Intermediär:innen", "Intermediäre"],
    ["Herr:innen", "Herren"],
    ["Bauherr:innen", "Bauherren"]
  ])("normalisiert die neue oder korrigierte Pluralform %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["egoman", "nominative", "egomane"],
    ["egoman", "accusative", "egomanen"],
    ["ehegatt", "dative", "ehegatten"],
    ["ergonom", "genitive", "ergonomen"],
    ["intermediär", "genitive", "intermediärs"],
    ["herr", "dative", "herrn"],
    ["bauherr", "genitive", "bauherrn"]
  ] as const)("bildet %s im Kasus %s korrekt ab", (base, grammaticalCase, expected) => {
    expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
  });

  it.each([
    ["Egomane", "Egomanin", "Egomane"],
    ["Ehegatte", "Ehegattin", "Ehegatte"],
    ["Ergonom", "Ergonomin", "Ergonom"],
    ["Intermediär", "Intermediärin", "Intermediär"],
    ["Herr", "Herrin", "Herr"],
    ["Bauherr", "Bauherrin", "Bauherr"]
  ])("erkennt das Paar %s/%s", (masculine, feminine, expected) => {
    expect(mapMappedSingularPair(masculine, feminine)).toBe(expected);
  });

  it.each([
    ["Einzelne:r", "Einzelner"],
    ["Fortgeschrittene:n", "Fortgeschrittenen"],
    ["Gelehrte:r", "Gelehrter"],
    ["ein:e Fortgeschrittene:r", "ein Fortgeschrittener"],
    ["den:die Gelehrte:n", "den Gelehrten"]
  ])("normalisiert die substantivierte Form %s", (input, expected) => {
    expect(substantivizedAdjectivesRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    "Göttergatt:innen",
    "Koryphäe:innen",
    "Hebamme:innen"
  ])("lässt nicht freigegebene Sonderfälle unverändert: %s", (input) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
