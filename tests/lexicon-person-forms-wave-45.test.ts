import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";

describe("fünfundvierzigste konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Orthopäd:innen", "Orthopäden"],
    ["Podolog*innen", "Podologen"],
    ["Urolog_innen", "Urologen"],
    ["Kardiolog:innen", "Kardiologen"],
    ["Neurolog:innen", "Neurologen"],
    ["Hämatolog:innen", "Hämatologen"],
    ["Gastroenterolog:innen", "Gastroenterologen"],
    ["Immunolog:innen", "Immunologen"],
    ["Physiolog:innen", "Physiologen"],
    ["Pharmakolog:innen", "Pharmakologen"]
  ])("normalisiert den abgesicherten Personenstamm %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["orthopäd", "nominative", "orthopäde"],
    ["orthopäd", "genitive", "orthopäden"],
    ["podolog", "dative", "podologen"],
    ["urolog", "accusative", "urologen"],
    ["kardiolog", "genitive", "kardiologen"],
    ["neurolog", "dative", "neurologen"],
    ["hämatolog", "genitive", "hämatologen"],
    ["gastroenterolog", "accusative", "gastroenterologen"],
    ["immunolog", "dative", "immunologen"],
    ["physiolog", "genitive", "physiologen"],
    ["pharmakolog", "accusative", "pharmakologen"]
  ] as const)("bildet %s im Kasus %s korrekt ab", (base, grammaticalCase, expected) => {
    expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
  });

  it.each([
    ["Orthopäde", "Orthopädin", "Orthopäde"],
    ["Podologe", "Podologin", "Podologe"],
    ["Urologe", "Urologin", "Urologe"],
    ["Kardiologe", "Kardiologin", "Kardiologe"],
    ["Neurologe", "Neurologin", "Neurologe"],
    ["Hämatologe", "Hämatologin", "Hämatologe"],
    ["Gastroenterologe", "Gastroenterologin", "Gastroenterologe"],
    ["Immunologe", "Immunologin", "Immunologe"],
    ["Physiologe", "Physiologin", "Physiologe"],
    ["Pharmakologe", "Pharmakologin", "Pharmakologe"]
  ])("erkennt das abgesicherte Paar %s/%s", (masculine, feminine, expected) => {
    expect(mapMappedSingularPair(masculine, feminine)).toBe(expected);
  });
});
