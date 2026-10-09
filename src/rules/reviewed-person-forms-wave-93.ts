import type { GeneratedPersonForms } from "./generated-person-lexicon";

// Eigenständig geprüfte, ausschließlich exakte Personenbasen der Welle 93.
const unverändertePluralbasen = new Set(["instandhalter", "maschinenbediener"]);

export function getReviewedPersonFormsWave93(normalizedBase: string): GeneratedPersonForms | undefined {
  if (!unverändertePluralbasen.has(normalizedBase)) return undefined;
  return {
    plural: normalizedBase,
    singular: normalizedBase,
    genitiveSingular: `${normalizedBase}s`
  };
}
