import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";

describe("einundvierzigste konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Lateinamerikaner:innen", "Lateinamerikaner"],
    ["Lebensgefährt*innen", "Lebensgefährten"],
    ["Leutnant_innen", "Leutnants"],
    ["Metzger:innen", "Metzger"],
    ["Misanthrop:innen", "Misanthropen"],
    ["Nachkomm:innen", "Nachkommen"],
    ["Neuling:innen", "Neulinge"],
    ["Ordner:innen", "Ordner"],
    ["Ostasiat:innen", "Ostasiaten"],
    ["Pedant:innen", "Pedanten"],
    ["Philanthrop:innen", "Philanthropen"]
  ])("normalisiert die neue Personenform %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["lateinamerikaner", "genitive", "lateinamerikaners"],
    ["lebensgefährt", "nominative", "lebensgefährte"],
    ["lebensgefährt", "accusative", "lebensgefährten"],
    ["leutnant", "genitive", "leutnants"],
    ["metzger", "genitive", "metzgers"],
    ["misanthrop", "dative", "misanthropen"],
    ["nachkomm", "genitive", "nachkommen"],
    ["neuling", "genitive", "neulings"],
    ["ordner", "genitive", "ordners"],
    ["ostasiat", "accusative", "ostasiaten"],
    ["pedant", "dative", "pedanten"],
    ["philanthrop", "genitive", "philanthropen"]
  ] as const)("bildet %s im Kasus %s korrekt ab", (base, grammaticalCase, expected) => {
    expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
  });

  it.each([
    ["Lateinamerikaner", "Lateinamerikanerin", "Lateinamerikaner"],
    ["Lebensgefährte", "Lebensgefährtin", "Lebensgefährte"],
    ["Leutnant", "Leutnantin", "Leutnant"],
    ["Metzger", "Metzgerin", "Metzger"],
    ["Misanthrop", "Misanthropin", "Misanthrop"],
    ["Nachkomme", "Nachkommin", "Nachkomme"],
    ["Neuling", "Neulingin", "Neuling"],
    ["Ordner", "Ordnerin", "Ordner"],
    ["Ostasiat", "Ostasiatin", "Ostasiat"],
    ["Pedant", "Pedantin", "Pedant"],
    ["Philanthrop", "Philanthropin", "Philanthrop"]
  ])("erkennt das Paar %s/%s", (masculine, feminine, expected) => {
    expect(mapMappedSingularPair(masculine, feminine)).toBe(expected);
  });

  it.each([
    "Mamsell:innen",
    "Mentee:innen",
    "Mitglied:innen"
  ])("lässt nicht freigegebene oder geschlechtsneutrale Sonderfälle unverändert: %s", (input) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
