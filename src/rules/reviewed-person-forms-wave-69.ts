import type { GeneratedPersonForms } from "./generated-person-lexicon";

// Quellenneutraler, exakt freigegebener Zusatzbestand aus Welle 69.
// Die Formen sind explizit hinterlegt; daraus wird keine generische Suffixregel abgeleitet.
const reviewedForms: ReadonlyMap<string, GeneratedPersonForms> = new Map([
  [
    "logenschließer",
    {
      plural: "logenschließer",
      singular: "logenschließer",
      feminineSingular: "logenschließerin",
      obliqueSingular: "logenschließer",
      genitiveSingular: "logenschließers"
    }
  ],
  [
    "mikrograf",
    {
      plural: "mikrografen",
      singular: "mikrograf",
      feminineSingular: "mikrografin",
      obliqueSingular: "mikrografen",
      genitiveSingular: "mikrografen"
    }
  ],
  [
    "perforatortaster",
    {
      plural: "perforatortaster",
      singular: "perforatortaster",
      feminineSingular: "perforatortasterin",
      obliqueSingular: "perforatortaster",
      genitiveSingular: "perforatortasters"
    }
  ],
  [
    "süßmoster",
    {
      plural: "süßmoster",
      singular: "süßmoster",
      feminineSingular: "süßmosterin",
      obliqueSingular: "süßmoster",
      genitiveSingular: "süßmosters"
    }
  ],
  [
    "wertpapierabwickler",
    {
      plural: "wertpapierabwickler",
      singular: "wertpapierabwickler",
      feminineSingular: "wertpapierabwicklerin",
      obliqueSingular: "wertpapierabwickler",
      genitiveSingular: "wertpapierabwicklers"
    }
  ]
]);

export const reviewedPersonFormCountWave69 = reviewedForms.size;

export function getReviewedPersonFormsWave69(
  normalizedBase: string
): GeneratedPersonForms | undefined {
  return reviewedForms.get(normalizedBase);
}
