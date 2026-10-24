import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Gegenprüfung vom 25.10.2026.
describe("Possessiv nach „jede …*in“: kein anderer Besitzer (N28)", () => {
  it.each([
    ["Es regnet. Jede Lehrer*in kennt ihre Telefonnummer.", "Es regnet. Jeder Lehrer kennt seine Telefonnummer."],
    ["Die Lehrerin wartet. Jede Lehrer*in kennt ihre eigene Telefonnummer.",
      "Die Lehrerin wartet. Jeder Lehrer kennt seine eigene Telefonnummer."],
    ["Sie kommen. Jede Lehrer*in kennt ihre eigene Telefonnummer.", "Sie kommen. Jeder Lehrer kennt seine eigene Telefonnummer."],
    ["Indem wir Methoden einsetzen, sorgen wir dafür, dass jede Kund*in auch in ihrer Sprache Gehör findet.",
      "Indem wir Methoden einsetzen, sorgen wir dafür, dass jeder Kunde auch in seiner Sprache Gehör findet."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Possessiv nach „jede …*in“: anderer möglicher Besitzer (N16)", () => {
  it.each([
    ["Die Tante wartet. Jede Lehrer*in kennt ihre Telefonnummer.", "Die Tante wartet. Jeder Lehrer kennt ihre Telefonnummer."],
    ["Anna kam gestern. Jede Lehrer*in kennt ihre Telefonnummer.", "Anna kam gestern. Jeder Lehrer kennt ihre Telefonnummer."],
    ["Die Schule ist neu. Jede Lehrer*in kennt ihre Adresse.", "Die Schule ist neu. Jeder Lehrer kennt ihre Adresse."],
    ["Die Ärztin wartet. Jede Lehrer*in kennt ihre Telefonnummer.", "Die Ärztin wartet. Jeder Lehrer kennt ihre Telefonnummer."],
    ["Die Direktorin wartet. Jede Lehrer*in kennt ihre Telefonnummer.", "Die Direktorin wartet. Jeder Lehrer kennt ihre Telefonnummer."],
    ["Anna ist hier. Es regnet. Jede Lehrer*in kennt ihre Telefonnummer.",
      "Anna ist hier. Es regnet. Jeder Lehrer kennt ihre Telefonnummer."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});
