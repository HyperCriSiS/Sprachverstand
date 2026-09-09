import { describe, expect, it } from "vitest";
import {
  knownPluralSeparatorsRule,
  mapKnownSingular
} from "../src/rules/known-plural-separators";

describe("fünfte konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Revolverdreher:innen", "Revolverdreher"],
    ["Hoteldiener:innen", "Hoteldiener"],
    ["Schriftsetzer:innen", "Schriftsetzer"],
    ["Kupferstecher:innen", "Kupferstecher"],
    ["Metallformer:innen", "Metallformer"],
    ["Glasveredler:innen", "Glasveredler"],
    ["Feintäschner:innen", "Feintäschner"],
    ["Weinküfer:innen", "Weinküfer"]
  ])("deckt eine weitere unveränderte Personenfamilie ab: %s", (input, expected) => {
    expect(knownPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it("nutzt die neuen Familien auch im Singular- und Genitivpfad", () => {
    expect(mapKnownSingular("Revolverdreher", "genitive")).toBe("Revolverdrehers");
    expect(mapKnownSingular("Hoteldiener", "genitive")).toBe("Hoteldieners");
    expect(mapKnownSingular("Schriftsetzer", "genitive")).toBe("Schriftsetzers");
    expect(mapKnownSingular("Kupferstecher", "genitive")).toBe("Kupferstechers");
    expect(mapKnownSingular("Metallformer", "genitive")).toBe("Metallformers");
    expect(mapKnownSingular("Glasveredler", "genitive")).toBe("Glasveredlers");
    expect(mapKnownSingular("Feintäschner", "dative")).toBe("Feintäschner");
    expect(mapKnownSingular("Weinküfer", "genitive")).toBe("Weinküfers");
  });

  it.each([
    "Drehung:innen",
    "Dienst:innen",
    "Satz:innen",
    "Stich:innen",
    "Form:innen",
    "Veredelung:innen",
    "Tasche:innen",
    "Kufe:innen"
  ])("lässt ähnlich aussehende Nicht-Personenformen unverändert: %s", (input) => {
    expect(knownPluralSeparatorsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
