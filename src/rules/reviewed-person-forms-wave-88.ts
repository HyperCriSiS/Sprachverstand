import type { GeneratedPersonForms } from "./generated-person-lexicon";

// Die restlichen sicheren Personenbasen aus der abgeschlossenen Hunspell-Triage.
// Exakte Basen statt allgemeiner Wortendungs- oder Herkunftsregeln.
const personenbasen: ReadonlySet<string> = new Set([
  "agilolfinger",
  "altlutheraner",
  "anglikaner",
  "augustiner",
  "ausreisser",
  "aussendienstler",
  "aussenseiter",
  "austronesier",
  "bader",
  "bärenhäuter",
  "bauernbündler",
  "belagerer",
  "benützer",
  "bethlehemer",
  "bismarckverehrer",
  "burgunder",
  "cartesianer",
  "chaldäer",
  "chatter",
  "dragoner",
  "ekstatiker",
  "enddreissiger",
  "endzwanziger",
  "esser",
  "fresser",
  "frömmler",
  "fussballer",
  "geniesser",
  "giesser",
  "grabscher",
  "graphiker",
  "instinktfussballer",
  "kärrner",
  "kliniker",
  "klugscheisser",
  "kokainschmuggler",
  "kokapflanzer",
  "kokser",
  "komatrinker",
  "kugelstosser",
  "lateiner",
  "linksfüssler",
  "linkshegelianer",
  "mässigkeitsvereinsstifter",
  "mittdreissiger",
  "mittfünfziger",
  "mittvierziger",
  "mittzwanziger",
  "nazarener",
  "nestorianer",
  "neutestamentler",
  "nutzniesser",
  "presbyter",
  "rausschmeisser",
  "romulaner",
  "rossschlachter",
  "sachsenkaiser",
  "schliesser",
  "schweisser",
  "shanghaier",
  "spassverderber",
  "spiesser",
  "staufer",
  "talibankämpfer",
  "vieltelephonierer",
  "vulkanier",
  "wandrer",
  "weichensteller",
  "weissager",
  "weissgerber",
  "zotenreisser"
]);

export const reviewedPersonFormCountWave88 = personenbasen.size;

export function getReviewedPersonFormsWave88(
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
