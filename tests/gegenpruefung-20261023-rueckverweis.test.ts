import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Unabhängige Gegenprüfung von Codex, 23.10.2026 (artifacts/gegenpruefung-20261023).
describe("Possessiv nach generischem „jede X*in“ (N12)", () => {
  it.each([
    ["sorgen wir dafür, dass jede Kund*in auch in ihrer „Sprache“ Gehör finden kann.",
      "sorgen wir dafür, dass jeder Kunde auch in seiner „Sprache“ Gehör finden kann."],
    ["erprobt, in denen jede Teilnehmer*in ihren Ort, ihre Rolle findet: agierend",
      "erprobt, in denen jeder Teilnehmer seinen Ort, seine Rolle findet: agierend"],
    ["Jede Lehrer*in kennt ihre Klasse.", "Jeder Lehrer kennt seine Klasse."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));

  it.each([
    // Ein anderer möglicher Besitzer im Teilsatz.
    "Die Firmen beraten jede Kund*in in ihren Filialen.",
    "Wenn sie jede Kund*in in ihrer Sprache beraten.",
    // Ohne Umwandlung des Bezugsworts bleibt auch das Possessiv.
    "Jede Kund*in und ihre Familie"
  ])("bleibt: %s", (input) => expect(t(input)).toBe(input));
});
