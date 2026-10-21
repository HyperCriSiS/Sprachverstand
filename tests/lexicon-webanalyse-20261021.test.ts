import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Webanalyse 21.10.2026: häufigste offene Personenbezeichnungen auf
// mehreren unabhängigen Domains (Österreich/Schweiz, Gesundheit, Handwerk).
describe("Lexikontranche aus der Webanalyse", () => {
  it.each([
    // Duden-geprüfte Paradigmen.
    ["die Wissenschafter:innen", "die Wissenschafter"],
    ["mit Wissenschafter*innen", "mit Wissenschaftern"],
    ["WissenschafterInnen", "Wissenschafter"],
    ["Nachwuchswissenschafter:innen", "Nachwuchswissenschafter"],
    ["des/der Wissenschafter*in", "des Wissenschafters"],
    ["und Innovator:innen", "und Innovatoren"],
    ["für Wiedereinsteiger*innen", "für Wiedereinsteiger"],
    ["und Pensionist*innen", "und Pensionisten"],
    ["als Pensionist*in", "als Pensionist"],
    ["für Dissertant_innen", "für Dissertanten"],
    ["Augen- und Ohrenzeug*innen", "Augen- und Ohrenzeugen"],
    // Regelmäßige Bildungen.
    ["für Asylwerber*innen", "für Asylwerber"],
    ["bei Asylwerber:innen", "bei Asylwerbern"],
    ["für Zuweiser*innen", "für Zuweiser"],
    ["freie Dienstnehmer:innen", "freie Dienstnehmer"],
    ["40.000 Zuseher:innen", "40.000 Zuseher"],
    ["zivile Seenotretter*innen", "zivile Seenotretter"],
    ["die Kollegiat:innen", "die Kollegiaten"],
    ["die Initiant:innen", "die Initianten"],
    ["für Famulant*innen", "für Famulanten"],
    ["die Promotor:innen", "die Promotoren"],
    ["Nationale Junior:innen", "Nationale Junioren"],
    ["aller Mandatar:innen", "aller Mandatare"],
    ["sowie Kassier/in", "sowie Kassier"],
    ["Unsere Vorlesepat:innen", "Unsere Vorlesepaten"],
    ["Lesepat:in", "Lesepate"],
    ["der Monarchist:innen", "der Monarchisten"],
    // Berufe auf -bauer: weiblich -bauerin.
    ["Übung Metallbauer/in", "Übung Metallbauer"],
    ["Metallbauer/-in gesucht", "Metallbauer gesucht"],
    ["Straßenbauer/in", "Straßenbauer"],
    ["Orgelbauer:in", "Orgelbauer"],
    ["mit Metallbauer*innen", "mit Metallbauern"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));

  it.each([
    ["Bauer:in", "Bauer"],
    ["Kakaobäuer*innen", "Kakaobäuer*innen"],
    ["Juniorinnen", "Juniorinnen"],
    ["Junior-Team", "Junior-Team"],
    ["Wissenschafterin", "Wissenschafterin"],
    // Lehnwörter bleiben bewusst außerhalb dieser Tranche.
    ["Creator*innen", "Creator*innen"],
    ["Panelist*innen", "Panelist*innen"]
  ])("bleibt: %s", (input, expected) => expect(t(input)).toBe(expected));
});
