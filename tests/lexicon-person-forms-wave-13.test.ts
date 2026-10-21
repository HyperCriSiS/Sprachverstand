import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import { mapMappedSingular } from "../src/rules/person-lexicon";

describe("dreizehnte konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Hirt:innen", "Hirten"],
    ["Schafhirt:innen", "Schafhirten"],
    ["Schäfer:innen", "Schäfer"],
    ["Wanderschäfer:innen", "Wanderschäfer"],
    ["Mesner:innen", "Mesner"],
    ["Schwäger:innen", "Schwäger"],
    ["Schwippschwäger:innen", "Schwippschwäger"]
  ])("deckt eine eindeutig belegte Personenform ab: %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["hirt", "nominative", "hirte"],
    ["hirt", "accusative", "hirten"],
    ["hirt", "dative", "hirten"],
    ["hirt", "genitive", "hirten"],
    ["schäfer", "genitive", "schäfers"],
    ["mesner", "genitive", "mesners"],
    ["schwäger", "nominative", "schwager"],
    ["schwäger", "genitive", "schwagers"]
  ] as const)("stellt die passende Singularflexion bereit: %s/%s", (base, grammaticalCase, expected) => {
    expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
  });

  it.each(["General:innen", "Sticker:innen"])(
    "lässt mehrdeutige Kontrollfälle unverändert: %s",
    (input) => {
      expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
        text: input,
        replacements: 0
      });
    }
  );
});
