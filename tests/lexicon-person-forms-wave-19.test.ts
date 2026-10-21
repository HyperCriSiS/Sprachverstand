import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import { mapMappedSingular } from "../src/rules/person-lexicon";

describe("neunzehnte konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Belgier:innen", "Belgier"],
    ["Koreaner:innen", "Koreaner"],
    ["Nordkoreaner:innen", "Nordkoreaner"],
    ["Südkoreaner:innen", "Südkoreaner"],
    ["Pakistaner:innen", "Pakistaner"],
    ["Iraker:innen", "Iraker"],
    ["Araber:innen", "Araber"],
    ["Marokkaner:innen", "Marokkaner"],
    ["Algerier:innen", "Algerier"],
    ["Tunesier:innen", "Tunesier"],
    ["Belgier*innen", "Belgier"],
    ["Iraker_innen", "Iraker"]
  ])("deckt eine eindeutig belegte Personenform ab: %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["belgier", "nominative", "belgier"],
    ["belgier", "genitive", "belgiers"],
    ["koreaner", "genitive", "koreaners"],
    ["pakistaner", "genitive", "pakistaners"],
    ["iraker", "genitive", "irakers"],
    ["araber", "genitive", "arabers"],
    ["marokkaner", "genitive", "marokkaners"],
    ["algerier", "genitive", "algeriers"],
    ["tunesier", "genitive", "tunesiers"]
  ] as const)(
    "stellt die passende Singularflexion bereit: %s/%s",
    (base, grammaticalCase, expected) => {
      expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
    }
  );
});
