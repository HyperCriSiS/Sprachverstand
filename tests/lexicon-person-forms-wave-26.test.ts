import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import { mapMappedSingular } from "../src/rules/person-lexicon";

describe("sechsundzwanzigste konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Gabuner:innen", "Gabuner"],
    ["Gambier:innen", "Gambier"],
    ["Ghanaer:innen", "Ghanaer"],
    ["Grenader:innen", "Grenader"],
    ["Guineer:innen", "Guineer"],
    ["Guinea-Bissauer:innen", "Guinea-Bissauer"],
    ["Guyaner:innen", "Guyaner"],
    ["Haitianer:innen", "Haitianer"],
    ["Honduraner:innen", "Honduraner"],
    ["Jamaikaner:innen", "Jamaikaner"],
    ["Jordanier:innen", "Jordanier"],
    ["Kambodschaner:innen", "Kambodschaner"],
    ["Kameruner:innen", "Kameruner"],
    ["Katarer:innen", "Katarer"],
    ["Kenianer:innen", "Kenianer"],
    ["Kiribatier:innen", "Kiribatier"],
    ["Ghanaer*innen", "Ghanaer"],
    ["Guinea-Bissauer_innen", "Guinea-Bissauer"]
  ])("deckt eine amtlich bestimmte Personenform ab: %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["gabuner", "gabuners"],
    ["gambier", "gambiers"],
    ["ghanaer", "ghanaers"],
    ["grenader", "grenaders"],
    ["guineer", "guineers"],
    ["guinea-bissauer", "guinea-bissauers"],
    ["guyaner", "guyaners"],
    ["haitianer", "haitianers"],
    ["honduraner", "honduraners"],
    ["jamaikaner", "jamaikaners"],
    ["jordanier", "jordaniers"],
    ["kambodschaner", "kambodschaners"],
    ["kameruner", "kameruners"],
    ["katarer", "katarers"],
    ["kenianer", "kenianers"],
    ["kiribatier", "kiribatiers"]
  ] as const)("stellt den Genitiv bereit: %s", (base, expected) => {
    expect(mapMappedSingular(base, "genitive")).toBe(expected);
  });
});
