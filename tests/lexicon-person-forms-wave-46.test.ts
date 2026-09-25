import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";

describe("sechsundvierzigste konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Bakteriolog:innen", "Bakteriologen"],
    ["Endokrinolog*innen", "Endokrinologen"],
    ["Entomolog_innen", "Entomologen"],
    ["Etymolog:innen", "Etymologen"],
    ["Gemmolog:innen", "Gemmologen"],
    ["Genealog:innen", "Genealogen"],
    ["Gerontolog:innen", "Gerontologen"],
    ["Kriminolog:innen", "Kriminologen"],
    ["Limnolog:innen", "Limnologen"],
    ["Ornitholog:innen", "Ornithologen"]
  ])("normalisiert den abgesicherten Personenstamm %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["bakteriolog", "genitive", "bakteriologen"],
    ["endokrinolog", "dative", "endokrinologen"],
    ["entomolog", "accusative", "entomologen"],
    ["etymolog", "genitive", "etymologen"],
    ["gemmolog", "dative", "gemmologen"],
    ["genealog", "accusative", "genealogen"],
    ["gerontolog", "genitive", "gerontologen"],
    ["kriminolog", "dative", "kriminologen"],
    ["limnolog", "accusative", "limnologen"],
    ["ornitholog", "genitive", "ornithologen"]
  ] as const)("bildet %s im Kasus %s korrekt ab", (base, grammaticalCase, expected) => {
    expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
  });

  it.each([
    ["Bakteriologe", "Bakteriologin", "Bakteriologe"],
    ["Endokrinologe", "Endokrinologin", "Endokrinologe"],
    ["Entomologe", "Entomologin", "Entomologe"],
    ["Etymologe", "Etymologin", "Etymologe"],
    ["Gemmologe", "Gemmologin", "Gemmologe"],
    ["Genealoge", "Genealogin", "Genealoge"],
    ["Gerontologe", "Gerontologin", "Gerontologe"],
    ["Kriminologe", "Kriminologin", "Kriminologe"],
    ["Limnologe", "Limnologin", "Limnologe"],
    ["Ornithologe", "Ornithologin", "Ornithologe"]
  ])("erkennt das abgesicherte Paar %s/%s", (masculine, feminine, expected) => {
    expect(mapMappedSingularPair(masculine, feminine)).toBe(expected);
  });
});
