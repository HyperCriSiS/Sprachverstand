export interface GeneratedPersonForms {
  readonly plural: string;
  readonly singular?: string;
  readonly feminineSingular?: string;
  readonly obliqueSingular?: string;
  readonly genitiveSingular?: string;
}

// Diese Datei wird von scripts/compile-person-lexicon.mjs erzeugt.
// Der Rohdatenbestand bleibt außerhalb des Repositorys; hier stehen nur
// normalisierte, geprüfte Produktdaten.
const generatedPersonForms: Readonly<Record<string, GeneratedPersonForms>> =
  Object.freeze({});

export const generatedPersonFormCount = Object.keys(generatedPersonForms).length;

export function getGeneratedPersonForms(
  normalizedBase: string
): GeneratedPersonForms | undefined {
  return generatedPersonForms[normalizedBase];
}
