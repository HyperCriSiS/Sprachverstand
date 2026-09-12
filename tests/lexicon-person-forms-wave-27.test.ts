import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import { mapMappedSingular } from "../src/rules/person-lexicon";

describe("siebenundzwanzigste konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Isländer:innen", "Isländer"],
    ["Italiener:innen", "Italiener"],
    ["Japaner:innen", "Japaner"],
    ["Kanadier:innen", "Kanadier"],
    ["Kolumbianer:innen", "Kolumbianer"],
    ["Komorer:innen", "Komorer"],
    ["Kubaner:innen", "Kubaner"],
    ["Kuwaiter:innen", "Kuwaiter"],
    ["Lesother:innen", "Lesother"],
    ["Liberianer:innen", "Liberianer"],
    ["Libyer:innen", "Libyer"],
    ["Liechtensteiner:innen", "Liechtensteiner"],
    ["Malawier:innen", "Malawier"],
    ["Malaysier:innen", "Malaysier"],
    ["Malediver:innen", "Malediver"],
    ["Malier:innen", "Malier"],
    ["Isländer*innen", "Isländer"],
    ["Liechtensteiner_innen", "Liechtensteiner"]
  ])("deckt eine amtlich bestimmte Personenform ab: %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["isländer", "isländers"],
    ["italiener", "italieners"],
    ["japaner", "japaners"],
    ["kanadier", "kanadiers"],
    ["kolumbianer", "kolumbianers"],
    ["komorer", "komorers"],
    ["kubaner", "kubaners"],
    ["kuwaiter", "kuwaiters"],
    ["lesother", "lesothers"],
    ["liberianer", "liberianers"],
    ["libyer", "libyers"],
    ["liechtensteiner", "liechtensteiners"],
    ["malawier", "malawiers"],
    ["malaysier", "malaysiers"],
    ["malediver", "maledivers"],
    ["malier", "maliers"]
  ] as const)("stellt den Genitiv bereit: %s", (base, expected) => {
    expect(mapMappedSingular(base, "genitive")).toBe(expected);
  });
});
