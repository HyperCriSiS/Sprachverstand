import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Unabhängige Gegenprüfung von Codex, 23.10.2026 (artifacts/gegenpruefung-20261023).
describe("Kasus aus dem Satzbau (N04)", () => {
  it.each([
    // Kopula am Satzende: Prädikativ.
    ["Wir wissen, dass er die Ärzt*in ist.", "Wir wissen, dass er der Arzt ist."],
    ["Wir wissen, dass der Nachbar eine Lehrer*in ist.", "Wir wissen, dass der Nachbar ein Lehrer ist."],
    ["Wir sehen, dass er eine Lehrer*in genannt wird.", "Wir sehen, dass er ein Lehrer genannt wird."],
    // Futur mit Zeitangabe vor dem Infinitiv.
    ["Sie wird die Ärzt*in am Montag anrufen.", "Sie wird den Arzt am Montag anrufen."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));

  it.each([
    // Eine maskuline Person danach kann selbst Subjekt sein.
    "Heute besucht die Ärzt*in der Patient.",
    "Die Ärzt*in besucht der Patient.",
    "Wir wissen, dass die Ärzt*in der Patient besucht."
  ])("bleibt: %s", (input) => expect(t(input)).toBe(input));
});

describe("Genitiv vor Dativverb (N05)", () => {
  it.each([
    ["Das Haus der Lehrer*in gehört dem Staat.", "Das Haus des Lehrers gehört dem Staat."],
    ["Das Buch einer Lehrer*in gehört mir.", "Das Buch eines Lehrers gehört mir."],
    ["Die Arbeit ihrer Künstler*in untersteht dem Museum.", "Die Arbeit ihres Künstlers untersteht dem Museum."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Abkürzungen und mehrteilige Attribute (N06, R01, V02)", () => {
  it.each([
    ["Wir suchen eine hauptamtl. Lehrer*in.", "Wir suchen einen hauptamtl. Lehrer."],
    ["Wir suchen eine z. B. erfahrene Lehrer*in.", "Wir suchen einen z. B. erfahrenen Lehrer."],
    ["Wir suchen die ggf. neue Lehrer*in.", "Wir suchen den ggf. neuen Lehrer."],
    ["Wir suchen eine Dipl.-Psych. Lehrer*in.", "Wir suchen einen Dipl.-Psych. Lehrer."],
    ["Sie ist die erste und bisher einzige deutsche Künstler:in, die dort veröffentlichte.",
      "Sie ist der erste und bisher einzige deutsche Künstler, der dort veröffentlichte."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Weitere eindeutige Satzformen (R01, R03)", () => {
  it.each([
    ["Die Ärzt*in besuche ich.", "Den Arzt besuche ich."],
    ["Wir hoffen, eine Ärzt*in werde eingeladen.", "Wir hoffen, ein Arzt werde eingeladen."],
    ["Das ist der Mann, der eine Ärzt*in ist.", "Das ist der Mann, der ein Arzt ist."],
    ["Die Ärzt*in kontaktieren", "Den Arzt kontaktieren"],
    ["Die Künstler*in, die dort arbeitet, kommt.", "Der Künstler, der dort arbeitet, kommt."],
    ["Wir wissen, eine Ärzt*in sollte zu helfen beginnen.", "Wir wissen, ein Arzt sollte zu helfen beginnen."],
    ["In vielen Fällen veranlasst die Ärzt*in auch ein Röntgenbild.", "In vielen Fällen veranlasst der Arzt auch ein Röntgenbild."],
    ["Wenn es von eine*r Patient*in nicht genutzt wurde, da diese*r frisch entlassen wurde",
      "Wenn es von einem Patienten nicht genutzt wurde, da dieser frisch entlassen wurde"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Kurzformen mit Kontext (N08, N09)", () => {
  it.each([
    ["Wahl de:r Schatzmeister:in", "Wahl des Schatzmeisters"],
    ["bestehend aus je eine:r Hundeführer:in, eine:r SAR-Helfer:in und einem Rettungshund",
      "bestehend aus je einem Hundeführer, einem SAR-Helfer und einem Rettungshund"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Titel nicht halb umwandeln (N10)", () => {
  it.each([
    "das Zertifikat »Studentische/-r OP Assistent/-in« der Arbeitsgruppe",
    "Für die Qualifikation zur/zum EnergieauditorIn (§ 44 EEffG)",
    "Die Ausbildung zur Manual Therapeut*in nach dem Konzept"
  ])("bleibt: %s", (input) => expect(t(input)).toBe(input));
});
