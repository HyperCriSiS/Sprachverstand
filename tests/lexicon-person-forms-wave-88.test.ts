import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import { mapMappedSingular, mapMappedSingularPair } from "../src/rules/person-lexicon";
import {
  getReviewedPersonFormsWave88,
  reviewedPersonFormCountWave88
} from "../src/rules/reviewed-person-forms-wave-88";

// Die Positivfälle sind bewusst unabhängig vom Set des Produktmoduls.
const basen = [
  "agilolfinger",
  "altlutheraner",
  "anglikaner",
  "augustiner",
  "ausreisser",
  "aussendienstler",
  "aussenseiter",
  "austronesier",
  "bader",
  "bärenhäuter",
  "bauernbündler",
  "belagerer",
  "benützer",
  "bethlehemer",
  "bismarckverehrer",
  "burgunder",
  "cartesianer",
  "chaldäer",
  "chatter",
  "dragoner",
  "ekstatiker",
  "enddreissiger",
  "endzwanziger",
  "esser",
  "fresser",
  "frömmler",
  "fussballer",
  "geniesser",
  "giesser",
  "grabscher",
  "graphiker",
  "instinktfussballer",
  "kärrner",
  "kliniker",
  "klugscheisser",
  "kokainschmuggler",
  "kokapflanzer",
  "kokser",
  "komatrinker",
  "kugelstosser",
  "lateiner",
  "linksfüssler",
  "linkshegelianer",
  "mässigkeitsvereinsstifter",
  "mittdreissiger",
  "mittfünfziger",
  "mittvierziger",
  "mittzwanziger",
  "nazarener",
  "nestorianer",
  "neutestamentler",
  "nutzniesser",
  "presbyter",
  "rausschmeisser",
  "romulaner",
  "rossschlachter",
  "sachsenkaiser",
  "schliesser",
  "schweisser",
  "shanghaier",
  "spassverderber",
  "spiesser",
  "staufer",
  "talibankämpfer",
  "vieltelephonierer",
  "vulkanier",
  "wandrer",
  "weichensteller",
  "weissager",
  "weissgerber",
  "zotenreisser"
] as const;

const negativeBasen = [
  "arbeitsnehmer",
  "aussenamtsspecher",
  "auslöser",
  "bernhardiner",
  "bestseller",
  "bettwärmer",
  "erreger",
  "hammer",
  "konsortiumsmitglieder",
  "lipizzaner",
  "ober",
  "stapler",
  "trojaner",
  "umschalter",
  "verstärker",
  "zähler",
  "zünder",
  "öffner",
  "aussenseiterfirma"
] as const;

describe("Lexikon-Welle 88: Abschluss der sicheren Hunspell-Restformen", () => {
  it("enthält exakt 71 eindeutige und getrennt geprüfte Personenbasen", () => {
    expect(basen).toHaveLength(71);
    expect(new Set(basen).size).toBe(71);
    expect(reviewedPersonFormCountWave88).toBe(71);
  });

  it.each(basen)("prüft %s auf Plural, Singular, Femininform, Paar und Kasus", (basis) => {
    const feminin = `${basis}in`;
    expect(getReviewedPersonFormsWave88(basis)).toEqual({
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

  it.each(negativeBasen)("ändert die nicht freigegebene Basis %s nicht über dieses Modul", (basis) => {
    expect(getReviewedPersonFormsWave88(basis)).toBeUndefined();
  });

  it("lässt unmarkierten Text und unbekannte Komposita unverändert", () => {
    expect(mappedPluralSeparatorsRule.apply("Anglikaner")).toEqual({
      text: "Anglikaner",
      replacements: 0
    });
    expect(getReviewedPersonFormsWave88("anglikanergruppe")).toBeUndefined();
  });
});
