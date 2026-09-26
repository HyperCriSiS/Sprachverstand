import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";

describe("achtundvierzigste konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Dermatolog:innen", "Dermatologen"],
    ["Epidemiolog*innen", "Epidemiologen"],
    ["Ethnolog_innen", "Ethnologen"],
    ["Gynäkolog:innen", "Gynäkologen"],
    ["Hydrolog:innen", "Hydrologen"],
    ["Mineralog:innen", "Mineralogen"],
    ["Mykolog:innen", "Mykologen"],
    ["Nephrolog:innen", "Nephrologen"],
    ["Klimatolog:innen", "Klimatologen"],
    ["Histolog:innen", "Histologen"]
  ])("normalisiert den abgesicherten Personenstamm %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["dermatolog", "genitive", "dermatologen"],
    ["epidemiolog", "dative", "epidemiologen"],
    ["ethnolog", "accusative", "ethnologen"],
    ["gynäkolog", "genitive", "gynäkologen"],
    ["hydrolog", "dative", "hydrologen"],
    ["mineralog", "accusative", "mineralogen"],
    ["mykolog", "genitive", "mykologen"],
    ["nephrolog", "dative", "nephrologen"],
    ["klimatolog", "accusative", "klimatologen"],
    ["histolog", "genitive", "histologen"]
  ] as const)("bildet %s im Kasus %s korrekt ab", (base, grammaticalCase, expected) => {
    expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
  });

  it.each([
    ["Dermatologe", "Dermatologin", "Dermatologe"],
    ["Epidemiologe", "Epidemiologin", "Epidemiologe"],
    ["Ethnologe", "Ethnologin", "Ethnologe"],
    ["Gynäkologe", "Gynäkologin", "Gynäkologe"],
    ["Hydrologe", "Hydrologin", "Hydrologe"],
    ["Mineraloge", "Mineralogin", "Mineraloge"],
    ["Mykologe", "Mykologin", "Mykologe"],
    ["Nephrologe", "Nephrologin", "Nephrologe"],
    ["Klimatologe", "Klimatologin", "Klimatologe"],
    ["Histologe", "Histologin", "Histologe"]
  ])("erkennt das abgesicherte Paar %s/%s", (masculine, feminine, expected) => {
    expect(mapMappedSingularPair(masculine, feminine)).toBe(expected);
  });
});
