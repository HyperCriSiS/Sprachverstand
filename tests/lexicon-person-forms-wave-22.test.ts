import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import { mapMappedSingular } from "../src/rules/person-lexicon";

describe("zweiundzwanzigste konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Kosovar:innen", "Kosovaren"],
    ["Belaruss:innen", "Belarussen"],
    ["Mongol:innen", "Mongolen"],
    ["Tadschik:innen", "Tadschiken"],
    ["Usbek:innen", "Usbeken"],
    ["Kirgis:innen", "Kirgisen"],
    ["Turkmen:innen", "Turkmenen"],
    ["Nepales:innen", "Nepalesen"],
    ["Belaruss*innen", "Belarussen"],
    ["Usbek_innen", "Usbeken"]
  ])("deckt eine belegte Personenform ab: %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["kosovar", "nominative", "kosovare"],
    ["kosovar", "genitive", "kosovaren"],
    ["belaruss", "nominative", "belarusse"],
    ["belaruss", "genitive", "belarussen"],
    ["mongol", "nominative", "mongole"],
    ["mongol", "genitive", "mongolen"],
    ["tadschik", "nominative", "tadschike"],
    ["tadschik", "genitive", "tadschiken"],
    ["usbek", "nominative", "usbeke"],
    ["usbek", "genitive", "usbeken"],
    ["kirgis", "nominative", "kirgise"],
    ["kirgis", "genitive", "kirgisen"],
    ["turkmen", "nominative", "turkmene"],
    ["turkmen", "genitive", "turkmenen"],
    ["nepales", "nominative", "nepalese"],
    ["nepales", "genitive", "nepalesen"]
  ] as const)(
    "stellt die passende Singularflexion bereit: %s/%s",
    (base, grammaticalCase, expected) => {
      expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
    }
  );
});
