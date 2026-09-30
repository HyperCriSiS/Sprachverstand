import type { GeneratedPersonForms } from "./generated-person-lexicon";

// Quellenneutraler, exakt freigegebener Zusatzbestand aus Welle 63.
// Die Mengen sind reine Allow-Lists und erzeugen keine generische Suffixfreigabe.
const unchangedForms: ReadonlySet<string> = new Set([
  "abgleicher",
  "absprenger",
  "abspüler",
  "abwieger",
  "albenportefeuiller",
  "aluminiumschläger",
  "anreißer",
  "anschläger",
  "aufbäumer",
  "aufdampfer",
  "aufreiber",
  "aufreißer",
  "aufschläger",
  "aufspanner",
  "auswieger",
  "bauwerkserhalter",
  "besteckeinkitter",
  "bestücker",
  "bimser",
  "bolzenwärmer",
  "bridierer",
  "bürsteneinzieher",
  "catwalker",
  "color-matcher",
  "duplexätzer",
  "enthefer",
  "entrahmer",
  "epithetiker",
  "facher",
  "flämmer",
  "flößer",
  "frimmler",
  "fuger",
  "geometer",
  "gichter",
  "glanzstößer",
  "glasätzer",
  "glänzer",
  "gummikleber",
  "handschärer",
  "harker",
  "haspler",
  "holzkitter",
  "kartenschläger",
  "kerzenzieher",
  "kleiderhefter",
  "kontakter",
  "laminierer",
  "lederwalker",
  "lombardierer",
  "lystrierer",
  "läpper",
  "nopper",
  "partikulierer",
  "passierer",
  "pädiater",
  "rahmer",
  "raschler",
  "rasterätzer",
  "rauher",
  "reeder",
  "reepschläger",
  "schuhzwicker",
  "schwabbler",
  "schärer",
  "seilschläger",
  "senkererodierer",
  "sondengänger",
  "sozialrechtler",
  "spitzenklöppler",
  "spleißer",
  "sprenger",
  "statiker",
  "streetworker",
  "stückpassierer",
  "symphoniker",
  "tabakfermentierer",
  "tafeldecker",
  "talkmaster",
  "teerer",
  "tektoniker",
  "texturierer",
  "thermiker",
  "thermometerjustierer",
  "tiefkühlkonservierer",
  "tierfänger",
  "totengräber",
  "trick-cutter",
  "tuchwalker",
  "tuscher",
  "tüncher",
  "umwelt-zertifizierer",
  "unternehmensethiker",
  "untertitler",
  "ux-researcher",
  "verbleier",
  "verchromer",
  "verfuger",
  "verkehrsüberwacher",
  "verlader",
  "verlagswerber",
  "verleimer",
  "versicherungswerber",
  "verstemmer",
  "vertragswerber",
  "vertäfler",
  "verzinner",
  "viehhalter",
  "vitametiker",
  "vorbeter",
  "wagenuntersucher",
  "wagner",
  "wahrsager",
  "walzwerkthermiker",
  "warenannehmer",
  "weichkäser",
  "weinbehandler",
  "weißriemer",
  "werkzeugjustierer",
  "werkzeugmaschinenspaner",
  "wieger",
  "wildhüter",
  "wirtschaftsethiker",
  "wirtschaftsgeschichtler",
  "wirtschaftsrechtler",
  "writer",
  "wäger",
  "wärmedämmer",
  "wünschelrutengänger",
  "zeitgeschichtler",
  "zerspaner",
  "zertifizierer",
  "zettler",
  "ziegler",
  "zollfahnder",
  "zuckerraffinierer",
  "zwirner",
  "ökonometriker",
  "ölraffinierer",
  "überholer"
]);
const pluralEForms: ReadonlySet<string> = new Set([
  "akupunkteur",
  "akzidenzstereotypeur",
  "annonceur",
  "arbitrageur",
  "artothekar",
  "asphalteur",
  "bauisoleur",
  "cascadeur",
  "cembalointoneur",
  "degorgeur",
  "dekateur",
  "destillateur",
  "detacheur",
  "drageur",
  "dresseur",
  "druckstereotypeur",
  "elefantendompteur",
  "exporteur",
  "figurenmodelleur",
  "fliesenmodelleur",
  "gipsmodelleur",
  "grilleur",
  "guillocheur",
  "homogeniseur",
  "hypnotiseur",
  "instanteur",
  "intonateur",
  "intoneur",
  "jongleur",
  "kascheur",
  "keramikmodelleur",
  "kerammodelleur",
  "krankentransporteur",
  "kunststoffstereotypeur",
  "löwendompteur",
  "merceriseur",
  "metteur",
  "mineur",
  "modelleur",
  "mouleur",
  "möbeltransporteur",
  "objektaquisiteur",
  "orgelintonateur",
  "patroneur",
  "pferdedompteur",
  "reifendienstvulkaniseur",
  "rotationsstereotypeur",
  "sakristan",
  "scheibenmodelleur",
  "schlauchvulkaniseur",
  "schuhmodelleur",
  "sohlenmodelleur",
  "solarteur",
  "stereotypeur",
  "stückappreteur",
  "tabletteur",
  "traiteur",
  "tuchappreteur",
  "videothekar",
  "vikar",
  "volksmissionar",
  "vulkaniseur",
  "wachsmodelleur",
  "werkstereotypeur",
  "zeitungsmetteur",
  "ziseleur"
]);
const weakEForms: ReadonlySet<string> = new Set([
  "amtsbot",
  "atmungsorthopäd",
  "blockgesell",
  "büttgesell",
  "erstgesell",
  "hafenlots",
  "kanallots",
  "kieferorthopäd",
  "postjungbot",
  "revierlots",
  "schiffslots",
  "seelots",
  "verkehrslots"
]);
const weakEnForms: ReadonlySet<string> = new Set([
  "berufskollegiat",
  "chirogymnast",
  "geodät",
  "heilgymnast",
  "homöopath",
  "inspizient",
  "krankengymnast",
  "osteopath",
  "postulant",
  "taxonom",
  "technologiekollegiat",
  "theaterinspizient",
  "tierhomöopath"
]);
const pluralEnForms: ReadonlySet<string> = new Set([
  "distributor",
  "flugnavigator",
  "frisurendemonstrator",
  "gruppenkantor",
  "imitator",
  "informator",
  "kantor",
  "konduktor",
  "liquidator",
  "mechanisator",
  "prospektor",
  "taxator"
]);
const pluralSForms: ReadonlySet<string> = new Set([
  "musikclown",
  "zirkusclown"
]);

export const reviewedPersonFormCountWave63 =
  unchangedForms.size +
  pluralEForms.size +
  weakEForms.size +
  weakEnForms.size +
  pluralEnForms.size +
  pluralSForms.size;

function regularForms(
  base: string,
  plural: string,
  obliqueSingular = base,
  genitiveSingular = `${base}s`
): GeneratedPersonForms {
  return {
    plural,
    singular: base,
    feminineSingular: `${base}in`,
    obliqueSingular,
    genitiveSingular
  };
}

export function getReviewedPersonFormsWave63(
  normalizedBase: string
): GeneratedPersonForms | undefined {
  if (unchangedForms.has(normalizedBase)) {
    return regularForms(normalizedBase, normalizedBase);
  }

  if (pluralEForms.has(normalizedBase)) {
    return regularForms(normalizedBase, `${normalizedBase}e`);
  }

  if (weakEForms.has(normalizedBase)) {
    const singular = `${normalizedBase}e`;
    const inflected = `${normalizedBase}en`;
    return {
      plural: inflected,
      singular,
      feminineSingular: `${normalizedBase}in`,
      obliqueSingular: inflected,
      genitiveSingular: inflected
    };
  }

  if (weakEnForms.has(normalizedBase)) {
    const inflected = `${normalizedBase}en`;
    return regularForms(normalizedBase, inflected, inflected, inflected);
  }

  if (pluralEnForms.has(normalizedBase)) {
    return regularForms(normalizedBase, `${normalizedBase}en`);
  }

  if (pluralSForms.has(normalizedBase)) {
    return regularForms(normalizedBase, `${normalizedBase}s`);
  }

  return undefined;
}
