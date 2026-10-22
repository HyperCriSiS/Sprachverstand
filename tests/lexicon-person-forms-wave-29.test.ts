import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import { mapMappedSingular } from "../src/rules/person-lexicon";

describe("neunundzwanzigste konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Spanier:innen", "Spanier"],
    ["Sri-Lanker:innen", "Sri-Lanker"],
    ["Lucianer:innen", "Lucianer"],
    ["Vincenter:innen", "Vincenter"],
    ["Südafrikaner:innen", "Südafrikaner"],
    ["Surinamer:innen", "Surinamer"],
    ["Syrier:innen", "Syrier"],
    ["Tansanier:innen", "Tansanier"],
    ["Togoer:innen", "Togoer"],
    ["Tongaer:innen", "Tongaer"],
    ["Tschader:innen", "Tschader"],
    ["Tuvaluer:innen", "Tuvaluer"],
    ["Ugander:innen", "Ugander"],
    ["Ukrainer:innen", "Ukrainer"],
    ["Uruguayer:innen", "Uruguayer"],
    ["Vanuatuer:innen", "Vanuatuer"],
    ["Venezolaner:innen", "Venezolaner"],
    ["Zentralafrikaner:innen", "Zentralafrikaner"],
    ["Zyprer:innen", "Zyprer"],
    ["Schweizer:innen", "Schweizer"],
    ["Sri-Lanker*innen", "Sri-Lanker"],
    ["Zentralafrikaner_innen", "Zentralafrikaner"]
  ])("deckt eine amtlich bestimmte Personenform ab: %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["spanier", "spaniers"],
    ["sri-lanker", "sri-lankers"],
    ["lucianer", "lucianers"],
    ["vincenter", "vincenters"],
    ["südafrikaner", "südafrikaners"],
    ["surinamer", "surinamers"],
    ["syrier", "syriers"],
    ["tansanier", "tansaniers"],
    ["togoer", "togoers"],
    ["tongaer", "tongaers"],
    ["tschader", "tschaders"],
    ["tuvaluer", "tuvaluers"],
    ["ugander", "uganders"],
    ["ukrainer", "ukrainers"],
    ["uruguayer", "uruguayers"],
    ["vanuatuer", "vanuatuers"],
    ["venezolaner", "venezolaners"],
    ["zentralafrikaner", "zentralafrikaners"],
    ["zyprer", "zyprers"],
    ["schweizer", "schweizers"]
  ] as const)("stellt den Genitiv bereit: %s", (base, expected) => {
    expect(mapMappedSingular(base, "genitive")).toBe(expected);
  });
});
