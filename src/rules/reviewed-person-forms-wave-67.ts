import type { GeneratedPersonForms } from "./generated-person-lexicon";

// Quellenneutraler, exakt freigegebener Zusatzbestand aus Welle 67.
// Die Form ist explizit hinterlegt; daraus wird keine generische Suffixregel abgeleitet.
const reviewedForms: ReadonlyMap<string, GeneratedPersonForms> = new Map([
  [
    "archäometer",
    {
      plural: "archäometer",
      singular: "archäometer",
      feminineSingular: "archäometerin",
      obliqueSingular: "archäometer",
      genitiveSingular: "archäometers"
    }
  ]
]);

export const reviewedPersonFormCountWave67 = reviewedForms.size;

export function getReviewedPersonFormsWave67(
  normalizedBase: string
): GeneratedPersonForms | undefined {
  return reviewedForms.get(normalizedBase);
}
