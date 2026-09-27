import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";

describe("vierundfünfzigste konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Akrobat:innen", "Akrobaten"],
    ["Aktienanalyst*innen", "Aktienanalysten"],
    ["Aktuar_innen", "Aktuare"],
    ["Altbierbrauer:innen", "Altbierbrauer"],
    ["Anatom:innen", "Anatomen"],
    ["Anästhesist:innen", "Anästhesisten"]
  ])("normalisiert den abgesicherten Personenstamm %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["akrobat", "genitive", "akrobaten"],
    ["aktienanalyst", "dative", "aktienanalysten"],
    ["aktuar", "genitive", "aktuars"],
    ["altbierbrauer", "genitive", "altbierbrauers"],
    ["anatom", "accusative", "anatomen"],
    ["anästhesist", "dative", "anästhesisten"]
  ] as const)("bildet %s im Kasus %s korrekt ab", (base, grammaticalCase, expected) => {
    expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
  });

  it.each([
    ["Akrobat", "Akrobatin", "Akrobat"],
    ["Aktienanalyst", "Aktienanalystin", "Aktienanalyst"],
    ["Aktuar", "Aktuarin", "Aktuar"],
    ["Altbierbrauer", "Altbierbrauerin", "Altbierbrauer"],
    ["Anatom", "Anatomin", "Anatom"],
    ["Anästhesist", "Anästhesistin", "Anästhesist"]
  ])("erkennt das abgesicherte Paar %s/%s", (masculine, feminine, expected) => {
    expect(mapMappedSingularPair(masculine, feminine)).toBe(expected);
  });
});
