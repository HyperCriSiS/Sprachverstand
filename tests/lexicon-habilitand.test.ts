import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import { mapMappedSingular } from "../src/rules/person-lexicon";

describe("schwache Flexion von Habilitand", () => {
  it("bildet den maskulinen Plural korrekt", () => {
    expect(mappedPluralSeparatorsRule.apply("Habilitand:innen")).toEqual({
      text: "Habilitanden",
      replacements: 1
    });
  });

  it.each([
    ["accusative", "habilitanden"],
    ["dative", "habilitanden"],
    ["genitive", "habilitanden"]
  ] as const)("bildet den schwachen Singular im %s", (grammaticalCase, expected) => {
    expect(mapMappedSingular("habilitand", grammaticalCase)).toBe(expected);
  });

  it("öffnet ähnlich aussehende Sachbegriffe nicht", () => {
    expect(mappedPluralSeparatorsRule.apply("Habilitation:innen")).toEqual({
      text: "Habilitation:innen",
      replacements: 0
    });
  });
});
