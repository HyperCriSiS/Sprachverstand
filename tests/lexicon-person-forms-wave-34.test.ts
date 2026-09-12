import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";

describe("vierunddreißigste konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Päpst*innen", "Päpste"],
    ["Päpst:innen", "Päpste"],
    ["Päpst_innen", "Päpste"]
  ])("normalisiert die unregelmäßige Personenform %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it("bildet die Singularfälle von Papst korrekt ab", () => {
    expect(mapMappedSingular("päpst", "nominative")).toBe("papst");
    expect(mapMappedSingular("päpst", "accusative")).toBe("papst");
    expect(mapMappedSingular("päpst", "dative")).toBe("papst");
    expect(mapMappedSingular("päpst", "genitive")).toBe("papstes");
  });

  it("führt die Paarform Papst/Päpstin korrekt zusammen", () => {
    expect(mapMappedSingularPair("Papst", "Päpstin")).toBe("Papst");
  });
});
