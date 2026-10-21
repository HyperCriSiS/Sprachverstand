import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";
import { disabledRuleIdsForGroups, ruleGroupDefinitions } from "../src/rules/catalog";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Webanalyse 21.10.2026, zweite Tranche: alle offenen markierten
// Personenbezeichnungen, einzeln geprüft. Ein Stammeintrag deckt alle
// Markerformen, Singular, Plural und Kasus ab.
describe("Lexikontranche 2 der Webanalyse", () => {
  it.each([
    // Regelmäßige Bildungen und Markerformen.
    ["Die Kurzfilmer*innen zeigen", "Die Kurzfilmer zeigen"],
    ["mit Kurzfilmer:innen", "mit Kurzfilmern"],
    ["KurzfilmerInnen", "Kurzfilmer"],
    ["ein:e Kurzfilmer:in", "ein Kurzfilmer"],
    ["Deserteur*innen", "Deserteure"],
    ["mit Agitator:innen", "mit Agitatoren"],
    ["die Imperialist:innen", "die Imperialisten"],
    ["Flexitarier:innen", "Flexitarier"],
    // Schwache Nomen auf -e als Kompositumskopf.
    ["Die Sprachpat*innen treffen sich.", "Die Sprachpaten treffen sich."],
    ["mit unseren Gesundheitslots*innen", "mit unseren Gesundheitslotsen"],
    ["als Opferzeug*innen", "als Opferzeugen"],
    // Umlautstamm Bauer und Bauer-Komposita mit Plural -n.
    ["für Kakaobäuer*innen", "für Kakaobauern"],
    ["Die Kleinbauer*innen kämpfen.", "Die Kleinbauern kämpfen."],
    // Gruppen- und Herkunftsbezeichnungen.
    ["die Jesid:innen und Ezid*innen", "die Jesiden und Eziden"],
    ["Jud:innen und Nichtjud:innen", "Juden und Nichtjuden"],
    ["die Sunnit*innen", "die Sunniten"],
    ["die Aarauer*innen", "die Aarauer"],
    // Abweichende Stämme und Plurale.
    ["Die Vormund:innen beraten.", "Die Vormünder beraten."],
    ["Verfahrensbeiständ*innen", "Verfahrensbeistände"],
    ["Meisterköch*innen", "Meisterköche"],
    // Genitiv-s vor dem Marker.
    ["des/der Herstellers/in", "des Herstellers"],
    // Ausgangsschreibweisen werden entgendert, nicht korrigiert.
    ["Die Ansprechparter*innen sind erreichbar.", "Die Ansprechparter sind erreichbar."],
    ["Die Mitglieder*innen stimmen ab.", "Die Mitglieder stimmen ab."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));

  it.each([
    // Keine Personenformen.
    ["noch im Kinderwagen/in der Trage", "noch im Kinderwagen/in der Trage"],
    ["im Browser/in der App lesen", "im Browser/in der App lesen"],
    ["Bally_schliesst_die_letzte_Fabrik_in_der_Schweiz.pdf", "Bally_schliesst_die_letzte_Fabrik_in_der_Schweiz.pdf"],
    // Eigennamen bleiben.
    ["die RosaLila PantherInnen", "die RosaLila PantherInnen"],
    // Normale Feminina bleiben.
    ["die Kurzfilmerinnen", "die Kurzfilmerinnen"],
    ["die Sprachpatinnen", "die Sprachpatinnen"]
  ])("bleibt: %s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Regelgruppe Englische Lehnwörter", () => {
  const enabledWithout = ruleGroupDefinitions
    .filter((group) => group.defaultEnabled && group.id !== "loanword-person-terms")
    .map((group) => group.id);
  const disabledRuleIds = disabledRuleIdsForGroups(enabledWithout);
  const withoutLoanwords = (input: string) =>
    transformText(input, defaultRules, { profile: "aggressive", disabledRuleIds }).text;

  it.each([
    ["Maker:innen", "Maker"],
    ["als Researcher*in", "als Researcher"],
    ["mit Creator*innen", "mit Creators"],
    ["Organizer*innen", "Organizer"]
  ])("wandelt %s um", (input, expected) => expect(t(input)).toBe(expected));

  it("bleibt abgeschaltet unverändert, das übrige Lexikon wirkt weiter", () => {
    expect(withoutLoanwords("Maker:innen und Kurzfilmer*innen"))
      .toBe("Maker:innen und Kurzfilmer");
    expect(t("Maker:innen und Kurzfilmer*innen")).toBe("Maker und Kurzfilmer");
  });
});
