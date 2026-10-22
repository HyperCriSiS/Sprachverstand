import type { GeneratedPersonForms } from "./generated-person-lexicon";

// Quellenneutraler, exakt freigegebener Zusatzbestand aus Welle 73.
// Die Formen sind explizit hinterlegt; daraus wird keine generische Suffixregel abgeleitet.
const reviewedForms: ReadonlyMap<string, GeneratedPersonForms> = new Map([
  [
    "ankerwickler",
    {
      plural: "ankerwickler",
      singular: "ankerwickler",
      feminineSingular: "ankerwicklerin",
      obliqueSingular: "ankerwickler",
      genitiveSingular: "ankerwicklers"
    }
  ],
  [
    "elektromaschinenwickler",
    {
      plural: "elektromaschinenwickler",
      singular: "elektromaschinenwickler",
      feminineSingular: "elektromaschinenwicklerin",
      obliqueSingular: "elektromaschinenwickler",
      genitiveSingular: "elektromaschinenwicklers"
    }
  ],
  [
    "elektromotorenwickler",
    {
      plural: "elektromotorenwickler",
      singular: "elektromotorenwickler",
      feminineSingular: "elektromotorenwicklerin",
      obliqueSingular: "elektromotorenwickler",
      genitiveSingular: "elektromotorenwicklers"
    }
  ],
  [
    "elektrowickler",
    {
      plural: "elektrowickler",
      singular: "elektrowickler",
      feminineSingular: "elektrowicklerin",
      obliqueSingular: "elektrowickler",
      genitiveSingular: "elektrowicklers"
    }
  ],
  [
    "heizfadenwickler",
    {
      plural: "heizfadenwickler",
      singular: "heizfadenwickler",
      feminineSingular: "heizfadenwicklerin",
      obliqueSingular: "heizfadenwickler",
      genitiveSingular: "heizfadenwicklers"
    }
  ],
  [
    "heizspiralenwickler",
    {
      plural: "heizspiralenwickler",
      singular: "heizspiralenwickler",
      feminineSingular: "heizspiralenwicklerin",
      obliqueSingular: "heizspiralenwickler",
      genitiveSingular: "heizspiralenwicklers"
    }
  ],
  [
    "metallschlauchwickler",
    {
      plural: "metallschlauchwickler",
      singular: "metallschlauchwickler",
      feminineSingular: "metallschlauchwicklerin",
      obliqueSingular: "metallschlauchwickler",
      genitiveSingular: "metallschlauchwicklers"
    }
  ],
  [
    "motorenwickler",
    {
      plural: "motorenwickler",
      singular: "motorenwickler",
      feminineSingular: "motorenwicklerin",
      obliqueSingular: "motorenwickler",
      genitiveSingular: "motorenwicklers"
    }
  ],
  [
    "reifenwickler",
    {
      plural: "reifenwickler",
      singular: "reifenwickler",
      feminineSingular: "reifenwicklerin",
      obliqueSingular: "reifenwickler",
      genitiveSingular: "reifenwicklers"
    }
  ],
  [
    "spulenwickler",
    {
      plural: "spulenwickler",
      singular: "spulenwickler",
      feminineSingular: "spulenwicklerin",
      obliqueSingular: "spulenwickler",
      genitiveSingular: "spulenwicklers"
    }
  ],
  [
    "transformatorenwickler",
    {
      plural: "transformatorenwickler",
      singular: "transformatorenwickler",
      feminineSingular: "transformatorenwicklerin",
      obliqueSingular: "transformatorenwickler",
      genitiveSingular: "transformatorenwicklers"
    }
  ]
]);

export const reviewedPersonFormCountWave73 = reviewedForms.size;

export function getReviewedPersonFormsWave73(
  normalizedBase: string
): GeneratedPersonForms | undefined {
  return reviewedForms.get(normalizedBase);
}
