import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import { mapMappedSingular } from "../src/rules/person-lexicon";

describe("dreißigste konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Syrer:innen", "Syrer"],
    ["São-Toméer:innen", "São-Toméer"],
    ["Jemenit:innen", "Jemeniten"],
    ["Laot:innen", "Laoten"],
    ["Libanes:innen", "Libanesen"],
    ["Madagass:innen", "Madagassen"],
    ["Monegass:innen", "Monegassen"],
    ["San-Marines:innen", "San-Marinesen"],
    ["Senegales:innen", "Senegalesen"],
    ["Sudanes:innen", "Sudanesen"],
    ["Südsudanes:innen", "Südsudanesen"],
    ["Vietnames:innen", "Vietnamesen"],
    ["Guatemaltek:innen", "Guatemalteken"],
    ["Kongoles:innen", "Kongolesen"],
    ["Libanes*innen", "Libanesen"],
    ["Madagass_innen", "Madagassen"],
    ["Südsudanes*innen", "Südsudanesen"],
    ["São-Toméer_innen", "São-Toméer"]
  ])("deckt eine eindeutig bestimmte Personenform ab: %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["jemenit", "jemenit", "jemeniten"],
    ["laot", "laote", "laoten"],
    ["libanes", "libanese", "libanesen"],
    ["madagass", "madagasse", "madagassen"],
    ["monegass", "monegasse", "monegassen"],
    ["san-marines", "san-marinese", "san-marinesen"],
    ["senegales", "senegalese", "senegalesen"],
    ["sudanes", "sudanese", "sudanesen"],
    ["südsudanes", "südsudanese", "südsudanesen"],
    ["vietnames", "vietnamese", "vietnamesen"],
    ["guatemaltek", "guatemalteke", "guatemalteken"],
    ["kongoles", "kongolese", "kongolesen"]
  ] as const)(
    "bildet Nominativ und oblique Kasus korrekt: %s",
    (base, nominative, oblique) => {
      expect(mapMappedSingular(base, "nominative")).toBe(nominative);
      expect(mapMappedSingular(base, "accusative")).toBe(oblique);
      expect(mapMappedSingular(base, "dative")).toBe(oblique);
      expect(mapMappedSingular(base, "genitive")).toBe(oblique);
    }
  );

  it("stellt den Genitiv der regulären Sonderformen bereit", () => {
    expect(mapMappedSingular("syrer", "genitive")).toBe("syrers");
    expect(mapMappedSingular("são-toméer", "genitive")).toBe("são-toméers");
  });
});
