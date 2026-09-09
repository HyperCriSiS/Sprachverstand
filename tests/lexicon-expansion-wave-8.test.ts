import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import { mapMappedSingular } from "../src/rules/person-lexicon";

describe("achte konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Polier:innen", "Poliere"],
    ["Werkpolier:innen", "Werkpoliere"],
    ["Zimmererpolier:innen", "Zimmererpoliere"],
    ["Platzwart:innen", "Platzwarte"],
    ["Orchesterwart:innen", "Orchesterwarte"],
    ["Galvaniseur:innen", "Galvaniseure"],
    ["Kalkulator:innen", "Kalkulatoren"],
    ["Stuckateur:innen", "Stuckateure"],
    ["Dokumentar:innen", "Dokumentare"],
    ["Registrator:innen", "Registratoren"],
    ["Konservator:innen", "Konservatoren"],
    ["Requisiteur:innen", "Requisiteure"],
    ["Juwelier:innen", "Juweliere"],
    ["Kastellan:innen", "Kastellane"]
  ])("deckt einen eindeutigen gemappten Plural ab: %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it("stellt die regulären Singular- und Genitivformen bereit", () => {
    expect(mapMappedSingular("Werkpolier", "genitive")).toBe("Werkpoliers");
    expect(mapMappedSingular("Platzwart", "genitive")).toBe("Platzwarts");
    expect(mapMappedSingular("Orchesterwart", "dative")).toBe("Orchesterwart");
    expect(mapMappedSingular("Galvaniseur", "genitive")).toBe("Galvaniseurs");
    expect(mapMappedSingular("Kalkulator", "genitive")).toBe("Kalkulators");
    expect(mapMappedSingular("Stuckateur", "genitive")).toBe("Stuckateurs");
    expect(mapMappedSingular("Dokumentar", "genitive")).toBe("Dokumentars");
    expect(mapMappedSingular("Registrator", "genitive")).toBe("Registrators");
    expect(mapMappedSingular("Konservator", "genitive")).toBe("Konservators");
    expect(mapMappedSingular("Requisiteur", "genitive")).toBe("Requisiteurs");
    expect(mapMappedSingular("Juwelier", "genitive")).toBe("Juweliers");
    expect(mapMappedSingular("Kastellan", "genitive")).toBe("Kastellans");
  });

  it.each([
    "Polierer:innen",
    "Gegenwart:innen",
    "Kalkulation:innen",
    "Dokumentation:innen",
    "Registratur:innen",
    "Konservation:innen",
    "Juwel:innen",
    "Kastell:innen"
  ])("lässt abweichende oder nicht-personale Formen unverändert: %s", (input) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
