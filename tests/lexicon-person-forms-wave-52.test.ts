import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";

describe("zweiundfünfzigste konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Aerolog:innen", "Aerologen"],
    ["Algesiolog*innen", "Algesiologen"],
    ["Anaplastolog_innen", "Anaplastologen"],
    ["Atlaslog:innen", "Atlaslogen"],
    ["Kaukasiolog:innen", "Kaukasiologen"],
    ["Morpholog:innen", "Morphologen"],
    ["Sozialgerontolog:innen", "Sozialgerontologen"],
    ["Töpfergesell:innen", "Töpfergesellen"],
    ["Vitalog:innen", "Vitalogen"],
    ["Wirtschaftsjapanolog:innen", "Wirtschaftsjapanologen"]
  ])("normalisiert den abgesicherten Personenstamm %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["aerolog", "genitive", "aerologen"],
    ["algesiolog", "dative", "algesiologen"],
    ["anaplastolog", "accusative", "anaplastologen"],
    ["atlaslog", "genitive", "atlaslogen"],
    ["kaukasiolog", "dative", "kaukasiologen"],
    ["morpholog", "accusative", "morphologen"],
    ["sozialgerontolog", "genitive", "sozialgerontologen"],
    ["töpfergesell", "dative", "töpfergesellen"],
    ["vitalog", "accusative", "vitalogen"],
    ["wirtschaftsjapanolog", "genitive", "wirtschaftsjapanologen"]
  ] as const)("bildet %s im Kasus %s korrekt ab", (base, grammaticalCase, expected) => {
    expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
  });

  it.each([
    ["Aerologe", "Aerologin", "Aerologe"],
    ["Algesiologe", "Algesiologin", "Algesiologe"],
    ["Anaplastologe", "Anaplastologin", "Anaplastologe"],
    ["Atlasloge", "Atlaslogin", "Atlasloge"],
    ["Kaukasiologe", "Kaukasiologin", "Kaukasiologe"],
    ["Morphologe", "Morphologin", "Morphologe"],
    ["Sozialgerontologe", "Sozialgerontologin", "Sozialgerontologe"],
    ["Töpfergeselle", "Töpfergesellin", "Töpfergeselle"],
    ["Vitaloge", "Vitalogin", "Vitaloge"],
    ["Wirtschaftsjapanologe", "Wirtschaftsjapanologin", "Wirtschaftsjapanologe"]
  ])("erkennt das abgesicherte Paar %s/%s", (masculine, feminine, expected) => {
    expect(mapMappedSingularPair(masculine, feminine)).toBe(expected);
  });
});
