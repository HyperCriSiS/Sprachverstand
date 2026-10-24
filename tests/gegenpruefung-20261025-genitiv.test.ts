import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Gegenprüfung vom 25.10.2026.
describe("Koordinierter Genitiv am Satzanfang (N27)", () => {
  it.each([
    ["Das Foto eines Lehrers und einer Ärzt*in sehen wir hier.", "Das Foto eines Lehrers und eines Arztes sehen wir hier."],
    ["Die Bilder eines Lehrers und einer Ärzt*in hängen hier.", "Die Bilder eines Lehrers und eines Arztes hängen hier."],
    // Einzahlkopf mit Pluralverb: koordiniertes Subjekt, kein Genitiv.
    ["Der Name des Weines und der Pat:in werden genannt.", "Der Name des Weines und der Pate werden genannt."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});
