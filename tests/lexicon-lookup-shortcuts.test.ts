import { describe, expect, it } from "vitest";
import { mapKnownPlural } from "../src/rules/known-plural-separators";
import { mapMappedPlural } from "../src/rules/mapped-plural-separators";
import { firstCodePointLength, preserveInnerCase } from "../src/rules/inner-case";

// Vierte Thunderbird-Leistungsrunde (04.11.2026): Endungssuche je Länge,
// Schreibungshelfer ohne Spread. Die Ergebnisse bleiben unverändert.
describe("bekannte Pluralendungen nach Länge", () => {
  it.each(["lehrer", "Lehrer", "LEHRER", "Grundschullehrer", "Abfüller", "KÜRSCHNER", "Bildhauer"])(
    "%s bleibt bekannt", (base) => expect(mapKnownPlural(base)).toBe(base));

  it.each(["", "er", "Lehre", "Lehrerin", "Ärzt", "Student", "hre"])(
    "%s bleibt unbekannt", (base) => expect(mapKnownPlural(base)).toBeUndefined());
});

describe("Schreibung ohne Zerlegen in Codepunkte", () => {
  it("misst den ersten Codepunkt wie der Spread", () => {
    for (const value of ["Lehrer", "😀Lehrer", "\uD800Lehrer", "\uDC00Lehrer", "😀", ""]) {
      expect(value.slice(0, firstCodePointLength(value))).toBe([...value][0] ?? "");
    }
  });

  it.each([
    ["Nutzer", "nutzer"],
    ["NUTZER", "nutzer"],
    ["N", "n"],
    ["😀", "x"],
    ["😀Nutzer", "nutzer"],
    ["Nutzer😀", "nutzer"],
    ["\uD800Nutzer", "nutzer"]
  ])("%s ohne Binnenmajuskel bleibt bei den Aufrufern", (source, replacement) =>
    expect(preserveInnerCase(source, replacement)).toBeUndefined());

  it("behält Binnenmajuskeln wie bisher", () => {
    expect(preserveInnerCase("TikToker", "tiktoker")).toBe("TikToker");
    expect(preserveInnerCase("😀TikToker", "😀tiktoker")).toBe("😀TikToker");
  });

  it.each([
    ["Kolleg", "Kollegen"],
    ["KOLLEG", "KOLLEGEN"],
    ["kolleg", "kollegen"],
    ["😀Kolleg", "😀Kollegen"],
    ["Ärzt", "Ärzte"],
    ["US-Amerikaner", "US-Amerikaner"]
  ])("%s wird zu %s", (base, plural) => expect(mapMappedPlural(base)).toBe(plural));
});
