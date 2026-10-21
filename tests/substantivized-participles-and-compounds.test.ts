import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Webanalyse 21.10.2026: markierte Partizipien wurden zu „Mitarbeiter:r“
// und „Studenten_r“, Komposita wie `Fachangestellte*r` blieben stehen,
// während das Paarglied daneben umgewandelt wurde, und `der/die Besucherin`
// wurde zu „der Besucherin“.
describe("markierte Partizipien", () => {
  it.each([
    ["Mitarbeitende:r gesucht", "Mitarbeiter gesucht"],
    ["Wir suchen eine:n Mitarbeitende:n", "Wir suchen einen Mitarbeiter"],
    ["Doppelposition Studierende_r und Mitarbeiter_in", "Doppelposition Student und Mitarbeiter"],
    ["Ein*e Studierende*r", "Ein Student"],
    ["mit einem/einer Studierende/n", "mit einem Studenten"],
    ["Als Bachelor-/Masterabsolvent oder Masterstudierende:r", "Als Bachelor-/Masterabsolvent oder Masterstudent"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("substantivierte Adjektive als Kompositum und mit Attribut", () => {
  it.each([
    ["Fachangestellte*r/Arzthelfer*in", "Fachangestellter/Arzthelfer"],
    ["Medizinische/r Fachangestellte/r oder Notfallsanitäter/in", "Medizinischer Fachangestellter oder Notfallsanitäter"],
    ["Medizinische Fachangestellte*r/Arzthelfer*in gesucht", "Medizinischer Fachangestellter/Arzthelfer gesucht"],
    ["Verwaltungsfachangestellte/-r und Verwaltungswirt/-in", "Verwaltungsfachangestellter und Verwaltungswirt"],
    ["Wir suchen eine:n Kaufmännische:n Angestellte:n", "Wir suchen einen Kaufmännischen Angestellten"],
    ["ein/e Medizinische/r Fachangestellte/r", "ein Medizinischer Fachangestellter"],
    ["Als Solo-Selbstständige:r", "Als Solo-Selbstständiger"],
    ["oder den Compliance Beauftragte*n", "oder den Compliance Beauftragten"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));

  it.each([
    "die Angestellte/r",
    "der Angestellte/r",
    "eine neue Angestellte*r",
    "Wir suchenAuszubildende*n",
    "Unbekannte:r"
  ])("lässt %s unverändert", (input) => expect(t(input)).toBe(input));
});

describe("Begleitwortpaar vor rein femininem Substantiv", () => {
  it.each([
    "der/die Besucherin darf alles fragen",
    "allein den/die Präsidentin der Republik",
    "der/die Ärztin"
  ])("lässt %s unverändert", (input) => expect(t(input)).toBe(input));

  it("wandelt Paare vor markierten Formen weiter um", () => {
    expect(t("der/die Bewerber/in")).toBe("der Bewerber");
  });
});
