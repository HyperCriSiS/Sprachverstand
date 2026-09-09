import { describe, expect, it } from "vitest";
import {
  knownPluralSeparatorsRule,
  mapKnownSingular
} from "../src/rules/known-plural-separators";

describe("dritte konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Metallbildner:innen", "Metallbildner"],
    ["Gelbgießer:innen", "Gelbgießer"],
    ["Gebäudereiniger:innen", "Gebäudereiniger"],
    ["Edelsteinschleifer:innen", "Edelsteinschleifer"],
    ["Modeschneider:innen", "Modeschneider"],
    ["Straßenwärter:innen", "Straßenwärter"],
    ["Kabeljungwerker:innen", "Kabeljungwerker"],
    ["Bauzeichner:innen", "Bauzeichner"]
  ])("deckt eine sichere unveränderte Personenfamilie ab: %s", (input, expected) => {
    expect(knownPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it("nutzt die neuen Familien auch im sicheren Singular- und Genitivpfad", () => {
    expect(mapKnownSingular("Maskenbildner", "genitive")).toBe("Maskenbildners");
    expect(mapKnownSingular("Gelbgießer", "genitive")).toBe("Gelbgießers");
    expect(mapKnownSingular("Gebäudereiniger", "genitive")).toBe(
      "Gebäudereinigers"
    );
    expect(mapKnownSingular("Edelsteinschleifer", "dative")).toBe(
      "Edelsteinschleifer"
    );
    expect(mapKnownSingular("Modeschneider", "genitive")).toBe("Modeschneiders");
    expect(mapKnownSingular("Straßenwärter", "genitive")).toBe("Straßenwärters");
    expect(mapKnownSingular("Kabeljungwerker", "genitive")).toBe(
      "Kabeljungwerkers"
    );
    expect(mapKnownSingular("Bauzeichner", "genitive")).toBe("Bauzeichners");
  });

  it.each([
    "Bild:innen",
    "Guss:innen",
    "Reinigung:innen",
    "Schliff:innen",
    "Schnitt:innen",
    "Wartung:innen",
    "Werk:innen",
    "Zeichen:innen"
  ])("lässt ähnlich aussehende Nicht-Personenformen unverändert: %s", (input) => {
    expect(knownPluralSeparatorsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
