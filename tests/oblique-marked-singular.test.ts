import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Webanalyse 21.10.2026 (CASE-01): nach `dem`, `des`, `eines` … entstand der
// Nominativ (`dem Kunde`, `eines Patient`, `des Mitarbeiter`).
describe("markierter Singular nach Begleitwort im obliquen Kasus", () => {
  it.each([
    ["Wir danken dem Kund*in.", "Wir danken dem Kunden."],
    ["die Akte eines Patient*in", "die Akte eines Patienten"],
    ["des Patient*in", "des Patienten"],
    ["den Patient*in", "den Patienten"],
    ["mit dem Assistent*in", "mit dem Assistenten"],
    ["einem Student*in", "einem Studenten"],
    ["des Kolleg*in", "des Kollegen"],
    ["dem Expert*in", "dem Experten"],
    ["des Mitarbeiter*in", "des Mitarbeiters"],
    ["jedes Teilnehmer*in", "jedes Teilnehmers"],
    ["dem Mitarbeiter*in", "dem Mitarbeiter"],
    ["ihrem Kolleg*in", "ihrem Kollegen"],
    ["Dem Kund:in", "Dem Kunden"],
    ["dem Kund/-in", "dem Kunden"],
    ["dem Kund(in)", "dem Kunden"],
    ["mit dem Dozent*in", "mit dem Dozenten"],
    // Schwache Adjektive zwischen Begleitwort und Nomen.
    ["dem neuen Kund*in", "dem neuen Kunden"],
    ["des neuen Mitarbeiter*in", "des neuen Mitarbeiters"],
    ["mit einem erfahrenen Kolleg*in", "mit einem erfahrenen Kollegen"],
    ["Ihrem zukünftigen Betreuer:in.", "Ihrem zukünftigen Betreuer."],
    ["Kann eine Behörde keinen Gebärdensprachdolmetscher*in bestellen?", "Kann eine Behörde keinen Gebärdensprachdolmetscher bestellen?"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));

  it.each([
    // Nominativ und feminine/mehrdeutige Begleitwörter wie bisher.
    ["der Kund*in", "der Kunde"],
    ["ein Kund*in", "ein Kunde"],
    ["die Kund*in", "die Kund*in"],
    ["einer Patient*in", "einer Patient*in"],
    ["eine weitere Mitarbeiter:in", "eine weitere Mitarbeiter:in"],
    // Plural bleibt beim Pluralpfad.
    ["den Kund*innen", "den Kunden"],
    ["dem Mitarbeiter*innen-Team", "dem Mitarbeiter-Team"],
    // Ohne Kasusform im Lexikon lieber unverändert als falscher Nominativ.
    ["des Arzt*in", "des Arzt*in"],
    // Begleitwortpaare werden als Ganzes aufgelöst, nie halb.
    ["eine/einen Sachbearbeiter/-in", "einen Sachbearbeiter"],
    ["eine/ einen Sachbearbeiter/-in", "einen Sachbearbeiter"],
    ["Ihrer/Ihrem Leser/in", "Ihrem Leser"],
    ["eine oder einen Mitarbeiter*in", "einen Mitarbeiter"],
    ["die eine/den einen Kritiker:in", "die eine/den einen Kritiker:in"],
    // Ausgangsform mit Trennstrich nach dem Marker.
    ["den Schüler*in-nen", "den Schülern"]
  ])("bleibt: %s", (input, expected) => expect(t(input)).toBe(expected));
});
