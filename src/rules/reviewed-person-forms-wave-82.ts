import type { GeneratedPersonForms } from "./generated-person-lexicon";

// Quellenneutraler, vollständig geprüfter Zusatzbestand aus Welle 82.
// Alle Ableitungen gelten ausschließlich nach exaktem Basistreffer.
const unchangedForms: ReadonlySet<string> = new Set([
  "nichtmuttersprachler",
  "nörgler",
  "nürnberger",
  "oberbefehlshaber",
  "oberprimaner",
  "obersekundaner",
  "onlinebroker",
  "osloer",
  "paraplegiker",
  "pariser",
  "patrizier",
  "pfeifer",
  "pflücker",
  "pharisäer",
  "phlegmatiker",
  "phobiker",
  "physiognomiker",
  "potsdamer",
  "prager",
  "protestierer",
  "protestler",
  "psychotiker",
  "punker",
  "puritaner",
  "quäker",
  "randalierer",
  "rater",
  "republikaner",
  "rheinland-pfälzer",
  "rheinländer",
  "rocker",
  "rodler",
  "rostocker",
  "rotarier",
  "rottweiler",
  "roubaiser",
  "ruheständler",
  "rächer",
  "rügener",
  "saarlouiser",
  "saarländer",
  "sachsen-anhalter",
  "sachsen-anhaltiner",
  "salzburger",
  "salzwedeler",
  "sanguiniker",
  "schenker",
  "schiffer",
  "schismatiker",
  "schlafwandler",
  "schläfer",
  "schläger",
  "schmeichler",
  "schnorrer",
  "schweriner",
  "schwindler",
  "semiotiker",
  "senkrechtstarter",
  "sondierer",
  "spießer",
  "sprinter",
  "staatsrechtler",
  "sterndeuter",
  "strafrechtler",
  "streber",
  "studiker",
  "sucher",
  "säbelfechter",
  "südeuropäer",
  "südstaatler",
  "südtiroler",
  "tadler",
  "tagelöhner",
  "texaner",
  "tibetaner",
  "tiroler",
  "tokioter",
  "treiber",
  "träumer",
  "trödler",
  "tübinger",
  "ulmer",
  "venezianer",
  "vergewaltiger",
  "webmaster",
  "zahler",
  "zyniker"
]);

const weakEnForms: ReadonlySet<string> = new Set([
  "nihilist",
  "nominalist",
  "nudist",
  "obduzent",
  "okkupant",
  "opponent",
  "ozeanist",
  "pandeist",
  "pantheist",
  "paukist",
  "pegidist",
  "perfektionist",
  "philokartist",
  "polygamist",
  "porträtist",
  "posaunist",
  "propagandist",
  "prosument",
  "protokollant",
  "purist",
  "putschist",
  "rabulist",
  "realist",
  "regent",
  "resident",
  "royalist",
  "satanist",
  "schintoist",
  "separatist",
  "sezessionist",
  "sophist",
  "sopranist",
  "stilist",
  "submittent",
  "subskribent",
  "suderant",
  "surrealist",
  "syndikalist",
  "theist",
  "unionist",
  "utilitarist",
  "äquilibrist",
  "oligarch",
  "ozeanaut",
  "promovend",
  "psychopath",
  "schiit",
  "selenograph",
  "soziopath",
  "technokrat",
  "topograph",
  "tyrann",
  "vagabund",
  "ästhet"
]);

const pluralEnForms: ReadonlySet<string> = new Set([
  "okkupator",
  "plagiator",
  "quästor",
  "reformator",
  "rezitator",
  "zensor"
]);

const pluralEForms: ReadonlySet<string> = new Set([
  "patron",
  "profiteur",
  "provokateur",
  "rechercheur",
  "restaurateur",
  "schutzpatron"
]);

const weakEForms: ReadonlySet<string> = new Set([
  "nomad",
  "onkolog",
  "osman",
  "osteolog",
  "ozeanolog",
  "pars",
  "parömiolog",
  "patrolog",
  "philhellen",
  "phonolog",
  "phäak",
  "phänomenolog",
  "preuß",
  "primatolog",
  "proktolog",
  "pulmolog",
  "pygmä",
  "pyroman",
  "rheumatolog",
  "runolog",
  "sard",
  "schaman",
  "scherg",
  "schurk",
  "scientolog",
  "seismolog",
  "slaw",
  "sorb",
  "speläolog",
  "spielgefährt",
  "togoles",
  "traumatolog"
]);

const erVsInForms: ReadonlySet<string> = new Set([
  "ruder",
  "rückwander",
  "stotter",
  "wander",
  "zuwander"
]);

const specialForms: ReadonlyMap<string, GeneratedPersonForms> = new Map<string, GeneratedPersonForms>([
  [
    "niedersächs",
    {
      "plural": "niedersachsen",
      "singular": "niedersachse",
      "feminineSingular": "niedersächsin",
      "obliqueSingular": "niedersachsen",
      "genitiveSingular": "niedersachsen"
    }
  ],
  [
    "närr",
    {
      "plural": "narren",
      "singular": "narr",
      "feminineSingular": "närrin",
      "obliqueSingular": "narren",
      "genitiveSingular": "narren"
    }
  ],
  [
    "schwäb",
    {
      "plural": "schwaben",
      "singular": "schwabe",
      "feminineSingular": "schwäbin",
      "obliqueSingular": "schwaben",
      "genitiveSingular": "schwaben"
    }
  ],
  [
    "sächs",
    {
      "plural": "sachsen",
      "singular": "sachse",
      "feminineSingular": "sächsin",
      "obliqueSingular": "sachsen",
      "genitiveSingular": "sachsen"
    }
  ],
  [
    "westfäl",
    {
      "plural": "westfalen",
      "singular": "westfale",
      "feminineSingular": "westfälin",
      "obliqueSingular": "westfalen",
      "genitiveSingular": "westfalen"
    }
  ]
]);

export const reviewedPersonFormCountWave82 =
  unchangedForms.size +
  weakEnForms.size +
  pluralEnForms.size +
  pluralEForms.size +
  weakEForms.size +
  erVsInForms.size +
  specialForms.size;

function regularForms(
  base: string,
  plural: string,
  singular = base,
  feminineSingular = `${base}in`,
  obliqueSingular = singular,
  genitiveSingular = `${singular}s`
): GeneratedPersonForms {
  return { plural, singular, feminineSingular, obliqueSingular, genitiveSingular };
}

export function getReviewedPersonFormsWave82(
  normalizedBase: string
): GeneratedPersonForms | undefined {
  if (unchangedForms.has(normalizedBase)) {
    return regularForms(normalizedBase, normalizedBase);
  }

  if (weakEnForms.has(normalizedBase)) {
    const inflected = `${normalizedBase}en`;
    return regularForms(
      normalizedBase,
      inflected,
      normalizedBase,
      `${normalizedBase}in`,
      inflected,
      inflected
    );
  }

  if (pluralEnForms.has(normalizedBase)) {
    return regularForms(normalizedBase, `${normalizedBase}en`);
  }

  if (pluralEForms.has(normalizedBase)) {
    return regularForms(normalizedBase, `${normalizedBase}e`);
  }

  if (weakEForms.has(normalizedBase)) {
    const singular = `${normalizedBase}e`;
    const inflected = `${normalizedBase}en`;
    return regularForms(
      normalizedBase,
      inflected,
      singular,
      `${normalizedBase}in`,
      inflected,
      inflected
    );
  }

  if (erVsInForms.has(normalizedBase)) {
    const masculine = `${normalizedBase}er`;
    return regularForms(
      normalizedBase,
      masculine,
      masculine,
      `${normalizedBase}in`,
      masculine,
      `${masculine}s`
    );
  }

  return specialForms.get(normalizedBase);
}