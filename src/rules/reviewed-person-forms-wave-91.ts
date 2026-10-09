import type { GeneratedPersonForms } from "./generated-person-lexicon";

// Einzelfallprüfung für besondere Pluralformen und abweichende Endungen.
// Nur vollständige, ausdrücklich aufgeführte Wortbasen werden erkannt.
const sonderformen: ReadonlyMap<string, string> = new Map([
  ["amtsvormund", "amtsvormünder"],
  ["auktionssensal", "auktionssensale"],
  ["automatenkassier", "automatenkassiere"],
  ["bankkassier", "bankkassiere"],
  ["brigadegeneral", "brigadegeneräle"],
  ["brigadier", "brigadiers"],
  ["börsensensal", "börsensensale"],
  ["generalleutnant", "generalleutnants"],
  ["generalmajor", "generalmajore"],
  ["grenadier", "grenadiere"],
  ["hotelportier", "hotelportiers"],
  ["ikarier", "ikarier"],
  ["konsul", "konsuln"],
  ["korporal", "korporale"],
  ["major", "majore"],
  ["oberstleutnant", "oberstleutnants"],
  ["pfarrvikar", "pfarrvikare"],
  ["staffelkapitän", "staffelkapitäne"],
  ["vizeleutnant", "vizeleutnants"],
  ["wechselstubenkassier", "wechselstubenkassiere"]
]);

export const reviewedPersonFormCountWave91 = sonderformen.size;

export function getReviewedPersonFormsWave91(
  normalizedBase: string
): GeneratedPersonForms | undefined {
  const plural = sonderformen.get(normalizedBase);
  if (plural === undefined) {
    return undefined;
  }
  return {
    plural,
    singular: normalizedBase,
    feminineSingular: `${normalizedBase}in`,
    obliqueSingular: normalizedBase,
    genitiveSingular: `${normalizedBase}s`
  };
}
