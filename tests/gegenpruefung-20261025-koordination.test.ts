import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Gegenprüfung vom 25.10.2026.
describe("Koordination übernimmt den Dativ nicht über Satz- und Attributgrenzen (N26)", () => {
  it.each([
    ["Wir sehen den Mann, Lehrer:innen und Schüler:innen kommen später.", "Wir sehen den Mann, Lehrer und Schüler kommen später."],
    ["Wir sehen den Mann, Ingenieur:innen und Ärzt:innen kommen später.", "Wir sehen den Mann, Ingenieure und Ärzte kommen später."],
    ["werden Teile von faschistischen Netzwerken, Journalist*innen oder Schriftsteller*innen verbinden sich",
      "werden Teile von faschistischen Netzwerken, Journalisten oder Schriftsteller verbinden sich"],
    ["Wir danken allen Beteiligten und laden Partnerinstitutionen und Forscher*innen ein.",
      "Wir danken allen Beteiligten und laden Partnerinstitutionen und Forscher ein."],
    ["Das Interesse an den Werken der SchriftstellerInnen und Künstler*innen war groß.",
      "Das Interesse an den Werken der Schriftsteller und Künstler war groß."],
    ["Organisationen aus allen Bereichen des zivilen Lebens, Akademiker:innen, Offiziere, Jurist:innen und viele weitere.",
      "Organisationen aus allen Bereichen des zivilen Lebens, Akademiker, Offiziere, Juristen und viele weitere."],
    ["die Sicherung der Rechte durch Autor*innen und, bei Daten, Erheber*innen sowie transparente Regeln",
      "die Sicherung der Rechte durch Autoren und, bei Daten, Erheber sowie transparente Regeln"],
    ["Vertreter:innen von Mitgliedsorganisationen, Promotor:innen und Mitarbeiter:innen der Geschäftsstelle versammelten sich.",
      "Vertreter von Mitgliedsorganisationen, Promotoren und Mitarbeiter der Geschäftsstelle versammelten sich."],
    ["Er bringt Stifter:innen und Mitarbeitende von Stiftungen, Politiker:innen sowie Stiftungsexpert:innen zusammen.",
      "Er bringt Stifter und Mitarbeiter von Stiftungen, Politiker sowie Stiftungsexperten zusammen."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Koordinierter Dativ bleibt (N26)", () => {
  it.each([
    ["von Biologen, Physikern und Ingenieur*innen", "von Biologen, Physikern und Ingenieuren"],
    ["mit den Kindern, Lehrer:innen und Schüler:innen", "mit den Kindern, Lehrern und Schülern"],
    ["mit den Landesverbänden, Vereinsfunktionär*innen und Mitgliedern", "mit den Landesverbänden, Vereinsfunktionären und Mitgliedern"],
    ["Konfliktlösung zwischen Spieler mit Behinderungen, Vereinen und Trainer:innen.",
      "Konfliktlösung zwischen Spieler mit Behinderungen, Vereinen und Trainern."],
    ["Wir sprechen mit ihren Herkunftsgesellschaften, mit Forscher:innen, Künstler:innen und der Öffentlichkeit.",
      "Wir sprechen mit ihren Herkunftsgesellschaften, mit Forschern, Künstlern und der Öffentlichkeit."],
    ["Vorher wird den Vereinen und Schiedsrichter:innen ein Plan geschickt.", "Vorher wird den Vereinen und Schiedsrichtern ein Plan geschickt."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});
