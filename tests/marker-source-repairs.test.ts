import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Webanalyse 21.10.2026 (SOURCE-01): Ausgangsfehler wurden halb oder falsch
// umgewandelt (`Schüler*in-nen` → „Schüler-nen“, `Praktikant*in*in` →
// „Praktikant*in“).
describe("Ausgangsfehler im Marker", () => {
  it.each([
    ["Schüler*in-nen", "Schüler"],
    ["Jugendarbeiter stehen den Schüler*in-nen zur Seite", "Jugendarbeiter stehen den Schülern zur Seite"],
    ["Lehrer:in-nen", "Lehrer"],
    ["Mitarbeiter*in-nen-Team", "Mitarbeiter-Team"],
    ["Stellenausschreibung Praktikant*in*in", "Stellenausschreibung Praktikant"],
    ["Kolleg*in*innen", "Kollegen"],
    ["Künstler*innen*innen", "Künstler"],
    // Mehrdeutiges Begleitwort: nur der Ausgangsfehler wird bereinigt.
    ["eine Praktikant*in*in", "eine Praktikant*in"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));

  it.each([
    // Unbekannte Stämme bleiben vollständig unverändert.
    ["Wagen*in-nen", "Wagen*in-nen"],
    ["Termin*in*in", "Termin*in*in"],
    ["Kinderwagen/in-nen", "Kinderwagen/in-nen"],
    // Normale Formen unverändert behandelt.
    ["Praktikant*in", "Praktikant"],
    ["Schüler*innen", "Schüler"]
  ])("bleibt bzw. wie bisher: %s", (input, expected) => expect(t(input)).toBe(expected));
});
