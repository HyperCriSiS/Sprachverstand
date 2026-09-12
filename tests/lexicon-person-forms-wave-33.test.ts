import { describe, expect, it } from "vitest";
import {
  knownPluralSeparatorsRule,
  mapKnownSingular
} from "../src/rules/known-plural-separators";

describe("dreiunddreißigste konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Sticker:innen", "Sticker"],
    ["Sticker*innen", "Sticker"],
    ["Sticker_innen", "Sticker"]
  ])("normalisiert die eindeutig rückführbare Berufsform %s", (input, expected) => {
    expect(knownPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it("bildet den Genitiv des Berufs Sticker korrekt ab", () => {
    expect(mapKnownSingular("sticker", "genitive")).toBe("stickers");
    expect(mapKnownSingular("sticker", "accusative")).toBe("sticker");
  });
});
