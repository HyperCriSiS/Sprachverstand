import type { GeneratedPersonForms } from "./generated-person-lexicon";

// Exakte geprüfte Berufsbezeichnungen und Schreibvarianten. Keine allgemeine
// ß/ss-Normalisierung: Schreibweise und Flexion bleiben am jeweiligen Eintrag.
const variants: ReadonlyMap<string, readonly [plural: string, weak: boolean]> = new Map([
  ["azubi", ["azubis", false]],
  ["fan", ["fans", false]],
  ["flüchtling", ["flüchtlinge", false]],
  ["berufsfußballer", ["berufsfußballer", false]],
  ["fertigungsmodelleur", ["fertigungsmodelleure", false]],
  ["fußjongleur", ["fußjongleure", false]],
  ["greißler", ["greißler", false]],
  ["heißfoliendrucker", ["heißfoliendrucker", false]],
  ["marketer", ["marketer", false]],
  ["profifußballer", ["profifußballer", false]],
  ["straßenartist", ["straßenartisten", true]],
  ["straßenfeger", ["straßenfeger", false]],
  ["verschleißer", ["verschleißer", false]],

  // Webanalyse 21.10.2026 (10.000 Domains). Paradigmen gegen Duden geprüft
  // (Fundregister, linguistic-decisions.json).
  ["wissenschafter", ["wissenschafter", false]],
  ["nachwuchswissenschafter", ["nachwuchswissenschafter", false]],
  ["sportwissenschafter", ["sportwissenschafter", false]],
  ["innovator", ["innovatoren", false]],
  ["wiedereinsteiger", ["wiedereinsteiger", false]],
  ["pensionist", ["pensionisten", true]],
  ["dissertant", ["dissertanten", true]],

  // Regelmäßige Bildungen auf mehreren unabhängigen Domains: Nomina agentis
  // auf -er (Plural endungslos, Genitiv -s), schwache -ant/-ist/-at,
  // -or/-ar/-eur mit Plural -en/-e. Weibliche Form jeweils Stamm + in.
  ["asylwerber", ["asylwerber", false]],
  ["verhandler", ["verhandler", false]],
  ["zuweiser", ["zuweiser", false]],
  ["bewirtschafter", ["bewirtschafter", false]],
  ["dienstnehmer", ["dienstnehmer", false]],
  ["zuseher", ["zuseher", false]],
  ["seenotretter", ["seenotretter", false]],
  ["selbstzahler", ["selbstzahler", false]],
  ["gesuchsteller", ["gesuchsteller", false]],
  ["antragssteller", ["antragssteller", false]],
  ["verfassungsrechtler", ["verfassungsrechtler", false]],
  ["faktenchecker", ["faktenchecker", false]],
  ["slammer", ["slammer", false]],
  ["friedensstifter", ["friedensstifter", false]],
  ["zustifter", ["zustifter", false]],
  ["assistenznehmer", ["assistenznehmer", false]],
  ["geriater", ["geriater", false]],
  ["automatiker", ["automatiker", false]],
  ["famulant", ["famulanten", true]],
  ["initiant", ["initianten", true]],
  ["kollegiat", ["kollegiaten", true]],
  ["monarchist", ["monarchisten", true]],
  ["zionist", ["zionisten", true]],
  ["reformist", ["reformisten", true]],
  ["internationalist", ["internationalisten", true]],
  ["promotor", ["promotoren", false]],
  ["junior", ["junioren", false]],
  ["mandatar", ["mandatare", false]],
  ["kassier", ["kassiere", false]],
  ["kollaborateur", ["kollaborateure", false]],

  // Berufe auf -bauer: weiblich -bauerin, Plural endungslos, Genitiv -s
  // (anders als Bauer/Bäuerin).
  ["metallbauer", ["metallbauer", false]],
  ["straßenbauer", ["straßenbauer", false]],
  ["orgelbauer", ["orgelbauer", false]],
  ["fahrzeugbauer", ["fahrzeugbauer", false]],
  ["gerüstbauer", ["gerüstbauer", false]],
  ["bootsbauer", ["bootsbauer", false]],
  ["karosseriebauer", ["karosseriebauer", false]],
  ["anlagenbauer", ["anlagenbauer", false]],
  ["modellbauer", ["modellbauer", false]],
  ["instrumentenbauer", ["instrumentenbauer", false]],
  ["messebauer", ["messebauer", false]],
  ["brunnenbauer", ["brunnenbauer", false]],
  ["geigenbauer", ["geigenbauer", false]],
  ["klavierbauer", ["klavierbauer", false]],
  ["maschinenbauer", ["maschinenbauer", false]]
]);

// Schwache Nomen auf -e: der Stamm vor dem Marker ist kürzer als der
// maskuline Singular (`Ohrenzeug*in` → Ohrenzeuge, `Lesepat:innen` → Lesepaten).
const weakEForms: ReadonlySet<string> = new Set([
  "ohrenzeug",
  "lesepat",
  "vorlesepat"
]);

export function getReviewedOccupationForms(normalizedBase: string): GeneratedPersonForms | undefined {
  if (weakEForms.has(normalizedBase)) {
    const inflected = `${normalizedBase}en`;
    return {
      plural: inflected,
      singular: `${normalizedBase}e`,
      feminineSingular: `${normalizedBase}in`,
      obliqueSingular: inflected,
      genitiveSingular: inflected
    };
  }
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
