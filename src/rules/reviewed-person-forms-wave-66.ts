import type { GeneratedPersonForms } from "./generated-person-lexicon";

// Quellenneutraler, exakt freigegebener Zusatzbestand aus Welle 66.
// Jede Form ist explizit hinterlegt; daraus wird keine generische Suffixregel abgeleitet.
const reviewedForms: ReadonlyMap<string, GeneratedPersonForms> = new Map([
  [
    "choralmagister",
    {
      plural: "choralmagister",
      singular: "choralmagister",
      feminineSingular: "choralmagisterin",
      obliqueSingular: "choralmagister",
      genitiveSingular: "choralmagisters"
    }
  ],
  [
    "countertenor",
    {
      plural: "countertenöre",
      singular: "countertenor",
      feminineSingular: "countertenorin",
      obliqueSingular: "countertenor",
      genitiveSingular: "countertenors"
    }
  ],
  [
    "generalkonsul",
    {
      plural: "generalkonsuln",
      singular: "generalkonsul",
      feminineSingular: "generalkonsulin",
      obliqueSingular: "generalkonsul",
      genitiveSingular: "generalkonsuls"
    }
  ],
  [
    "jollen-instructor",
    {
      plural: "jollen-instructoren",
      singular: "jollen-instructor",
      feminineSingular: "jollen-instructorin",
      obliqueSingular: "jollen-instructor",
      genitiveSingular: "jollen-instructors"
    }
  ],
  [
    "profiler",
    {
      plural: "profiler",
      singular: "profiler",
      feminineSingular: "profilerin",
      obliqueSingular: "profiler",
      genitiveSingular: "profilers"
    }
  ]
]);

export const reviewedPersonFormCountWave66 = reviewedForms.size;

export function getReviewedPersonFormsWave66(
  normalizedBase: string
): GeneratedPersonForms | undefined {
  return reviewedForms.get(normalizedBase);
}
