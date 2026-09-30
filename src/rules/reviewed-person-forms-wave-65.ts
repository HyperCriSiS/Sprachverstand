import type { GeneratedPersonForms } from "./generated-person-lexicon";

// Quellenneutraler, exakt freigegebener Zusatzbestand aus Welle 65.
// Die Menge ist eine reine Allow-List und erzeugt keine generische Suffixfreigabe.
const pluralEForms: ReadonlySet<string> = new Set([
  "registrar",
  "substitut"
]);

export const reviewedPersonFormCountWave65 = pluralEForms.size;

function regularForms(
  base: string,
  plural: string
): GeneratedPersonForms {
  return {
    plural,
    singular: base,
    feminineSingular: `${base}in`,
    obliqueSingular: base,
    genitiveSingular: `${base}s`
  };
}

export function getReviewedPersonFormsWave65(
  normalizedBase: string
): GeneratedPersonForms | undefined {
  if (pluralEForms.has(normalizedBase)) {
    return regularForms(normalizedBase, `${normalizedBase}e`);
  }

  return undefined;
}
