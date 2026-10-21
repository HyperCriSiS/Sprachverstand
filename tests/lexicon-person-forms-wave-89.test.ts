import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import { mapMappedSingular, mapMappedSingularPair } from "../src/rules/person-lexicon";
import {
  getReviewedPersonFormsWave89,
  reviewedPersonFormCountWave89
} from "../src/rules/reviewed-person-forms-wave-89";

// Unabhängig ausgeschriebene Testbasen für die kontrollierte Erweiterung.
const basen = [
  "asbestsanierer",
  "asphaltkocher",
  "bergwerksretter",
  "deckenverkleider",
  "düngemittelmischer",
  "einbalsamierer",
  "faserplattenpresser",
  "firnissieder",
  "flugzeugeinwinker",
  "forstaufseher",
  "furnierklassierer",
  "garnspinner",
  "geflügelfänger",
  "geflügelgeschlechtsbestimmer",
  "gewürzmischer",
  "holzklassierer",
  "immobilienschätzer",
  "isolierschlauchwickler",
  "kalkbrenner",
  "kameraschwenker",
  "keilriemengummierer",
  "latexschäumer",
  "ledersortierer",
  "lederwarenverpacker",
  "lokalisierer",
  "markscheider",
  "maschinenfeiler",
  "maschinenwäscher",
  "nahrungsmittelklassierer",
  "ordnungshüter",
  "produktklassierer",
  "rohrnetzinstandhalter",
  "sandstrahler",
  "schallplattenpresser",
  "schiefermischer",
  "schiffsschlosser",
  "schüttgutfüller",
  "seifenpresser",
  "seifensieder",
  "spirituosenmischer",
  "stauer",
  "tablettenpresser",
  "takler",
  "textilspinner",
  "tierhäutesortierer",
  "tiersitter",
  "tonbrenner",
  "vlogger",
  "volkswirtschaftler",
  "wachsbleicher",
  "wäschereiaufseher",
  "zellstoffklassierer",
  "zellstoffkocher"
] as const;

describe("Lexikon-Welle 89: exakt geprüfte reguläre Personenbasen", () => {
  it("enthält ausschließlich eindeutige Basen", () => {
    expect(new Set(basen).size).toBe(basen.length);
    expect(reviewedPersonFormCountWave89).toBe(basen.length);
  });

  it.each(basen)("prüft %s für markierten Plural, Singular, Paar und Kasus", (basis) => {
    const feminin = `${basis}in`;
    expect(getReviewedPersonFormsWave89(basis)).toEqual({
      plural: basis,
      singular: basis,
      feminineSingular: feminin,
      obliqueSingular: basis,
      genitiveSingular: `${basis}s`
    });
    expect(mappedPluralSeparatorsRule.apply(`${basis}:innen`)).toEqual({
      text: basis,
      replacements: 1
    });
    expect(mapMappedSingularPair(basis, feminin)).toBe(basis);
    expect(mapMappedSingularPair(feminin, basis)).toBe(basis);
    for (const kasus of ["nominative", "accusative", "dative"] as const) {
      expect(mapMappedSingular(basis, kasus)).toBe(basis);
    }
    expect(mapMappedSingular(basis, "genitive")).toBe(`${basis}s`);
  });

  it.each(["general", "konsul", "graf", "reifenvulkaniseur", "tierhäutesortiererfirma", "forstaufseherteam"])(
    "gibt für nicht freigegebene exakte Basis %s keinen Treffer zurück",
    (basis) => {
      expect(getReviewedPersonFormsWave89(basis)).toBeUndefined();
    }
  );

  it("lässt unmarkierte Schreibweise unangetastet", () => {
    expect(mappedPluralSeparatorsRule.apply("Der Forstaufseher arbeitet hier.")).toEqual({
      text: "Der Forstaufseher arbeitet hier.",
      replacements: 0
    });
  });
});
