import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Unabhängige Gegenprüfung von Codex, 24.10.2026 (artifacts/gegenpruefung-20261024).
describe("Possessiv nur ohne anderen möglichen Besitzer (N16)", () => {
  it.each([
    ["Die Schulleiterin heißt Anna. Jede Lehrer*in kennt ihre Telefonnummer, also Annas Nummer.",
      "Die Schulleiterin heißt Anna. Jeder Lehrer kennt ihre Telefonnummer, also Annas Nummer."],
    ["Maria bittet darum, dass jede Lehrer*in ihrer Tochter hilft.", "Maria bittet darum, dass jeder Lehrer ihrer Tochter hilft."],
    ["Die Eltern wünschen, dass jede Lehrer*in ihre Kinder unterstützt.",
      "Die Eltern wünschen, dass jeder Lehrer ihre Kinder unterstützt."],
    // Ohne anderen Besitzer weiterhin angeglichen (N12).
    ["sorgen wir dafür, dass jede Kund*in auch in ihrer „Sprache“ Gehör finden kann.",
      "sorgen wir dafür, dass jeder Kunde auch in seiner „Sprache“ Gehör finden kann."],
    ["Jede Lehrer*in kennt ihre Klasse.", "Jeder Lehrer kennt seine Klasse."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Genitiv-Koordination nur ohne andere Lesart (N17)", () => {
  it.each([
    ["Ich fotografiere das Haus eines Lehrers und der Ärzt*in überreiche ich Blumen.", "des Arztes"],
    ["Wir helfen dem Sohn eines Lehrers und einer Ärzt*in.", "eines Arztes"],
    ["Das Foto eines Lehrers mit Hut und einer Ärzt*in hängt hier.", "eines Arztes"],
    ["Name des Weines und der Pat:in werden bekanntgegeben.", "des Paten"]
  ])("kein Genitiv: %s", (input, wrong) => expect(t(input)).not.toContain(wrong));

  it.each([
    ["Das Bild eines Lehrers und einer Ärzt*in hängt hier.", "Das Bild eines Lehrers und eines Arztes hängt hier."],
    ["die Rolle einer Wähler*in der Grünen oder einer Politiker*in der AfD",
      "die Rolle eines Wählers der Grünen oder eines Politikers der AfD"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Konjunktiv nach Subjektpronomen (N22)", () => {
  it.each([
    ["Ich hoffe, dass er die Ärzt*in möge.", "Ich hoffe, dass er den Arzt möge."],
    ["Ich hoffe, dass er die Ärzt*in würde unterstützen.", "Ich hoffe, dass er den Arzt würde unterstützen."],
    ["Ich weiß, dass er die Lehrer*in sollte anrufen.", "Ich weiß, dass er den Lehrer sollte anrufen."],
    // Ohne eigenes Subjekt bleibt die Phrase Subjekt.
    ["Wir wissen, eine Ärzt*in sollte zu helfen beginnen.", "Wir wissen, ein Arzt sollte zu helfen beginnen."],
    ["Wir hoffen, eine Ärzt*in werde eingeladen.", "Wir hoffen, ein Arzt werde eingeladen."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});
