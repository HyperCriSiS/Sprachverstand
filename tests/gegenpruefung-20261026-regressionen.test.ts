import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Gegenprüfung vom 26.10.2026.
describe("Präpositionalgruppe mit Adverb vor dem Dativverb (N29)", () => {
  it.each([
    ["Für fast alle Kinder helfen Lehrer:innen freiwillig.", "Für fast alle Kinder helfen Lehrer freiwillig."],
    ["In genau drei Schulen helfen Lehrer:innen freiwillig.", "In genau drei Schulen helfen Lehrer freiwillig."],
    ["In mehr als drei Schulen folgen Lehrer:innen freiwillig.", "In mehr als drei Schulen folgen Lehrer freiwillig."],
    ["Mit uns befreundete Eltern helfen Lehrer:innen.", "Mit uns befreundete Eltern helfen Lehrern."],
    ["In Berlin tätige Eltern helfen Lehrer:innen.", "In Berlin tätige Eltern helfen Lehrern."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Kein Besitzer bei Wörtern auf -in ohne Person (N30)", () => {
  it.each([
    ["Das Insulin wirkt. Jede Lehrer*in kennt ihre Telefonnummer.", "Das Insulin wirkt. Jeder Lehrer kennt seine Telefonnummer."],
    ["Das Protein wirkt. Jede Lehrer*in kennt ihre Telefonnummer.", "Das Protein wirkt. Jeder Lehrer kennt seine Telefonnummer."],
    ["Das Bein schmerzt. Jede Lehrer*in kennt ihre Telefonnummer.", "Das Bein schmerzt. Jeder Lehrer kennt seine Telefonnummer."],
    ["Die Ärztin wartet. Jede Lehrer*in kennt ihre Telefonnummer.", "Die Ärztin wartet. Jeder Lehrer kennt ihre Telefonnummer."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Dativ nach „neben“ (N31)", () => {
  it.each([
    ["An den Verhandlungen nehmen neben VertreterInnen auch LehrerInnen teil.", "An den Verhandlungen nehmen neben Vertretern auch Lehrer teil."],
    ["An den Gesprächen nehmen neben Lehrer:innen auch Schüler:innen teil.", "An den Gesprächen nehmen neben Lehrern auch Schüler teil."],
    ["Neben Vertreter*innen des AStA ist auch die Rektorin da.", "Neben Vertretern des AStA ist auch die Rektorin da."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Femininer Singular ist kein Pluralkopf (N33)", () => {
  it.each([
    ["Die Galerie eines Lehrers und der Ärzt*in werden genannt.", "Die Galerie eines Lehrers und der Arzt werden genannt."],
    ["Die Schwester eines Lehrers und der Ärzt*in werden genannt.", "Die Schwester eines Lehrers und der Arzt werden genannt."],
    ["Die Bilder eines Lehrers und einer Ärzt*in hängen hier.", "Die Bilder eines Lehrers und eines Arztes hängen hier."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});
