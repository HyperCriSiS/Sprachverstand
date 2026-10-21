import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";

describe("vierundvierzigste konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Astrolog:innen", "Astrologen"],
    ["Dekorateur*innen", "Dekorateure"],
    ["Indolog_innen", "Indologen"],
    ["Kinesiolog:innen", "Kinesiologen"],
    ["Kryptolog:innen", "Kryptologen"],
    ["Lots:innen", "Lotsen"],
    ["Metallurg:innen", "Metallurgen"],
    ["Museolog:innen", "Museologen"],
    ["Politolog:innen", "Politologen"]
  ])("normalisiert den abgesicherten Personenstamm %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["astrolog", "nominative", "astrologe"],
    ["astrolog", "genitive", "astrologen"],
    ["dekorateur", "genitive", "dekorateurs"],
    ["indolog", "dative", "indologen"],
    ["kinesiolog", "accusative", "kinesiologen"],
    ["kryptolog", "genitive", "kryptologen"],
    ["lots", "nominative", "lotse"],
    ["lots", "genitive", "lotsen"],
    ["metallurg", "nominative", "metallurge"],
    ["metallurg", "genitive", "metallurgen"],
    ["museolog", "dative", "museologen"],
    ["politolog", "accusative", "politologen"]
  ] as const)("bildet %s im Kasus %s korrekt ab", (base, grammaticalCase, expected) => {
    expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
  });

  it.each([
    ["Astrologe", "Astrologin", "Astrologe"],
    ["Dekorateur", "Dekorateurin", "Dekorateur"],
    ["Indologe", "Indologin", "Indologe"],
    ["Kinesiologe", "Kinesiologin", "Kinesiologe"],
    ["Kryptologe", "Kryptologin", "Kryptologe"],
    ["Lotse", "Lotsin", "Lotse"],
    ["Metallurge", "Metallurgin", "Metallurge"],
    ["Museologe", "Museologin", "Museologe"],
    ["Politologe", "Politologin", "Politologe"]
  ])("erkennt das abgesicherte Paar %s/%s", (masculine, feminine, expected) => {
    expect(mapMappedSingularPair(masculine, feminine)).toBe(expected);
  });

  it.each([
    "Steuer:innen",
    "Möller:innen",
    "Polster:innen"
  ])("lässt semantisch mehrdeutige Scheinbelege unverändert: %s", (input) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});