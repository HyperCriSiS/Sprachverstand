import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Webanalyse 21.10.2026: Diese Kurzpaare fehlten in der Begleitworttabelle.
// Die Phrase blieb unverändert (`mit einem*r Dozent*in`) oder nur das Nomen
// wurde aufgelöst (`einer*m Mentor`).
describe("kurze Begleitwortpaare", () => {
  it.each([
    ["interaktiv mit einem*r Dozent*in.", "interaktiv mit einem Dozenten."],
    ["Gemeinsam mit einem/r Mitarbeiter/in", "Gemeinsam mit einem Mitarbeiter"],
    ["mit einem:r Gastgeber:in", "mit einem Gastgeber"],
    ["von dem/r Gutachter*in erstellt", "von dem Gutachter erstellt"],
    ["mit dem*r zuständigen Förderreferent*in", "mit dem zuständigen Förderreferenten"],
    ["neben der*m Präsident*in", "neben dem Präsidenten"],
    ["Verankerung des Berufs des*r Psychotherapeut*in", "Verankerung des Berufs des Psychotherapeuten"],
    ["Bonitätskriterien des:r Vermieter:in", "Bonitätskriterien des Vermieters"],
    ["Die Publikationen eines/r Wissenschaftler*in", "Die Publikationen eines Wissenschaftlers"],
    ["mit einer*m Mentor*in", "mit einem Mentor"],
    ["mit einer/m zeitgenössischen Künstler:in", "mit einem zeitgenössischen Künstler"],
    ["Aufgabe jeder*m Reiter*in", "Aufgabe jedem Reiter"],
    ["Stimme einer/s Bundesjugendreferent*in", "Stimme eines Bundesjugendreferenten"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));

  it.each([
    // Bestehende Paare unverändert.
    ["zum/r Lehrer*in ausbilden", "zum Lehrer ausbilden"],
    ["eine/n Referent/in", "einen Referenten"],
    // Ohne markiertes Nomen keine Änderung.
    ["einem/r anderen", "einem/r anderen"],
    ["der*m Text", "der*m Text"]
  ])("bleibt: %s", (input, expected) => expect(t(input)).toBe(expected));
});
