import type { GeneratedPersonForms } from "./generated-person-lexicon";

// Quellenneutraler, vollständig geprüfter Zusatzbestand aus Welle 81.
// Alle Mengen sind exakte Allow-Lists; es wird keine generische Suffixregel eingeführt.
const unchangedForms: ReadonlySet<string> = new Set([
  "abbrecher",
  "absteiger",
  "agnostiker",
  "amateurfußballer",
  "anschieber",
  "apoplektiker",
  "apostel",
  "arithmetiker",
  "arthritiker",
  "asthmatiker",
  "aufpasser",
  "aufrührer",
  "ausbeuter",
  "ausgräber",
  "auswerter",
  "babyboomer",
  "babylonier",
  "bagdader",
  "barceloner",
  "barzahler",
  "basketballer",
  "basler",
  "bastler",
  "befehlshaber",
  "beiruter",
  "belgrader",
  "benediktiner",
  "berner",
  "besatzer",
  "bettnässer",
  "bewacher",
  "bielefelder",
  "bluter",
  "bodybuilder",
  "bonner",
  "bregenzer",
  "bringer",
  "bronchitiker",
  "bulimiker",
  "bungeespringer",
  "byzantiner",
  "bähnler",
  "celler",
  "charismatiker",
  "choleriker",
  "codierer",
  "deuter",
  "doppelstaatler",
  "draufgänger",
  "dresdner",
  "drogenschmuggler",
  "duisburger",
  "dörfler",
  "düsseldorfer",
  "eigenbrötler",
  "epheser",
  "epiker",
  "epileptiker",
  "erlöser",
  "esoteriker",
  "ethiker",
  "etrusker",
  "exzentriker",
  "falschparker",
  "faulenzer",
  "fiedler",
  "flieger",
  "florentiner",
  "frager",
  "fragesteller",
  "freiburger",
  "freigänger",
  "freudianer",
  "fälscher",
  "fänger",
  "fünftklässler",
  "fünfziger",
  "gallier",
  "gaukler",
  "gauner",
  "gefährder",
  "geiselnehmer",
  "geldwäscher",
  "genomiker",
  "gibraltarer",
  "gießener",
  "goldgräber",
  "gothaer",
  "grenzer",
  "grobmotoriker",
  "großstädter",
  "grönländer",
  "guerillakämpfer",
  "gönner",
  "göttinger",
  "hallenser",
  "hammerwerfer",
  "hamsterer",
  "hanauer",
  "hasser",
  "hedoniker",
  "heidelberger",
  "henker",
  "hochstapler",
  "jobber",
  "linzer",
  "londoner",
  "lügner",
  "machthaber",
  "madrider",
  "magister",
  "mailänder",
  "makedonier",
  "mallorquiner",
  "mannheimer",
  "mautpreller",
  "melancholiker",
  "melder",
  "menorquiner",
  "mesopotamier",
  "minoer",
  "moldawier",
  "moskauer",
  "märtyrer",
  "münchener",
  "nachzügler",
  "namibianer",
  "nassauer",
  "neapolitaner",
  "neider",
  "neuralgiker",
  "neurastheniker",
  "neurodermitiker",
  "neurotiker"
]);

const erVsInForms: ReadonlySet<string> = new Set([
  "abwander",
  "auswander",
  "einwander",
  "erober",
  "förder",
  "kletter"
]);

const weakEnForms: ReadonlySet<string> = new Set([
  "adjunkt",
  "adressant",
  "altruist",
  "analysand",
  "artillerist",
  "asiat",
  "autokrat",
  "avantgardist",
  "baptist",
  "barbar",
  "barpianist",
  "behaviorist",
  "belletrist",
  "bibliograf",
  "bibliograph",
  "blasphemist",
  "bratschist",
  "calvinist",
  "darwinist",
  "dedikant",
  "deist",
  "detaillist",
  "dschihadist",
  "duellant",
  "egoist",
  "erstinskribent",
  "exhibitionist",
  "exilant",
  "exponent",
  "expressionist",
  "fabrikant",
  "fabulist",
  "fagottist",
  "fatalist",
  "fauvist",
  "folklorist",
  "futurist",
  "gardist",
  "gigant",
  "ignorant",
  "illuminat",
  "kartograph",
  "korfiot",
  "marxist",
  "maturant",
  "monarch",
  "monetarist",
  "monogrammist",
  "monotheist",
  "moralist",
  "mutant",
  "mythograf",
  "narzisst"
]);

const pluralEnForms: ReadonlySet<string> = new Set([
  "aggressor",
  "examinator",
  "gladiator"
]);

const weakEForms: ReadonlySet<string> = new Set([
  "allergolog",
  "androlog",
  "assyriolog",
  "balines",
  "balt",
  "bangal",
  "bask",
  "beduin",
  "bergamask",
  "bolognes",
  "bosniak",
  "böhm",
  "bürg",
  "chilen",
  "demagog",
  "diabetolog",
  "flam",
  "futurolog",
  "ganov",
  "gefährt",
  "german",
  "heid",
  "hess",
  "kleptoman",
  "lombard",
  "madegass",
  "makedon",
  "maltes",
  "markomann",
  "masur",
  "mazedon",
  "mim",
  "mormon",
  "myanmar",
  "myrmekolog",
  "mytholog",
  "nachfahr",
  "neonatolog"
]);

const pluralEForms: ReadonlySet<string> = new Set([
  "bastard",
  "billionär",
  "destinatär",
  "dompteur",
  "emissär",
  "finanzintermediär",
  "flaneur",
  "gouverneur",
  "greis",
  "großkoalitionär",
  "marodeur",
  "narkotiseur"
]);


const specialForms: ReadonlyMap<string, GeneratedPersonForms> = new Map([
  [
    "bergbäuer",
    {
      plural: "bergbauern",
      singular: "bergbauer",
      feminineSingular: "bergbäuerin",
      obliqueSingular: "bergbauern",
      genitiveSingular: "bergbauern"
    }
  ],
  [
    "gräf",
    {
      plural: "grafen",
      singular: "graf",
      feminineSingular: "gräfin",
      obliqueSingular: "grafen",
      genitiveSingular: "grafen"
    }
  ]
]);

export const reviewedPersonFormCountWave81 =
  unchangedForms.size +
  erVsInForms.size +
  weakEnForms.size +
  pluralEnForms.size +
  weakEForms.size +
  pluralEForms.size +
  specialForms.size;

function regularForms(
  base: string,
  plural: string,
  singular = base,
  feminineSingular = `${base}in`,
  obliqueSingular = singular,
  genitiveSingular = `${singular}s`
): GeneratedPersonForms {
  return {
    plural,
    singular,
    feminineSingular,
    obliqueSingular,
    genitiveSingular
  };
}

export function getReviewedPersonFormsWave81(
  normalizedBase: string
): GeneratedPersonForms | undefined {
  if (unchangedForms.has(normalizedBase)) {
    return regularForms(normalizedBase, normalizedBase);
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

  if (pluralEForms.has(normalizedBase)) {
    const genitive =
      normalizedBase === "greis"
        ? "greises"
        : `${normalizedBase}s`;
    return regularForms(
      normalizedBase,
      `${normalizedBase}e`,
      normalizedBase,
      `${normalizedBase}in`,
      normalizedBase,
      genitive
    );
  }

  return specialForms.get(normalizedBase);
}