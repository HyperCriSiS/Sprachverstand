import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Restfälle der Gegenprüfung vom 26.10.2026.
describe("Dativlisten neben eindeutigem Dativplural (N07, N26)", () => {
  it.each([
    ["Wir arbeiten mit Biologen, erfahrenen Physikern und Ingenieur:innen.", "Wir arbeiten mit Biologen, erfahrenen Physikern und Ingenieuren."],
    ["Wir sprechen mit Lehrer:innen der Schule, Schüler:innen der Klasse und Helfer:innen.",
      "Wir sprechen mit Lehrern der Schule, Schülern der Klasse und Helfern."],
    ["Der Verein bedankte sich bei SpielerInnen, HelferInnen, FunktionärInnen und SponsorInnen.",
      "Der Verein bedankte sich bei Spielern, Helfern, Funktionären und Sponsoren."],
    ["mit Humanmediziner*innen und erfahrenen Umweltwissenschaftler*innen", "mit Humanmedizinern und erfahrenen Umweltwissenschaftlern"],
    ["Wir sprechen mit Lehrern und, bei Bedarf, Schüler:innen.", "Wir sprechen mit Lehrern und, bei Bedarf, Schülern."],
    ["Ihr könnt euch mit Expert:innen, Gründer:innen und Macher:innen austauschen.",
      "Ihr könnt euch mit Experten, Gründern und Machern austauschen."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Kein Dativ über Satz- und Genitivgrenzen (N26)", () => {
  it.each([
    ["Wir sehen den Wagen, Lehrer:innen und Schüler:innen kommen.", "Wir sehen den Wagen, Lehrer und Schüler kommen."],
    ["Wir sprechen mit den Kindern, Lehrer:innen und Schüler:innen kommen später.",
      "Wir sprechen mit den Kindern, Lehrer und Schüler kommen später."],
    ["Wir wollen mit Kindern, Lehrer:innen und Schüler:innen arbeiten.", "Wir wollen mit Kindern, Lehrern und Schülern arbeiten."],
    ["die Besoldung der Beamt:innen, Richter:innen und Soldat:innen", "die Besoldung der Beamten, Richter und Soldaten"],
    ["Lehrer werden zu Schulbegleiter:innen, IT-Techniker:innen absolvieren erneut eine Ausbildung.",
      "Lehrer werden zu Schulbegleitern, IT-Techniker absolvieren erneut eine Ausbildung."],
    ["Auf den Bühnen treffen Politiker:innen und Journalist:innen aufeinander.", "Auf den Bühnen treffen Politiker und Journalisten aufeinander."],
    ["Bei den Themenprojektwochen bearbeiten Schüler:innen Themen.", "Bei den Themenprojektwochen bearbeiten Schüler Themen."],
    ["Wir möchten bei allen Wahlen allen Bürger:innen das Wahlrecht geben.", "Wir möchten bei allen Wahlen allen Bürgern das Wahlrecht geben."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Dativlisten: rechter Nachbar, lange Attribute, Herkunftsadjektiv", () => {
  it.each([
    ["Wir erwarten von Politik, Arbeitgeber:innen und allen Verantwortungsträger:innen Mut.",
      "Wir erwarten von Politik, Arbeitgebern und allen Verantwortungsträgern Mut."],
    ["Der Beirat besteht aus Praktiker:innen der öffentlichen und freien Jugendhilfe, Vertreter:innen der Spitzenverbände.",
      "Der Beirat besteht aus Praktikern der öffentlichen und freien Jugendhilfe, Vertretern der Spitzenverbände."],
    ["mit Künstler:innen, jüdischen Ostberliner Interviewpartner:innen und Lesungen",
      "mit Künstlern, jüdischen Ostberliner Interviewpartnern und Lesungen"],
    // Ohne Begleitwort oder Adjektiv vor dem rechten Nachbarn kein Dativ.
    ["Süchtige, ihre Angehörigen, Freund*innen oder Arbeitgebern erfahren hier mehr.",
      "Süchtige, ihre Angehörigen, Freunde oder Arbeitgebern erfahren hier mehr."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});
