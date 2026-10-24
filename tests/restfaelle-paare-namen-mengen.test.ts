import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Restfälle der Gegenprüfung vom 26.10.2026.
describe("Paarform, Namen, Mengenangaben, Infinitiv, Koordination", () => {
  it.each([
    ["Wir suchen eine/r Lehrer*in.", "Wir suchen einen Lehrer."],
    ["Wir suchen eine/r engagierte/r Lehrer*in.", "Wir suchen einen engagierten Lehrer."],
    ["Eine/r Lehrer*in kommt.", "Ein Lehrer kommt."],
    ["Peter wartet. Jede Lehrer*in kennt ihre Telefonnummer.", "Peter wartet. Jeder Lehrer kennt seine Telefonnummer."],
    ["Berlin ist groß. Jede Lehrer*in kennt ihre Telefonnummer.", "Berlin ist groß. Jeder Lehrer kennt seine Telefonnummer."],
    ["Anna wartet. Jede Lehrer*in kennt ihre Telefonnummer.", "Anna wartet. Jeder Lehrer kennt ihre Telefonnummer."],
    ["Wir reden mit teilweise bis zu 250 Mitarbeiter*innen.", "Wir reden mit teilweise bis zu 250 Mitarbeitern."],
    ["Die Demonstration zog mit rund 15.000 Teilnehmer*innen durch die Stadt.", "Die Demonstration zog mit rund 15.000 Teilnehmern durch die Stadt."],
    ["Bis zu 20 Bewerber*innen werden eingeladen.", "Bis zu 20 Bewerber werden eingeladen."],
    ["Von Anfänger*innen bis zu Olympiasieger*innen fördern wir alle.", "Von Anfängern bis zu Olympiasiegern fördern wir alle."],
    ["Seit 2011 laden Veranstalter*innen Kinder ein.", "Seit 2011 laden Veranstalter Kinder ein."],
    ["Wir helfen Lehrer:innen in Ruhe auszubilden.", "Wir helfen Lehrer in Ruhe auszubilden."],
    ["Wir helfen Lehrer:innen besonders gut und gründlich auszubilden.", "Wir helfen Lehrer besonders gut und gründlich auszubilden."],
    ["mit Kollegen aus Kantonen und erfahrenen Vertreter*innen", "mit Kollegen aus Kantonen und erfahrenen Vertretern"],
    ["zum Austausch mit Fachleuten und kommunalen Praktiker*innen", "zum Austausch mit Fachleuten und kommunalen Praktikern"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});
