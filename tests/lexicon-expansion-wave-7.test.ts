import { describe, expect, it } from "vitest";
import {
  knownPluralSeparatorsRule,
  mapKnownSingular
} from "../src/rules/known-plural-separators";

describe("siebte konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Heizer:innen", "Heizer"],
    ["Kopierfräser:innen", "Kopierfräser"],
    ["Dentalhygieniker:innen", "Dentalhygieniker"],
    ["Werbetexter:innen", "Werbetexter"],
    ["Tapezierer:innen", "Tapezierer"],
    ["Vergolder:innen", "Vergolder"],
    ["Feinpolierer:innen", "Feinpolierer"],
    ["Butler:innen", "Butler"],
    ["Beleuchter:innen", "Beleuchter"],
    ["Kopfschlächter:innen", "Kopfschlächter"]
  ])("deckt eine bestätigte unveränderte Personenfamilie ab: %s", (input, expected) => {
    expect(knownPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it("bildet auch den Genitiv der neuen Familien regulär", () => {
    expect(mapKnownSingular("Heizer", "genitive")).toBe("Heizers");
    expect(mapKnownSingular("Kopierfräser", "genitive")).toBe("Kopierfräsers");
    expect(mapKnownSingular("Dentalhygieniker", "genitive")).toBe("Dentalhygienikers");
    expect(mapKnownSingular("Werbetexter", "genitive")).toBe("Werbetexters");
    expect(mapKnownSingular("Tapezierer", "genitive")).toBe("Tapezierers");
    expect(mapKnownSingular("Vergolder", "genitive")).toBe("Vergolders");
    expect(mapKnownSingular("Feinpolierer", "genitive")).toBe("Feinpolierers");
    expect(mapKnownSingular("Butler", "genitive")).toBe("Butlers");
    expect(mapKnownSingular("Beleuchter", "genitive")).toBe("Beleuchters");
    expect(mapKnownSingular("Kopfschlächter", "genitive")).toBe("Kopfschlächters");
  });

  it.each([
    "Heizung:innen",
    "Fräse:innen",
    "Hygiene:innen",
    "Text:innen",
    "Tapete:innen",
    "Vergoldung:innen",
    "Politur:innen",
    "Flasche:innen",
    "Beleuchtung:innen",
    "Schlachtung:innen",
    "Tapezier:innen",
    "Polier:innen"
  ])("lässt ähnliche Nicht-Personen oder abweichende Flexionsformen unverändert: %s", (input) => {
    expect(knownPluralSeparatorsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
