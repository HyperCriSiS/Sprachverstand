import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Befunde der Gegenprüfung vom 30.10.2026.
describe("Gegenprüfung 30.10.: Besitzer, Listen- und Attributgrenzen", () => {
  it.each([
    // Nur weibliche Belege machen einen Namen zur möglichen Besitzerin (N53, N54, N42)
    ["Boris wartet. Jede Lehrer*in kennt ihre Telefonnummer.", "Boris wartet. Jeder Lehrer kennt seine Telefonnummer."],
    ["Boris ist ein Mann. Jede Lehrer*in kennt ihre Telefonnummer.", "Boris ist ein Mann. Jeder Lehrer kennt seine Telefonnummer."],
    ["Kurt wartet. Jede Lehrer*in kennt ihre Telefonnummer.", "Kurt wartet. Jeder Lehrer kennt seine Telefonnummer."],
    ["Benzin brennt. Jede Lehrer*in kennt ihre Telefonnummer.", "Benzin brennt. Jeder Lehrer kennt seine Telefonnummer."],
    ["Links steht ein Tisch. Jede Lehrer*in kennt ihre Telefonnummer.", "Links steht ein Tisch. Jeder Lehrer kennt seine Telefonnummer."],
    ["Augsburg ist schön. Jede Lehrer*in kennt ihre Telefonnummer.", "Augsburg ist schön. Jeder Lehrer kennt seine Telefonnummer."],
    ["Jennifer wartet. Jede Lehrer*in kennt ihre Telefonnummer.", "Jennifer wartet. Jeder Lehrer kennt ihre Telefonnummer."],
    ["Rahel ruft an. Jede Lehrer*in kennt ihre Telefonnummer.", "Rahel ruft an. Jeder Lehrer kennt ihre Telefonnummer."],
    // Pluralbesitzer (N28)
    ["Sechs Lehrer warten. Jede Lehrer*in kennt ihre Telefonnummer.", "Sechs Lehrer warten. Jeder Lehrer kennt ihre Telefonnummer."],
    ["Lehrer und Schüler warten. Jede Lehrer*in kennt ihre Telefonnummer.", "Lehrer und Schüler warten. Jeder Lehrer kennt ihre Telefonnummer."],
    ["Meine Lehrer sind bereit. Jede Lehrer*in kennt ihre Telefonnummer.", "Meine Lehrer sind bereit. Jeder Lehrer kennt ihre Telefonnummer."],
    // Echte Komma-Dativliste (N55)
    ["Wir danken Lehrern, Schüler:innen besonders.", "Wir danken Lehrern, Schülern besonders."],
    ["Wir danken Lehrern, Schüler:innen von Berlin, ausdrücklich.", "Wir danken Lehrern, Schülern von Berlin, ausdrücklich."],
    // Gezähltes Glied nach Attribut (N56, N48)
    ["Das bedeutet Tausende von Nominierten, beinahe 200 Künstler:innen, Labels und Organisationen.",
      "Das bedeutet Tausende von Nominierten, beinahe 200 Künstler, Labels und Organisationen."],
    ["Es kamen 2 Gruppen aus Münster und Bremen und 17 Schüler*innen aus dem Süden.",
      "Es kamen 2 Gruppen aus Münster und Bremen und 17 Schüler aus dem Süden."],
    ["Wir arbeiten in einem Team von zwei Betriebsleitern, zwei Mitarbeiter*innen und drei Lernenden.",
      "Wir arbeiten in einem Team von zwei Betriebsleitern, zwei Mitarbeitern und drei Lernenden."],
    // Kopula mit Adjektiv oder Konjunktion (N48)
    ["Zielgruppen sind große Firmen aus Berlin, Lehrer:innen und Schüler:innen.", "Zielgruppen sind große Firmen aus Berlin, Lehrer und Schüler."],
    ["Das sind Firmen aus Berlin und Lehrer:innen.", "Das sind Firmen aus Berlin und Lehrer."],
    ["Bedroht sind Schutz von Zivilbevölkerung und humanitären Akteur*innen.", "Bedroht sind Schutz von Zivilbevölkerung und humanitären Akteuren."],
    ["Es kamen Stimmen zu Wort, Designerinnen, Managerinnen von Unternehmen und Vertreter*innen von Institutionen.",
      "Es kamen Stimmen zu Wort, Designerinnen, Managerinnen von Unternehmen und Vertreter von Institutionen."],
    // Genitiv nach Singular auf -n/-s (N49)
    ["Mit Wissen der Schulen, Lehrer:innen und Schüler:innen gelingt es.", "Mit Wissen der Schulen, Lehrer und Schüler gelingt es."],
    ["Mit Konsens der Schulen, Lehrer:innen und Schüler:innen gelingt das Projekt.", "Mit Konsens der Schulen, Lehrer und Schüler gelingt das Projekt."],
    // Dativbeleg ohne Artikel (N50)
    ["Wir sprechen mit der Schule und Lehrern sowie Schüler:innen.", "Wir sprechen mit der Schule und Lehrern sowie Schülern."],
    // `bis zu sehr vielen` (N51)
    ["Für bis zu sehr vielen Tausend Lehrer:innen.", "Für bis zu sehr vielen Tausend Lehrer."],
    ["Für bis zu sehr vielen Tausend LehrerInnen.", "Für bis zu sehr vielen Tausend Lehrer."],
    ["Mit bis zu sehr vielen Tausend LehrerInnen.", "Mit bis zu sehr vielen Tausend Lehrern."],
    // Richtungsinfinitiv nach Adjektiv (N52)
    ["Wir versuchen uns zwischen Lehrer:innen und erfahrene Schüler:innen zu setzen.", "Wir versuchen uns zwischen Lehrer und erfahrene Schüler zu setzen."],
    ["Wir stehen zwischen Lehrer:innen und Schüler:innen und stellen Fragen.", "Wir stehen zwischen Lehrern und Schülern und stellen Fragen."],
    // Vorangestellter Dativ nach Fokuspartikel, Doppelpunkt oder Adverb (N35)
    ["Auch Lehrer:innen und unseren Schülern helfen wir.", "Auch Lehrern und unseren Schülern helfen wir."],
    ["Hinweis: Lehrer:innen und unseren Schülern helfen wir.", "Hinweis: Lehrern und unseren Schülern helfen wir."],
    ["Lehrer:innen und unseren Schülern heute helfen zu können, freut uns.", "Lehrern und unseren Schülern heute helfen zu können, freut uns."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});
