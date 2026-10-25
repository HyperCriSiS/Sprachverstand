import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Befunde der Gegenprüfung vom 28.10.2026.
describe("Gegenprüfung 28.10.: Regressionen", () => {
  it.each([
    // Weibliche Namen als mögliche Besitzerin (N42), Pluralbesitzer (N28)
    ["Ingrid wartet. Jede Lehrer*in kennt ihre Telefonnummer.", "Ingrid wartet. Jeder Lehrer kennt ihre Telefonnummer."],
    ["Judith wartet. Jede Lehrer*in kennt ihre Telefonnummer.", "Judith wartet. Jeder Lehrer kennt ihre Telefonnummer."],
    ["Edeltraud wartet. Jede Lehrer*in kennt ihre Telefonnummer.", "Edeltraud wartet. Jeder Lehrer kennt ihre Telefonnummer."],
    ["Justin wartet. Jede Lehrer*in kennt ihre Telefonnummer.", "Justin wartet. Jeder Lehrer kennt seine Telefonnummer."],
    ["Schulen sind geschlossen. Jede Lehrer*in kennt ihre Telefonnummer.",
      "Schulen sind geschlossen. Jeder Lehrer kennt ihre Telefonnummer."],
    ["Unsere neuen Schulen sind bekannt. Jede Lehrer*in kennt ihre Adresse.",
      "Unsere neuen Schulen sind bekannt. Jeder Lehrer kennt ihre Adresse."],
    // Richtungsverben nur als Verbformen, ohne Partikel und fremdes Prädikat (N43), mit Objekt (N34)
    ["Wir arbeiten stellenweise zwischen Lehrer:innen.", "Wir arbeiten stellenweise zwischen Lehrern."],
    ["Wir stehen neben Lehrer:innen und stellen Fragen.", "Wir stehen neben Lehrern und stellen Fragen."],
    ["Wir legen los zwischen Lehrer:innen.", "Wir legen los zwischen Lehrern."],
    ["Wir stellen den Stuhl zwischen Lehrer:innen.", "Wir stellen den Stuhl zwischen Lehrer."],
    ["Kooperation zwischen Landwirt:innen und Forscher:innen.", "Kooperation zwischen Landwirten und Forschern."],
    // Begleitwortpaare mit Doppelpunkt, Zeilenwechsel (N44, REST)
    ["Die bekannteste Frage einer: eines Zollbeamt:in.", "Die bekannteste Frage eines Zollbeamten."],
    ["Mit einer: einem Lehrer:in.", "Mit einem Lehrer."],
    ["Mit unserer: unserem Lehrer:in.", "Mit unserem Lehrer."],
    ["Hinweis:\nwir sehen die Lehrer*in.", "Hinweis:\nwir sehen den Lehrer."],
    // `bis zu` begrenzt nur die Zahl (N45), Zahlwörter (N19)
    ["Der Preis wird an bis zu maximal drei Lehrer:innen vergeben.", "Der Preis wird an bis zu maximal drei Lehrer vergeben."],
    ["Wir suchen bis zu rund drei Lehrer:innen.", "Wir suchen bis zu rund drei Lehrer."],
    ["Für bis zu 4 SpielerInnen.", "Für bis zu 4 Spieler."],
    ["Wir reden mit siebzehn Lehrer:innen.", "Wir reden mit siebzehn Lehrern."],
    ["Wir reden mit einundzwanzig Lehrer:innen.", "Wir reden mit einundzwanzig Lehrern."],
    ["Wir reden mit über 300 LehrerInnen.", "Wir reden mit über 300 Lehrern."],
    ["Am Samstag, den 24.10.2026 kamen LehrerInnen und SchülerInnen.", "Am Samstag, den 24.10.2026 kamen Lehrer und Schüler."],
    // Punkte in Adressen und Abkürzungen beenden keinen Satz (N46)
    ["Auf www.example.com erzählen Lehrer:innen Geschichten.", "Auf www.example.com erzählen Lehrer Geschichten."],
    ["In St. Gallen erzählen Lehrer:innen Geschichten.", "In St. Gallen erzählen Lehrer Geschichten."],
    // Eigenes Verb des zweiten Glieds (N36)
    ["Wir danken dem Lehrer und der Ärzt*in war hier.", "Wir danken dem Lehrer und der Arzt war hier."],
    ["Wir danken dem Lehrer und der Ärzt*in kann helfen.", "Wir danken dem Lehrer und der Arzt kann helfen."],
    // Erweiterte Partizipialattribute (N38)
    ["Wir danken den von den neuen Schulen entsandten Lehrer:innen.", "Wir danken den von den neuen Schulen entsandten Lehrern."],
    ["Wir danken den von der Schule entsandten Lehrer:innen.", "Wir danken den von der Schule entsandten Lehrern."],
    // Verben auf -ten sind keine Adjektive (N40)
    ["Wir reden mit den Kindern und unterrichten Lehrer:innen.", "Wir reden mit den Kindern und unterrichten Lehrer."],
    // Neuer Satz nach der Liste, Hilfsverb davor, erweiterte Attribute, Nominativ-Nachbar (N35-Varianten)
    ["Wir dankten Lehrern, Lehrer:innen und Schüler:innen kommen heute.", "Wir dankten Lehrern, Lehrer und Schüler kommen heute."],
    ["Peter und Anna danken Lehrern, Lehrer:innen und Schüler:innen warten.", "Peter und Anna danken Lehrern, Lehrer und Schüler warten."],
    ["Wir haben Lehrern, Lehrer:innen und Schüler:innen geholfen.", "Wir haben Lehrern, Lehrern und Schülern geholfen."],
    ["Eltern, Künstler:innen und allen Lehrern seit Jahren bekannte Autoren kommen.",
      "Eltern, Künstler und allen Lehrern seit Jahren bekannte Autoren kommen."],
    ["Die Beamten, Lehrer:innen und Schüler:innen kommen.", "Die Beamten, Lehrer und Schüler kommen."],
    ["Wir schieben den Wagen zwischen Lehrer:innen.", "Wir schieben den Wagen zwischen Lehrer."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});
