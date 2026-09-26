import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";

describe("dreiundfünfzigste konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Fernheiler:innen", "Fernheiler"],
    ["Gerontagog*innen", "Gerontagogen"],
    ["Oecolog_innen", "Oecologen"],
    ["Paradontolog:innen", "Paradontologen"],
    ["Wirtschaftsmalaiolog:innen", "Wirtschaftsmalaiologen"],
    ["Wirtschaftssinolog:innen", "Wirtschaftssinologen"]
  ])("normalisiert den abgesicherten Personenstamm %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["fernheiler", "genitive", "fernheilers"],
    ["gerontagog", "dative", "gerontagogen"],
    ["oecolog", "accusative", "oecologen"],
    ["paradontolog", "genitive", "paradontologen"],
    ["wirtschaftsmalaiolog", "dative", "wirtschaftsmalaiologen"],
    ["wirtschaftssinolog", "accusative", "wirtschaftssinologen"]
  ] as const)("bildet %s im Kasus %s korrekt ab", (base, grammaticalCase, expected) => {
    expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
  });

  it.each([
    ["Fernheiler", "Fernheilerin", "Fernheiler"],
    ["Gerontagoge", "Gerontagogin", "Gerontagoge"],
    ["Oecologe", "Oecologin", "Oecologe"],
    ["Paradontologe", "Paradontologin", "Paradontologe"],
    ["Wirtschaftsmalaiologe", "Wirtschaftsmalaiologin", "Wirtschaftsmalaiologe"],
    ["Wirtschaftssinologe", "Wirtschaftssinologin", "Wirtschaftssinologe"]
  ])("erkennt das abgesicherte Paar %s/%s", (masculine, feminine, expected) => {
    expect(mapMappedSingularPair(masculine, feminine)).toBe(expected);
  });
});
