import { describe, expect, it } from "vitest";
import { knownPluralSeparatorsRule } from "../../src/rules/known-plural-separators";

// Kurze, unabhängig veröffentlichte Web-Oberflächen in verschiedenen Sachkontexten.
// Quellenbelege und Abrufdaten werden getrennt vom öffentlichen Produkt verwaltet.
describe("Begrenzte Real-Web-Gegenprobe für Plural-Kurzformen", () => {
  it.each([
    ["Einzellizenz für Schüler/-innen (1 Schuljahr)", "Einzellizenz für Schüler (1 Schuljahr)"],
    ["Kollegiumslizenz für Lehrer/-innen (Dauerlizenz)", "Kollegiumslizenz für Lehrer (Dauerlizenz)"],
    ["Die Teilnehmer/innenzahl ist limitiert.", "Die Teilnehmerzahl ist limitiert."],
    ["Nur angemeldete Teilnehmer/innen werden zugelassen.", "Nur angemeldete Teilnehmer werden zugelassen."],
    ["Anmeldung Schüler/innen, Lehrkräfte und Betriebe", "Anmeldung Schüler, Lehrkräfte und Betriebe"]
  ])("normalisiert die echte Personenplural-Oberfläche %s", (input, expected) => {
    expect(knownPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    "Arzt/Ärztin & Sprechzeiten",
    "Selbstzahler/in",
    "Lehrerinnen und Lehrer",
    "Zentrale Schülerverwaltung",
    "Lehrkraft",
    "Funktionsträger/innen"
  ])("belässt Singular, Doppelnennung und andere Grenzen unverändert: %s", (input) => {
    expect(knownPluralSeparatorsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
