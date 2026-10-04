import type { GeneratedPersonForms } from "./generated-person-lexicon";

// Quellenneutraler, exakt freigegebener Zusatzbestand aus Welle 76.
// Die Formen sind explizit hinterlegt; daraus wird keine generische Suffixregel abgeleitet.
const reviewedForms: ReadonlyMap<string, GeneratedPersonForms> = new Map([
  [
    "eri-wart",
    {
      plural: "eri-warte",
      singular: "eri-wart",
      feminineSingular: "eri-wartin",
      obliqueSingular: "eri-wart",
      genitiveSingular: "eri-warts"
    }
  ],
  [
    "eutonist",
    {
      plural: "eutonisten",
      singular: "eutonist",
      feminineSingular: "eutonistin",
      obliqueSingular: "eutonisten",
      genitiveSingular: "eutonisten"
    }
  ],
  [
    "fennist",
    {
      plural: "fennisten",
      singular: "fennist",
      feminineSingular: "fennistin",
      obliqueSingular: "fennisten",
      genitiveSingular: "fennisten"
    }
  ],
  [
    "monitor",
    {
      plural: "monitore",
      singular: "monitor",
      feminineSingular: "monitorin",
      obliqueSingular: "monitor",
      genitiveSingular: "monitors"
    }
  ],
  [
    "vermessinger",
    {
      plural: "vermessinger",
      singular: "vermessinger",
      feminineSingular: "vermessingerin",
      obliqueSingular: "vermessinger",
      genitiveSingular: "vermessingers"
    }
  ]
]);

export const reviewedPersonFormCountWave76 = reviewedForms.size;

export function getReviewedPersonFormsWave76(
  normalizedBase: string
): GeneratedPersonForms | undefined {
  return reviewedForms.get(normalizedBase);
}
