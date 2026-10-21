import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Webanalyse 21.10.2026: Marker hinter einer schon flektierten maskulinen
// Form waren mit rund 1.560 Vorkommen auf über 500 Domains die größte
// zusammenhängende Lücke (`Kollegen/-innen`, `Patienten*innen`).
describe("Marker hinter flektierter maskuliner Form", () => {
  it.each([
    ["Liebe Kollegen/-innen,", "Liebe Kollegen,"],
    ["Kollegen/innen", "Kollegen"],
    ["Kollegen*innen", "Kollegen"],
    ["Kollegen:innen", "Kollegen"],
    ["Kollegen_innen", "Kollegen"],
    ["Kollegen(innen)", "Kollegen"],
    ["KollegenInnen", "Kollegen"],
    ["Patienten*innen", "Patienten"],
    ["Ärzte/innen", "Ärzte"],
    ["Senioren*innen", "Senioren"],
    ["Praktikanten/-innen", "Praktikanten"],
    ["Akteure*innen", "Akteure"],
    ["Kollegen/innen-Treffen", "Kollegen-Treffen"],
    // Dativ Plural steht schon im Text.
    ["mit Mitarbeitern/innen", "mit Mitarbeitern"],
    ["Teilnehmern*innen", "Teilnehmern"],
    ["Ärzten/innen", "Ärzten"],
    ["TeilnehmernInnen", "Teilnehmern"],
    // Singular auf -e und obliquer Singular schwacher Nomen.
    ["Psychologe/in", "Psychologe"],
    ["Sozialpädagoge*in", "Sozialpädagoge"],
    ["Technologe/in", "Technologe"],
    ["Ausbildung zum Assistenten/in", "Ausbildung zum Assistenten"],
    ["Kandidaten(in)", "Kandidaten"],
    // Auflösbare Begleitwortpaare davor werden danach mit aufgelöst.
    ["ein/e Kollege:in", "ein Kollege"],
    ["des/der Kunden/in", "des Kunden"],
    ["der/die Psychologe/in", "der Psychologe"],
    // Bestehende Pluralregeln einschließlich Dativ bleiben zuständig.
    ["Lehrer/innen", "Lehrer"],
    ["mit Lehrer*innen", "mit Lehrern"],
    ["mit Kollegen*innen", "mit Kollegen"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));

  it.each([
    // Keine Personenbezeichnung im Lexikon.
    ["Kinderwagen/in", "Kinderwagen/in"],
    ["noch im Kinderwagen/in der Trage", "noch im Kinderwagen/in der Trage"],
    ["Wagen/innen", "Wagen/innen"],
    ["Daten*innen", "Daten*innen"],
    ["Mitglieder*innen", "Mitglieder*innen"],
    // Normale Feminina und Tippfehlerformen.
    ["Kolleginnen", "Kolleginnen"],
    ["Patientinnen", "Patientinnen"],
    ["Kollegenn*innen", "Kollegenn*innen"],
    // Dateinamen, Pfade, Unterstrich-Singular.
    ["27.12.23_TA_Favoriten_in_Apolda.pdf", "27.12.23_TA_Favoriten_in_Apolda.pdf"],
    ["Kollege_in", "Kollege_in"],
    // Schrägstrichreihen und nicht auflösbare Paare davor: nicht halb umwandeln.
    ["Fotografen*in/Videografen*in", "Fotografen*in/Videografen*in"],
    ["Medizinische/r Technologe/in", "Medizinische/r Technologe/in"],
    ["zum/zur Pflegefachassistenten/-in", "zum/zur Pflegefachassistenten/-in"],
    ["eine/n engagierte/n Studenten/in", "eine/n engagierte/n Studenten/in"]
  ])("bleibt: %s", (input, expected) => expect(t(input)).toBe(expected));
});
