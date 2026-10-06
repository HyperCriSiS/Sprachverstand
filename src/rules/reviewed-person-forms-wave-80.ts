import type { GeneratedPersonForms } from "./generated-person-lexicon";

// Quellenneutraler, exakt freigegebener Zusatzbestand aus Welle 80.
// Die kleine geprüfte Einzelfallwelle bleibt vollständig auf Exact-Mappings begrenzt.
const reviewedForms: ReadonlyMap<string, GeneratedPersonForms> = new Map([
  [
    "fachschaftler",
    {
      plural: "fachschaftler",
      singular: "fachschaftler",
      feminineSingular: "fachschaftlerin",
      obliqueSingular: "fachschaftler",
      genitiveSingular: "fachschaftlers"
    }
  ],
  [
    "titelhalter",
    {
      plural: "titelhalter",
      singular: "titelhalter",
      feminineSingular: "titelhalterin",
      obliqueSingular: "titelhalter",
      genitiveSingular: "titelhalters"
    }
  ],
  [
    "baron",
    {
      plural: "barone",
      singular: "baron",
      feminineSingular: "baronin",
      obliqueSingular: "baron",
      genitiveSingular: "barons"
    }
  ],
  [
    "bergkamerad",
    {
      plural: "bergkameraden",
      singular: "bergkamerad",
      feminineSingular: "bergkameradin",
      obliqueSingular: "bergkameraden",
      genitiveSingular: "bergkameraden"
    }
  ],
  [
    "diplomgeograph",
    {
      plural: "diplomgeographen",
      singular: "diplomgeograph",
      feminineSingular: "diplomgeographin",
      obliqueSingular: "diplomgeographen",
      genitiveSingular: "diplomgeographen"
    }
  ],
  [
    "ehrensenator",
    {
      plural: "ehrensenatoren",
      singular: "ehrensenator",
      feminineSingular: "ehrensenatorin",
      obliqueSingular: "ehrensenator",
      genitiveSingular: "ehrensenators"
    }
  ],
  [
    "familienernährer",
    {
      plural: "familienernährer",
      singular: "familienernährer",
      feminineSingular: "familienernährerin",
      obliqueSingular: "familienernährer",
      genitiveSingular: "familienernährers"
    }
  ],
  [
    "fcsp-teqballer",
    {
      plural: "fcsp-teqballer",
      singular: "fcsp-teqballer",
      feminineSingular: "fcsp-teqballerin",
      obliqueSingular: "fcsp-teqballer",
      genitiveSingular: "fcsp-teqballers"
    }
  ],
  [
    "föderalist",
    {
      plural: "föderalisten",
      singular: "föderalist",
      feminineSingular: "föderalistin",
      obliqueSingular: "föderalisten",
      genitiveSingular: "föderalisten"
    }
  ],
  [
    "knüpfer",
    {
      plural: "knüpfer",
      singular: "knüpfer",
      feminineSingular: "knüpferin",
      obliqueSingular: "knüpfer",
      genitiveSingular: "knüpfers"
    }
  ],
  [
    "stadtzürcher",
    {
      plural: "stadtzürcher",
      singular: "stadtzürcher",
      feminineSingular: "stadtzürcherin",
      obliqueSingular: "stadtzürcher",
      genitiveSingular: "stadtzürchers"
    }
  ],
  [
    "superintendent",
    {
      plural: "superintendenten",
      singular: "superintendent",
      feminineSingular: "superintendentin",
      obliqueSingular: "superintendenten",
      genitiveSingular: "superintendenten"
    }
  ],
  [
    "teufel",
    {
      plural: "teufel",
      singular: "teufel",
      feminineSingular: "teufelin",
      obliqueSingular: "teufel",
      genitiveSingular: "teufels"
    }
  ],
  [
    "uigur",
    {
      plural: "uiguren",
      singular: "uigure",
      feminineSingular: "uigurin",
      obliqueSingular: "uiguren",
      genitiveSingular: "uiguren"
    }
  ]
]);

export const reviewedPersonFormCountWave80 = reviewedForms.size;

export function getReviewedPersonFormsWave80(
  normalizedBase: string
): GeneratedPersonForms | undefined {
  return reviewedForms.get(normalizedBase);
}
