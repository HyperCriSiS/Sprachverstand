import {describe, expect, it, vi} from "vitest";
import {mapMappedSingularPair, mapMappedInflectedSingularPair} from "../src/rules/person-lexicon";

describe("Einmalige Normalisierung bei lexikalischen Singularpaaren", () => {
  it("scannt bei unmöglichen femininen Endungen nicht das komplette Lexikon", () => {
    const suffix = vi.spyOn(String.prototype, "endsWith");
    try {
      expect(mapMappedSingularPair("Nutzer", "innenKonto42")).toBeUndefined();
      expect(mapMappedInflectedSingularPair("Nutzer", "innenKonto42", "genitive")).toBeUndefined();
      expect(suffix.mock.calls.length).toBeLessThanOrEqual(10);
    } finally {suffix.mockRestore();}
  });
  it("scannt auch bei der Pluralmarkersilbe innen nicht das Singularlexikon", () => {
    const suffix = vi.spyOn(String.prototype, "endsWith");
    try {
      expect(mapMappedSingularPair("Nutzer", "innen")).toBeUndefined();
      expect(suffix.mock.calls.length).toBeLessThanOrEqual(10);
    } finally {suffix.mockRestore();}
  });
  it.each(["nominative", "genitive", "dative", "accusative"] as const)
    ("normalisiert einen unbekannten langen Vergleich nur konstant oft: %s", grammaticalCase => {
      const normalize = vi.spyOn(String.prototype, "toLocaleLowerCase");
      try {
        expect(mapMappedInflectedSingularPair("Unbekannt".repeat(500), "AnderesWort", grammaticalCase)).toBeUndefined();
        expect(normalize.mock.calls.length).toBeLessThanOrEqual(6);
      } finally {normalize.mockRestore();}
    });
  it("normalisiert auch eine Markersilbe mit Kompositumsuffix nur einmal pro Orientierung", () => {
    const normalize = vi.spyOn(String.prototype, "toLocaleLowerCase");
    try {
      expect(mapMappedSingularPair("Nutzer", "innenKonto")).toBeUndefined();
      expect(normalize.mock.calls.length).toBeLessThanOrEqual(6);
    } finally {normalize.mockRestore();}
  });
  it("bewahrt Kasus, Großschreibung und gemeinsame Kompositumpräfixe", () => {
    expect(mapMappedSingularPair("NOTFALLARZT", "NOTFALLÄRZTIN")).toBe("NOTFALLARZT");
    expect(mapMappedSingularPair("Notfallarzt", "-Ärztin")).toBe("Notfallarzt");
    expect(mapMappedInflectedSingularPair("Notfallärztin", "Notfallarztes", "genitive")).toBe("Notfallarztes");
    expect(mapMappedInflectedSingularPair("Innenärztin", "Außenarzt", "nominative")).toBeUndefined();
  });
});
