import { describe, expect, it } from "vitest";
import {
  knownPluralSeparatorsRule,
  mapKnownSingular
} from "../src/rules/known-plural-separators";

describe("vierte konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Raumausstatter:innen", "Raumausstatter"],
    ["Dachdecker:innen", "Dachdecker"],
    ["Schuhfertiger:innen", "Schuhfertiger"],
    ["Glasbläser:innen", "Glasbläser"],
    ["Industrie-Isolierer:innen", "Industrie-Isolierer"],
    ["Fahrzeuglackierer:innen", "Fahrzeuglackierer"],
    ["Estrichleger:innen", "Estrichleger"],
    ["Modenäher:innen", "Modenäher"]
  ])("deckt eine sichere aktuelle Personenfamilie ab: %s", (input, expected) => {
    expect(knownPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it("nutzt die neuen Familien auch im sicheren Singular- und Genitivpfad", () => {
    expect(mapKnownSingular("Raumausstatter", "genitive")).toBe("Raumausstatters");
    expect(mapKnownSingular("Dachdecker", "genitive")).toBe("Dachdeckers");
    expect(mapKnownSingular("Schuhfertiger", "genitive")).toBe("Schuhfertigers");
    expect(mapKnownSingular("Glasbläser", "genitive")).toBe("Glasbläsers");
    expect(mapKnownSingular("Industrie-Isolierer", "genitive")).toBe(
      "Industrie-Isolierers"
    );
    expect(mapKnownSingular("Fahrzeuglackierer", "genitive")).toBe(
      "Fahrzeuglackierers"
    );
    expect(mapKnownSingular("Estrichleger", "genitive")).toBe("Estrichlegers");
    expect(mapKnownSingular("Modenäher", "genitive")).toBe("Modenähers");
  });

  it.each([
    "Ausstattung:innen",
    "Dach:innen",
    "Fertigung:innen",
    "Glas:innen",
    "Isolation:innen",
    "Lack:innen",
    "Lage:innen",
    "Nähe:innen"
  ])("lässt ähnlich aussehende Nicht-Personenformen unverändert: %s", (input) => {
    expect(knownPluralSeparatorsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
