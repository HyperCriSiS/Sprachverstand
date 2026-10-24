import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Unabhängige Gegenprüfung von Aion, 25.10.2026 (artifacts/gegenpruefung-20261025).
describe("Dativverb mit eigenem Subjekt (N24)", () => {
  it.each([
    ["Auch die Eltern helfen Lehrer:innen.", "Auch die Eltern helfen Lehrern."],
    ["In Berlin tätige Eltern helfen Lehrer:innen.", "In Berlin tätige Eltern helfen Lehrern."],
    ["Mit uns befreundete Eltern helfen Lehrer:innen.", "Mit uns befreundete Eltern helfen Lehrern."],
    ["Heute anwesende Eltern helfen Lehrer:innen.", "Heute anwesende Eltern helfen Lehrern."],
    ["Wir helfen Lehrer:innen der Schule.", "Wir helfen Lehrern der Schule."],
    ["Er hilft Lehrer:innen der Schule.", "Er hilft Lehrern der Schule."],
    ["Die Eltern helfen Lehrer:innen der Schule.", "Die Eltern helfen Lehrern der Schule."],
    ["Wir helfen Lehrer:innen und Schüler:innen der Schule.", "Wir helfen Lehrern und Schülern der Schule."],
    ["Wir folgen Lehrer:innen.", "Wir folgen Lehrern."],
    ["Er folgt Lehrer:innen.", "Er folgt Lehrern."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Plural als Subjekt nach dem Dativverb (N18)", () => {
  it.each([
    ["Morgen helfen Lehrer:innen freiwillig.", "Morgen helfen Lehrer freiwillig."],
    ["Danach helfen Lehrer:innen freiwillig.", "Danach helfen Lehrer freiwillig."],
    ["Anschließend helfen Lehrer:innen freiwillig.", "Anschließend helfen Lehrer freiwillig."],
    ["Vielleicht helfen Lehrer:innen freiwillig.", "Vielleicht helfen Lehrer freiwillig."],
    ["Wahrscheinlich helfen Lehrer:innen freiwillig.", "Wahrscheinlich helfen Lehrer freiwillig."],
    ["Den Kindern helfen Lehrer:innen.", "Den Kindern helfen Lehrer."],
    ["Jeden Tag helfen Lehrer:innen.", "Jeden Tag helfen Lehrer."],
    ["Kleinen Kindern helfen Lehrer:innen.", "Kleinen Kindern helfen Lehrer."],
    ["In der Schule helfen Lehrer:innen.", "In der Schule helfen Lehrer."],
    ["Es folgen Lehrer:innen.", "Es folgen Lehrer."],
    ["Danach folgen Lehrer:innen.", "Danach folgen Lehrer."],
    ["Hier folgen Lehrer*innen den Kindern.", "Hier folgen Lehrer den Kindern."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Plural als Objekt eines zu-Infinitivs (N18)", () => {
  it.each([
    ["Wir helfen Lehrer:innen gut auszubilden.", "Wir helfen Lehrer gut auszubilden."],
    ["Er hilft Lehrer:innen gut auszubilden.", "Er hilft Lehrer gut auszubilden."],
    ["Die Eltern helfen Lehrer:innen gut auszubilden.", "Die Eltern helfen Lehrer gut auszubilden."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});
