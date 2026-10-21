import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Webanalyse 21.10.2026.
describe("feminines der direkt vor markiertem Singular", () => {
  it.each([
    // Genitiv nach Nomen ergab `der Künstler` bzw. `der Experte`.
    ["Das Projekt der Künstler*in.", "Das Projekt des Künstlers."],
    ["Publikationen der Expert*in sind online.", "Publikationen des Experten sind online."],
    ["die Rolle der Gastgeber:in", "die Rolle des Gastgebers"],
    ["Tag der verfolgten Anwält:in", "Tag des verfolgten Anwalts"],
    // Dativ nach Präposition mit Adjektiv ergab `mit der neuen Kollege`.
    ["mit der neuen Kolleg*in", "mit dem neuen Kollegen"],
    ["bei der zuständigen Sachbearbeiter:in", "bei dem zuständigen Sachbearbeiter"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));

  it.each([
    // Paare: nicht halb umwandeln.
    ["beim:bei der aktuellen Arbeitgeber:in", "beim:bei der aktuellen Arbeitgeber:in"],
    // Großgeschriebenes Funktionswort am Satzanfang ist kein Nomen.
    ["Viele der Ehrenamtler*in", "Viele der Ehrenamtler*in"],
    ["In der Natur-Mentaltrainer*in", "In der Natur-Mentaltrainer*in"],
    // Unterstrich-Kompositum ist kein Personensingular.
    ["Verlängerung der Jugendleiter_in_card", "Verlängerung der Jugendleiter_in_card"],
    // Normale Feminina bleiben.
    ["Das Projekt der Künstlerin.", "Das Projekt der Künstlerin."]
  ])("bleibt: %s", (input, expected) => expect(t(input)).toBe(expected));

  it.each([
    // Nominativ am Satzanfang oder nach Verb wie bisher.
    ["Der Kund*in kommt.", "Der Kunde kommt."],
    ["Heute kommt der Kund*in.", "Heute kommt der Kunde."],
    // Kompositum mit Bindestrich ist kein Personensingular.
    ["Verbessern der Therapeut:in-Arzt-Beziehung", "Verbessern der Therapeut-Arzt-Beziehung"],
    ["Stärkung der Jugendleiter*in-Card", "Stärkung der Jugendleiter-Card"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Präposition direkt vor dem Nomen öffnet eine eigene Phrase", () => {
  it.each([
    ["Die Kosten betragen pro Schüler:in 5 €.", "Die Kosten betragen pro Schüler 5 €."],
    ["die Kosten pro Teilnehmer/in", "die Kosten pro Teilnehmer"],
    ["die Beziehung zwischen Patient*in und Therapeut", "die Beziehung zwischen Patient und Therapeut"],
    ["die Ersparnis pro Dienstnehmer:in", "die Ersparnis pro Dienstnehmer"],
    ["die ÖH ohne Wirtschaftsreferent:in", "die ÖH ohne Wirtschaftsreferent"],
    ["Keine Unterschrift von Vertreter:in nötig", "Keine Unterschrift von Vertreter nötig"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));

  it.each([
    // Begleitwort nach der Präposition: Schutz wie bisher.
    ["für eine neue Betreuer:in", "für eine neue Betreuer:in"],
    ["mit einer erfahrenen Patient*in", "mit einer erfahrenen Patient*in"],
    // Erweitertes Attribut mit Präposition: Schutz bleibt.
    ["die mit Kindern arbeitende Erzieher*in", "die mit Kindern arbeitende Erzieher*in"],
    ["die Lehrer*in", "die Lehrer*in"]
  ])("bleibt: %s", (input, expected) => expect(t(input)).toBe(expected));
});
