import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import { mapMappedSingular } from "../src/rules/person-lexicon";

describe("zweiunddreißigste konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Schott:innen", "Schotten"],
    ["Schott*innen", "Schotten"],
    ["Schott_innen", "Schotten"],
    ["Moldauer:innen", "Moldauer"]
  ])("deckt eine eindeutig rückführbare Personenform ab: %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it("bildet die schwache Flexion von Schotte korrekt ab", () => {
    expect(mapMappedSingular("schott", "nominative")).toBe("schotte");
    expect(mapMappedSingular("schott", "accusative")).toBe("schotten");
    expect(mapMappedSingular("schott", "dative")).toBe("schotten");
    expect(mapMappedSingular("schott", "genitive")).toBe("schotten");
  });

  it("behält Moldauer nach der Deduplizierung vollständig bei", () => {
    expect(mapMappedSingular("moldauer", "genitive")).toBe("moldauers");
  });
});
