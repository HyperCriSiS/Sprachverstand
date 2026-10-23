import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Gegenprüfung 24.10.2026, N10: Titel mit Präpositionspaar, Lehnadjektiv und Großadjektiv.
describe("Titel (N10)", () => {
  it.each([
    ["Für die Qualifikation zur/zum EnergieauditorIn und EnergieberaterIn (§ 44 EEffG) bringt",
      "Für die Qualifikation zum Energieauditor und Energieberater (§ 44 EEffG) bringt"],
    ["Für die Qualifikation zur/zum Energieauditor*in bringt", "Für die Qualifikation zum Energieauditor bringt"],
    ["Die Ausbildung zur Manual Therapeut*in nach dem Konzept", "Die Ausbildung zum Manual Therapeuten nach dem Konzept"],
    ["das Zertifikat »Studentische/-r OP Assistent/-in« der Arbeitsgruppe",
      "das Zertifikat »Studentischer OP Assistent« der Arbeitsgruppe"],
    ["bzw. als Medizinisch-technische*n Assistent*in (m/w/d/x) für Radiologie",
      "bzw. als Medizinisch-technischen Assistenten (m/w/d/x) für Radiologie"],
    ["Medizinisch-technische:n Laborassistent:in (MTA-L)", "Medizinisch-technischen Laborassistenten (MTA-L)"],
    ["Wir suchen engagierte:n Elementarpädagog:in.", "Wir suchen engagierten Elementarpädagogen."],
    ["Das Gutachten des Auditor*in", "Das Gutachten des Auditors"],
    // Das Paar mit deutschem Adjektiv bleibt bei der bestehenden Paarregel.
    ["Auszubildende zum/zur Medizinischen Technologe*in für Radiologie",
      "Auszubildende zum Medizinischen Technologen für Radiologie"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Kurzform-Adjektive ohne Begleitwort", () => {
  it.each([
    ["Wir suchen aufgeschlossene*n, verantwortungsbewusste*n und engagierte*n Mitarbeiter*in.",
      "Wir suchen aufgeschlossenen, verantwortungsbewussten und engagierten Mitarbeiter."],
    ["Du bist erste/r und letzte/r Ansprechpartner/in für die Patienten.",
      "Du bist erster und letzter Ansprechpartner für die Patienten."],
    ["Medizinische:r Fachangestellte:r oder Medizinisch-Technische:r Assistent:in",
      "Medizinischer Fachangestellter oder Medizinisch-Technischer Assistent"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));

  it.each([
    // Nach Dativpräposition wäre die maskuline Form „-em“.
    "mit engagierte*n Mitarbeiter*in",
    // Das Präpositionspaar davor bleibt sonst halb.
    "Zeugnisse zum*zur \"Staatlich geprüfte*n Techniker*in\""
  ])("bleibt: %s", (input) => expect(t(input)).toBe(input));
});
