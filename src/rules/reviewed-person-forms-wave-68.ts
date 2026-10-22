import type { GeneratedPersonForms } from "./generated-person-lexicon";

// Quellenneutraler, exakt freigegebener Zusatzbestand aus Welle 68.
// Die Formen sind explizit hinterlegt; daraus wird keine generische Suffixregel abgeleitet.
const reviewedForms: ReadonlyMap<string, GeneratedPersonForms> = new Map([
  [
    "kettler",
    {
      plural: "kettler",
      singular: "kettler",
      feminineSingular: "kettlerin",
      obliqueSingular: "kettler",
      genitiveSingular: "kettlers"
    }
  ],
  [
    "moster",
    {
      plural: "moster",
      singular: "moster",
      feminineSingular: "mosterin",
      obliqueSingular: "moster",
      genitiveSingular: "mosters"
    }
  ]
]);

export const reviewedPersonFormCountWave68 = reviewedForms.size;

export function getReviewedPersonFormsWave68(
  normalizedBase: string
): GeneratedPersonForms | undefined {
  return reviewedForms.get(normalizedBase);
}
