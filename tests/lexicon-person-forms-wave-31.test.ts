import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import { mapMappedSingular } from "../src/rules/person-lexicon";

describe("einunddreißigste konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Malteser:innen", "Malteser"],
    ["Malteser*innen", "Malteser"],
    ["Malteser_innen", "Malteser"]
  ])("deckt den letzten sicheren Herkunftsfall ab: %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it("stellt den Genitiv bereit", () => {
    expect(mapMappedSingular("malteser", "genitive")).toBe("maltesers");
  });

  it.each(["Chilen:innen", "Myanmare:innen", "Israeli:innen"])(
    "erfindet keine nicht belastbare Separatorform: %s",
    (input) => {
      expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
        text: input,
        replacements: 0
      });
    }
  );
});
