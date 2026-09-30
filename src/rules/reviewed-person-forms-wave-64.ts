import type { GeneratedPersonForms } from "./generated-person-lexicon";

// Quellenneutraler, exakt freigegebener Zusatzbestand aus Welle 64.
// Die Mengen sind reine Allow-Lists und erzeugen keine generische Suffixfreigabe.
const unchangedForms: ReadonlySet<string> = new Set([
  "ankerschließer",
  "bauabrechner",
  "betriebsabrechner",
  "gehaltsabrechner",
  "kostenabrechner",
  "landkartenaufzieher",
  "lohnabrechner",
  "minibar-checker",
  "stanzmaschineneinsteller",
  "tierkörperverwerter",
  "tuftingwarennachseher",
  "verpflegungsautomatenauffüller",
  "verpflegungsautomatenbefüller",
  "viehtreiber",
  "warenbereitsteller",
  "webgutnachseher",
  "zigarettenautomatenauffüller",
  "zigarettenautomatenbefüller"
]);

const pluralEForms: ReadonlySet<string> = new Set([
  "museumsregistrar",
  "warenhandelssubstitut"
]);

export const reviewedPersonFormCountWave64 =
  unchangedForms.size + pluralEForms.size;

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

export function getReviewedPersonFormsWave64(
  normalizedBase: string
): GeneratedPersonForms | undefined {
  if (unchangedForms.has(normalizedBase)) {
    return regularForms(normalizedBase, normalizedBase);
  }

  if (pluralEForms.has(normalizedBase)) {
    return regularForms(normalizedBase, `${normalizedBase}e`);
  }

  return undefined;
}
