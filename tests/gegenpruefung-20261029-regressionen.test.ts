import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Befunde der Gegenprüfung vom 29.10.2026.
describe("Gegenprüfung 29.10.: Listen-Scanner und Restvarianten", () => {
  it.each([
    // Kein Dativ aus Attribut, Apposition oder Prädikat (N48)
    ["Zielgruppen sind KMU aus den Alpenregionen, Tourismusbetriebe, DienstleisterInnen aus dem Gewerbe, RegionalentwicklerInnen.",
      "Zielgruppen sind KMU aus den Alpenregionen, Tourismusbetriebe, Dienstleister aus dem Gewerbe, Regionalentwickler."],
    ["Zielgruppen sind Firmen aus Berlin, Lehrer:innen und Schüler:innen.", "Zielgruppen sind Firmen aus Berlin, Lehrer und Schüler."],
    ["Es wurden zu fast 2300 Projekten, Bürger*innen online befragt.", "Es wurden zu fast 2300 Projekten, Bürger online befragt."],
    ["Er unterstützt zusammen mit unabhängigen Gewerkschaften, Textilarbeiter*innen darin, ihre Lage zu verbessern.",
      "Er unterstützt zusammen mit unabhängigen Gewerkschaften, Textilarbeiter darin, ihre Lage zu verbessern."],
    ["Helena und Constantin Meyer zu Allendorf, Bundessprecher*innen von Campusgrün, ergänzen dazu:",
      "Helena und Constantin Meyer zu Allendorf, Bundessprecher von Campusgrün, ergänzen dazu:"],
    ["Kontakte zu Kunstinstitutionen, Künstler*innen vermitteln.", "Kontakte zu Kunstinstitutionen, Künstlern vermitteln."],
    ["Konflikte mit Lehrern, Mitschüler*innen auch außerhalb der Schule.", "Konflikte mit Lehrern, Mitschülern auch außerhalb der Schule."],
    // Genitivreihen behalten ihren Rang (N49)
    ["Mit Unterstützung der beteiligten Schulen, Studierenden und Schüler:innen.",
      "Mit Unterstützung der beteiligten Schulen, Studierenden und Schüler."],
    ["auch in den politischen Inhalten der verschiedenen Arenen und Akteur*innen der Demokratie.",
      "auch in den politischen Inhalten der verschiedenen Arenen und Akteure der Demokratie."],
    ["von Arbeitsmigranten in der Zeit der Industrialisierung, Zwangsarbeiter*innen während der NS-Zeit,",
      "von Arbeitsmigranten in der Zeit der Industrialisierung, Zwangsarbeitern während der NS-Zeit,"],
    // Dativnachbar nach femininem Singular im ersten Glied (N50)
    ["Transparenz gegenüber der Öffentlichkeit und den Partner:innen sowie deren Gesellschafter:innen.",
      "Transparenz gegenüber der Öffentlichkeit und den Partnern sowie deren Gesellschaftern."],
    // `bis zu` mit Mengenwort (N51), Zahlwörter (N19)
    ["Für bis zu annähernd drei Lehrer:innen.", "Für bis zu annähernd drei Lehrer."],
    ["Für bis zu vielen Tausend LehrerInnen.", "Für bis zu vielen Tausend Lehrer."],
    ["Mit bis zu vielen Tausend LehrerInnen.", "Mit bis zu vielen Tausend Lehrern."],
    ["Wir sprechen mit Lehrern und annähernd zehn Schüler:innen.", "Wir sprechen mit Lehrern und annähernd zehn Schülern."],
    // Liste vor Richtungsinfinitiv (N52)
    ["Wir versuchen uns zwischen LehrerInnen und SchülerInnen zu setzen.", "Wir versuchen uns zwischen Lehrer und Schüler zu setzen."],
    // Listenvarianten (N35)
    ["Lehrer:innen und unseren Schülern helfen wir.", "Lehrern und unseren Schülern helfen wir."],
    ["Der Rat der Lehrern und Schüler:innen bekannten Autoren zählt.", "Der Rat der Lehrern und Schülern bekannten Autoren zählt."],
    ["Wir danken Lehrern von heute und Schüler:innen.", "Wir danken Lehrern von heute und Schülern."],
    // Weitere Nichtverben (N41)
    ["Wir danken Lehrern, Lehrer:innen und Schüler:innen vereinzelt.", "Wir danken Lehrern, Lehrern und Schülern vereinzelt."],
    ["Wir danken Lehrern, Lehrer:innen und Schüler:innen erhalten Bücher.", "Wir danken Lehrern, Lehrer und Schüler erhalten Bücher."],
    // Mögliche Besitzerin und Pluralbesitzer (N42, N28)
    ["Ingrid kann helfen. Jede Lehrer*in kennt ihre Telefonnummer.", "Ingrid kann helfen. Jeder Lehrer kennt ihre Telefonnummer."],
    ["Marlis wartet. Jede Lehrer*in kennt ihre Telefonnummer.", "Marlis wartet. Jeder Lehrer kennt ihre Telefonnummer."],
    ["Justin wartet. Jede Lehrer*in kennt ihre Telefonnummer.", "Justin wartet. Jeder Lehrer kennt seine Telefonnummer."],
    ["Markus wartet. Jede Lehrer*in kennt ihre Telefonnummer.", "Markus wartet. Jeder Lehrer kennt seine Telefonnummer."],
    ["Ärzte warten. Jede Lehrer*in kennt ihre Telefonnummer.", "Ärzte warten. Jeder Lehrer kennt ihre Telefonnummer."],
    ["Mehrere Lehrer warten. Jede Lehrer*in kennt ihre Telefonnummer.", "Mehrere Lehrer warten. Jeder Lehrer kennt ihre Telefonnummer."],
    ["Die Pflanzen wachsen. Jede Lehrer*in kennt ihre Telefonnummer.", "Die Pflanzen wachsen. Jeder Lehrer kennt seine Telefonnummer."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});
