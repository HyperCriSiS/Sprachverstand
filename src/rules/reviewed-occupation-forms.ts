import type { GeneratedPersonForms } from "./generated-person-lexicon";

// Exakte geprüfte Berufsbezeichnungen und Schreibvarianten. Keine allgemeine
// ß/ss-Normalisierung: Schreibweise und Flexion bleiben am jeweiligen Eintrag.
const variants: ReadonlyMap<string, readonly [plural: string, weak: boolean]> = new Map([
  ["berufsfußballer", ["berufsfußballer", false]],
  ["fertigungsmodelleur", ["fertigungsmodelleure", false]],
  ["fußjongleur", ["fußjongleure", false]],
  ["greißler", ["greißler", false]],
  ["heißfoliendrucker", ["heißfoliendrucker", false]],
  ["marketer", ["marketer", false]],
  ["profifußballer", ["profifußballer", false]],
  ["straßenartist", ["straßenartisten", true]],
  ["straßenfeger", ["straßenfeger", false]],
  ["verschleißer", ["verschleißer", false]]
]);

export function getReviewedOccupationForms(normalizedBase: string): GeneratedPersonForms | undefined {
  const variant = variants.get(normalizedBase);
  if (!variant) return undefined;
  const [plural, weak] = variant;
  return {
    plural,
    singular: normalizedBase,
    feminineSingular: `${normalizedBase}in`,
    obliqueSingular: weak ? plural : normalizedBase,
    genitiveSingular: weak ? plural : `${normalizedBase}s`
  };
}