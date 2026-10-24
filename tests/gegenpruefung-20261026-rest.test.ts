import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Gegenprüfung vom 26.10.2026.
describe("Subjekt vor folgen/helfen: Koordination, Pronomengruppe, Adverb (N24, N18)", () => {
  it.each([
    ["Peter und Anna folgen Lehrer:innen.", "Peter und Anna folgen Lehrern."],
    ["Wir alle folgen Lehrer:innen.", "Wir alle folgen Lehrern."],
    ["Die einen folgen Lehrer:innen.", "Die einen folgen Lehrern."],
    ["Manchmal helfen Lehrer:innen den Eltern.", "Manchmal helfen Lehrer den Eltern."],
    ["Selten folgen Lehrer:innen den Eltern.", "Selten folgen Lehrer den Eltern."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Dativ nach „zwischen“ (N20)", () => {
  it.each([
    ["Zwischen Lehrer:innen und Schüler:innen herrscht Vertrauen.", "Zwischen Lehrern und Schülern herrscht Vertrauen."],
    ["die Zusammenarbeit zwischen Ärzt*innen und Pflegepersonal", "die Zusammenarbeit zwischen Ärzten und Pflegepersonal"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Fokuspartikel vor Satzanfangskopf, Besitzer drei Sätze zurück (N27, N16)", () => {
  it.each([
    ["Auch das Foto eines Lehrers und einer Ärzt*in sehen wir hier.", "Auch das Foto eines Lehrers und eines Arztes sehen wir hier."],
    ["Anna wartet. Es regnet. Es schneit. Jede Lehrer*in kennt ihre Telefonnummer.",
      "Anna wartet. Es regnet. Es schneit. Jeder Lehrer kennt ihre Telefonnummer."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});
