import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Restfälle der Gegenprüfung vom 26.10.2026.
describe("Satzbau-Restfälle", () => {
  it.each([
    // Neuer Satz nach Doppelpunkt
    ["Heute gilt: jede Lehrer*in hilft.", "Heute gilt: jeder Lehrer hilft."],
    ["Das Problem dabei: Ihre lokale Stromanbieter:in sieht das.", "Das Problem dabei: Ihr lokaler Stromanbieter sieht das."],
    // „jeder“ nach Subjektpronomen und Verb ist Dativ (N16)
    ["Sie sagt jeder Lehrer*in ihre Meinung.", "Sie sagt jedem Lehrer ihre Meinung."],
    ["Sie sagt jeder Lehrer*in, dass sie warten soll.", "Sie sagt jedem Lehrer, dass sie warten soll."],
    // Vorangestellter Dativ im neuen Teilsatz, Koordination mit Dativ (N17)
    ["Ich fotografiere das Haus eines Lehrers und der Ärzt*in überreiche ich Blumen.",
      "Ich fotografiere das Haus eines Lehrers und dem Arzt überreiche ich Blumen."],
    ["Ein Buch dem Lehrer und der Ärzt*in überreiche ich.", "Ein Buch dem Lehrer und dem Arzt überreiche ich."],
    // Nebensatzsubjekt mit Adverb, Name, Pronomen oder Nominalgruppe (N22)
    ["Ich hoffe, dass er heute die Ärzt*in unterstützen könne.", "Ich hoffe, dass er heute den Arzt unterstützen könne."],
    ["Ich hoffe, dass Peter die Ärzt*in unterstützen könne.", "Ich hoffe, dass Peter den Arzt unterstützen könne."],
    ["Ich hoffe, dass sie die Ärzt*in möge.", "Ich hoffe, dass sie den Arzt möge."],
    ["Ich hoffe, dass niemand die Ärzt*in unterstützen könne.", "Ich hoffe, dass niemand den Arzt unterstützen könne."],
    ["Ich hoffe, dass meine Mutter die Ärzt*in unterstützen könne.", "Ich hoffe, dass meine Mutter den Arzt unterstützen könne."],
    ["Ich hoffe, dass die Ärzt*in kommt.", "Ich hoffe, dass der Arzt kommt."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});
