import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Beim Abgleich mit der Webanalyse vom 21.10.2026 gefunden: Zwischen
// Dativauslöser und markiertem Wort zählten beliebige Wörter auf -en.
describe("Dativ nur in einer zusammenhängenden Nominalphrase", () => {
  it.each([
    // Satz- und Phrasengrenze: kein Dativ.
    ["Mit ihnen können Lehrer*innen arbeiten", "Mit ihnen können Lehrer arbeiten"],
    ["Bei denen haben Lehrer*innen frei", "Bei denen haben Lehrer frei"],
    ["Von ihnen erhalten Schüler*innen Noten", "Von ihnen erhalten Schüler Noten"],
    ["Seit Wochen streiken Lehrer*innen", "Seit Wochen streiken Lehrer"],
    ["Nach Angaben sollen Lehrer*innen", "Nach Angaben sollen Lehrer"],
    ["Mit vereinten Kräften helfen Lehrer*innen", "Mit vereinten Kräften helfen Lehrer"],
    ["Zu helfen haben Lehrer*innen", "Zu helfen haben Lehrer"],
    // Echte Dativphrasen wie bisher.
    ["mit unseren neuen Lehrer*innen", "mit unseren neuen Lehrern"],
    ["zu unseren Lehrer*innen", "zu unseren Lehrern"],
    ["zu gewalttätigen Funktionär*innen", "zu gewalttätigen Funktionären"],
    ["bei den Jungen Kunstfreund*innen", "bei den Jungen Kunstfreunden"],
    ["mit allen Lehrer*innen und Schüler*innen", "mit allen Lehrern und Schülern"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Dativ beim Binnen-I", () => {
  it.each([
    ["von LehrerInnen", "von Lehrern"],
    ["allen MitarbeiterInnen", "allen Mitarbeitern"],
    ["den MitarbeiterInnen", "den Mitarbeitern"],
    ["Mit LehrerInnen und Eltern", "Mit Lehrern und Eltern"],
    ["mit unseren neuen KollegInnen", "mit unseren neuen Kollegen"],
    ["nach ÄrztInnen und Angehörigen", "nach Ärzten und Angehörigen"],
    // Normale Feminina und Phrasengrenzen bleiben.
    ["mit Lehrerinnen", "mit Lehrerinnen"],
    ["Seit Wochen streiken LehrerInnen", "Seit Wochen streiken Lehrer"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});
