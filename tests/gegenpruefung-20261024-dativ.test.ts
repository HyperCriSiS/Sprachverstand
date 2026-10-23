import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Unabhängige Gegenprüfung von Codex, 24.10.2026 (artifacts/gegenpruefung-20261024).
describe("Dativverben und Satzrolle (N18)", () => {
  it.each([
    ["Heute helfen Lehrer:innen den Kindern.", "Heute helfen Lehrer den Kindern."],
    ["Heute helfen Fantasiehelfer:innen den Kindern.", "Heute helfen Fantasiehelfer den Kindern."],
    ["In der Schulbibliothek helfen Audible-Mitarbeiter*innen, den Bestand zu inventarisieren.",
      "In der Schulbibliothek helfen Audible-Mitarbeiter, den Bestand zu inventarisieren."],
    ["In dieser Konzertreihe begegnen Schüler*innen berühmten Komponisten.",
      "In dieser Konzertreihe begegnen Schüler berühmten Komponisten."],
    ["Wir helfen Lehrer:innen auszubilden.", "Wir helfen Lehrer auszubilden."],
    ["Wem helfen Lehrer:innen?", "Wem helfen Lehrer?"],
    ["Ehemalige Jugend hilft Sieger:innen beraten uns.", "Ehemalige Jugend hilft Sieger beraten uns."],
    // Weiterhin Dativ, wenn das Subjekt vor dem Verb steht.
    ["Die Ergebnisse helfen Ärzt*innen, die Behandlung zu planen.", "Die Ergebnisse helfen Ärzten, die Behandlung zu planen."],
    ["Sie entlasten Familien und helfen MitarbeiterInnen dabei.", "Sie entlasten Familien und helfen Mitarbeitern dabei."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("„bis zu“ vor Zahlen (N19)", () => {
  it.each([
    ["Bis zu 20 Bewerber*innen werden eingeladen.", "Bis zu 20 Bewerber werden eingeladen."],
    ["Wir suchen bis zu 20 Lehrer*innen.", "Wir suchen bis zu 20 Lehrer."],
    ["Der Raum bietet Platz für bis zu 960 Schüler*innen.", "Der Raum bietet Platz für bis zu 960 Schüler."],
    ["Wir sprechen mit bis zu 20 Lehrer*innen.", "Wir sprechen mit bis zu 20 Lehrern."],
    ["Information mit PraxisbezugDie Besucher*innen konnten wählen.", "Information mit PraxisbezugDie Besucher konnten wählen."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Koordination im Dativ (N20, halbe Umwandlungen)", () => {
  it.each([
    ["Wir sprechen mit Kollegen aus Kantonen und Vertreter*innen.", "Wir sprechen mit Kollegen aus Kantonen und Vertretern."],
    ["Mit 12 Hundeführer:innen und 17 Helfer:innen machten wir uns auf.", "Mit 12 Hundeführern und 17 Helfern machten wir uns auf."],
    ["Die JEF nahm mit 40 Teilnehmer*innen aus Deutschland und 15 Teilnehmer*innen aus Frankreich teil.",
      "Die JEF nahm mit 40 Teilnehmern aus Deutschland und 15 Teilnehmern aus Frankreich teil."],
    ["Wir sind ein Team aus 38 Bäcker:innen, Konditor:innen, Produktionshelfer:innen und Fahrer:innen.",
      "Wir sind ein Team aus 38 Bäckern, Konditoren, Produktionshelfern und Fahrern."],
    ["Sie setzt sich zusammen aus dem Vorstand, den gewählten Vertretern sowie Haussprecher*innen aller Häuser und wird überwacht.",
      "Sie setzt sich zusammen aus dem Vorstand, den gewählten Vertretern sowie Haussprechern aller Häuser und wird überwacht."],
    ["Wir arbeiten zu Friseur:innen, Schneider:innen, Köch:innen oder Maurer:innen.",
      "Wir arbeiten zu Friseuren, Schneidern, Köchen oder Maurern."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));

  it.each([
    // Jahreszahl, Präposition mit Akkusativ und Subjekt bleiben ohne Dativ.
    ["Seit 2015 nehmen Läufer:innen und Rollstuhlfahrer:innen teil.", "Seit 2015 nehmen Läufer und Rollstuhlfahrer teil."],
    ["Gewalt von SchülerInnen gegen LehrerInnen nimmt zu.", "Gewalt von Schülern gegen Lehrer nimmt zu."],
    ["Wir danken die vielen Unterstützer*innen nicht.", "Wir danken die vielen Unterstützer nicht."],
    ["In einigen Fällen wurden Bewerber*innen abgelehnt.", "In einigen Fällen wurden Bewerber abgelehnt."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Großgeschriebener Verbauslöser (N21)", () => {
  it.each([
    ["Das Vertrauen unseren Lehrer*innen gegenüber wächst.", "Das Vertrauen unseren Lehrern gegenüber wächst."],
    ["Vertrauen unseren Lehrer*innen gegenüber ist wichtig.", "Vertrauen unseren Lehrern gegenüber ist wichtig."],
    ["Wir Danken unseren Förderer*innen und Kooperationspartner*innen.", "Wir Danken unseren Förderern und Kooperationspartnern."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});
