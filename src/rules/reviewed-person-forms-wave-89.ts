import type { GeneratedPersonForms } from "./generated-person-lexicon";

// Eigenständig geprüfte Personenbasen mit unverändertem Plural und regulärer Femininform.
// Ausschließlich exakte Treffer, keine Ableitung allgemeiner Wortendungen.
const personenbasen: ReadonlySet<string> = new Set([
  "asbestsanierer",
  "asphaltkocher",
  "bergwerksretter",
  "deckenverkleider",
  "düngemittelmischer",
  "einbalsamierer",
  "faserplattenpresser",
  "firnissieder",
  "flugzeugeinwinker",
  "forstaufseher",
  "furnierklassierer",
  "garnspinner",
  "geflügelfänger",
  "geflügelgeschlechtsbestimmer",
  "gewürzmischer",
  "holzklassierer",
  "immobilienschätzer",
  "isolierschlauchwickler",
  "kalkbrenner",
  "kameraschwenker",
  "keilriemengummierer",
  "latexschäumer",
  "ledersortierer",
  "lederwarenverpacker",
  "lokalisierer",
  "markscheider",
  "maschinenfeiler",
  "maschinenwäscher",
  "nahrungsmittelklassierer",
  "ordnungshüter",
  "produktklassierer",
  "rohrnetzinstandhalter",
  "sandstrahler",
  "schallplattenpresser",
  "schiefermischer",
  "schiffsschlosser",
  "schüttgutfüller",
  "seifenpresser",
  "seifensieder",
  "spirituosenmischer",
  "stauer",
  "tablettenpresser",
  "takler",
  "textilspinner",
  "tierhäutesortierer",
  "tiersitter",
  "tonbrenner",
  "vlogger",
  "volkswirtschaftler",
  "wachsbleicher",
  "wäschereiaufseher",
  "zellstoffklassierer",
  "zellstoffkocher"
]);

export const reviewedPersonFormCountWave89 = personenbasen.size;

export function getReviewedPersonFormsWave89(
  normalizedBase: string
): GeneratedPersonForms | undefined {
  if (!personenbasen.has(normalizedBase)) {
    return undefined;
  }
  return {
    plural: normalizedBase,
    singular: normalizedBase,
    feminineSingular: `${normalizedBase}in`,
    obliqueSingular: normalizedBase,
    genitiveSingular: `${normalizedBase}s`
  };
}
