import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Unabhängige Gegenprüfung von Codex, 23.10.2026 (artifacts/gegenpruefung-20261023).
describe("Relativpronomen (N01, N02, N13)", () => {
  it.each([
    // Infinitivsatz statt Relativsatz.
    ["Der/Die Teilnehmer:in verpflichtet sich, die von einer Förderstelle übernommenen Kosten zu übernehmen, wenn sie zahlt.",
      "Der Teilnehmer verpflichtet sich, die von einer Förderstelle übernommenen Kosten zu übernehmen, wenn sie zahlt."],
    ["der/die ausländische partner/in droht, die kinder ins ausland zu bringen",
      "der ausländische partner droht, die kinder ins ausland zu bringen"],
    // Bezug auf ein anderes Glied.
    ["Ob Laden, Händler:in und alle, die sonst in der Branche tätig sind – jede:r ist willkommen!",
      "Ob Laden, Händler und alle, die sonst in der Branche tätig sind – jeder ist willkommen!"],
    ["ist eine fachliche Entscheidung der*des Therapeut*in, die gemeinsam mit der*dem Klient*in getroffen wird.",
      "ist eine fachliche Entscheidung des Therapeuten, die gemeinsam mit dem Klienten getroffen wird."],
    // Relativpaar.
    ["wozu ich jede*n Künstler*in zähle, die oder der Wert darauf legt",
      "wozu ich jeden Künstler zähle, der Wert darauf legt"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Dativ-n bei Pluralen auf -er (N03, N07, N11)", () => {
  it.each([
    // Kein Dativ: Relativ-„den“ oder Präpositionalattribut vor „und“.
    ["Die Prämie ist ein Geldbetrag, den Bauernfamilien und Arbeiter*innen in Projekte investieren.",
      "Die Prämie ist ein Geldbetrag, den Bauernfamilien und Arbeiter in Projekte investieren."],
    ["das Überlebende von Genoziden und Zeichner:innen zusammenbringt.", "das Überlebende von Genoziden und Zeichner zusammenbringt."],
    ["Rechtsanwält*innen aus Bremen und Nebenklagevertreter*innen aus Köln", "Rechtsanwälte aus Bremen und Nebenklagevertreter aus Köln"],
    ["KZ-Häftlinge aus verschiedenen Ländern sowie BürgerInnen aus Osterburken.", "KZ-Häftlinge aus verschiedenen Ländern sowie Bürger aus Osterburken."],
    ["vor allem für Radfahrer:innen, Fans von Weitwanderungen und Abenteurer:innen.", "vor allem für Radfahrer, Fans von Weitwanderungen und Abenteurer."],
    // Dativ über Zahlen, Namensbestandteile und Personen im ersten Glied.
    ["Durch die Anwesenheit von 35 L’Oréal-Mitarbeitenden und 8 InteGREATer:innen aus den Gruppen",
      "Durch die Anwesenheit von 35 L’Oréal-Mitarbeitenden und 8 InteGREATern aus den Gruppen"],
    ["direkt bei den RosaLila PantherInnen in Graz", "direkt bei den RosaLila Panthern in Graz"],
    ["von Opfern und Täter*innen", "von Opfern und Tätern"],
    ["von Antifaschisten und Widerstandkämpfer:innen gegründet", "von Antifaschisten und Widerstandkämpfern gegründet"],
    // Quellenalias bleibt bei seiner Reparatur.
    ["Partern:innen", "Partner"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});
