import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Webanalyse 21.10.2026, Restfehler: falscher Artikel nach `zwischen`,
// Marker im ersten Teil eines Bindestrich-Adjektivs und Genitiv-der nach
// markiertem substantiviertem Adjektiv.
describe("Restfehler der Webanalyse", () => {
  it.each([
    ["Kommunikation zwischen der Spender:in und Empfänger:in", "Kommunikation zwischen dem Spender und Empfänger"],
    ["zwischen der Patient*in und der Ärzt*in", "zwischen dem Patienten und dem Arzt"],
    ["mit der Lehrer*in oder Erzieher*in", "mit dem Lehrer oder Erzieher"],
    ["neben der Kolleg:in", "neben dem Kollegen"],
    ["vor der Lehrer*in", "vor dem Lehrer"],
    ["Medizinisch:e-Technische:r Assistent:in", "Medizinisch-Technischer Assistent"],
    ["Medizinisch*e-Technische*r Assistent*in", "Medizinisch-Technischer Assistent"],
    ["Inklusionsbeauftragte*r der Arbeitgeber*in", "Inklusionsbeauftragter des Arbeitgebers"],
    // Binnen-I wie Trennzeichenformen (vorher „Das Projekt der Künstler“).
    ["Das Projekt der KünstlerIn.", "Das Projekt des Künstlers."],
    ["Die Aufgaben der KollegIn", "Die Aufgaben des Kollegen"],
    ["Die Rolle der neuen LeiterIn", "Die Rolle des neuen Leiters"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));

  it.each([
    "zwischen die Kolleg:in",
    // Ohne Kennzeichen ist eine Frau gemeint.
    "Das Projekt der Künstlerin.",
    "die Künstler:in oder Kurator:in"
  ])("lässt %s unverändert", (input) => expect(t(input)).toBe(input));
});
