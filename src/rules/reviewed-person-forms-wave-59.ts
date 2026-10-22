import type { GeneratedPersonForms } from "./generated-person-lexicon";

// Quellenneutraler, exakt freigegebener Zusatzbestand aus Welle 59.
// Die Mengen sind reine Allow-Lists und erzeugen keine generische Suffixfreigabe.
const unchangedForms: ReadonlySet<string> = new Set([
  "agrarwirtschafter",
  "agrarwirtschaftler",
  "altertumskundler",
  "arzneimittelzusteller",
  "audio-producer",
  "aufseher",
  "außenwirtschaftler",
  "avioniker",
  "badeaufseher",
  "bandaufseher",
  "barmixer",
  "bauaufseher",
  "berufskundler",
  "bibliotheksaufseher",
  "biokosmetiker",
  "biokybernetiker",
  "biometriker",
  "bioniker",
  "biostatistiker",
  "bodenkundler",
  "briefverteiler",
  "briefzusteller",
  "broker",
  "börsenbroker",
  "callcentercontroller",
  "campaigner",
  "controller",
  "dekorierer",
  "diplom-logistiker",
  "diplom-nautiker",
  "diplom-statistiker",
  "diplomfernsehwirtschaftler",
  "diplomfilmwirtschaftler",
  "dv-controller",
  "edv-controller",
  "effektencontroller",
  "eilzusteller",
  "einkaufslogistiker",
  "energiewirtschaftler",
  "fachhauswirtschafter",
  "fachkosmetiker",
  "feldaufseher",
  "fiction-producer",
  "finanzcontroller",
  "fingernagelkosmetiker",
  "fischereiaufseher",
  "floristikwirtschafter",
  "forensiker",
  "forstwirtschafter",
  "friedhofsaufseher",
  "friseur-kosmetiker",
  "fuhrhofaufseher",
  "fuhrparkaufseher",
  "förderaufseher",
  "galerieaufseher",
  "game-producer",
  "garderobenaufseher",
  "gartenbauwirtschafter",
  "gesteinskundler",
  "gewerbeaufseher",
  "glasdekorierer",
  "gletscherkundler",
  "grubenaufseher",
  "hafenaufseher",
  "hauswirtschafter",
  "infobroker",
  "informations-broker",
  "irankundler",
  "it-controller",
  "it-forensiker",
  "junior-controller",
  "keramdekorierer",
  "krematoriumsaufseher",
  "kybernetiker",
  "ladeaufseher",
  "landbauwirtschafter",
  "landzusteller",
  "leitungsaufseher",
  "logistiker",
  "marketing-controller",
  "marktaufseher",
  "marktwirtschaftler",
  "medienwirtschafter",
  "medizincontroller",
  "meereskundler",
  "molkereiwirtschafter",
  "museumsaufseher",
  "museumskundler",
  "nagel-kosmetiker",
  "naturheilkundler",
  "nautiker",
  "pferdewirtschafter",
  "postzusteller",
  "producer",
  "projektcontroller",
  "schiffsbrückenaufseher",
  "schlachthofaufseher",
  "schlossaufseher",
  "seilbahnaufseher",
  "sozialstatistiker",
  "spielhallenaufseher",
  "spielplatzaufseher",
  "sprengstoffaufseher",
  "statistiker",
  "trailer-producer",
  "vegetationskundler",
  "verkehrswirtschaftler",
  "verladeaufseher",
  "vertriebscontroller",
  "volkskundler",
  "völkerkundler",
  "waldwirtschafter",
  "wasserkundler",
  "weinbauwirtschafter",
  "werbewirtschaftler",
  "werkscontroller",
  "wirtschafter",
  "wirtschaftler",
  "wirtschaftskundler",
  "wirtschaftslogistiker",
  "wirtschaftsstatistiker",
  "zeichnungscontroller",
  "zeitungszusteller"
]);
const weakEnForms: ReadonlySet<string> = new Set([
  "beauty-stylist",
  "bohemist",
  "byzantinist",
  "cartoonist",
  "chefdramaturg",
  "chronist",
  "deklarant",
  "demograf",
  "dentist",
  "diplom-kriminalist",
  "diplomafrikanist",
  "diplomarabist",
  "diplombaltist",
  "diplomindonesist",
  "diplomiranist",
  "diplomkoreanist",
  "diplommongolist",
  "diplomneogräzist",
  "ethnograf",
  "farblithograf",
  "federlithograf",
  "fernsehdramaturg",
  "filmdramaturg",
  "foodstylist",
  "fotogalvanograf",
  "fotolithograf",
  "geograf",
  "hairstylist",
  "hörfunkdramaturg",
  "indonesist",
  "industriegeograf",
  "iranist",
  "kampfchoreograf",
  "keramiklithograf",
  "koreanist",
  "korrekturlithograf",
  "kreidelithograf",
  "kulturgeograf",
  "lithograf",
  "make-up-stylist",
  "mediendramaturg",
  "mongolist",
  "musikdramaturg",
  "nagelstylist",
  "neogräzist",
  "notenlithograf",
  "ozeanograf",
  "parlamentsstenograf",
  "produktionsdramaturg",
  "reprolithograf",
  "schauspieldramaturg",
  "schriftlithograf",
  "serigraf",
  "siedlungsgeograf",
  "sozialgeograf",
  "stenograf",
  "stylist",
  "szenograf",
  "tanzdramaturg",
  "theaterdramaturg",
  "verhandlungsstenograf",
  "verkehrsgeograf",
  "wirtschaftsarabist",
  "wirtschaftsgeograf"
]);
const pluralEnForms: ReadonlySet<string> = new Set([
  "auktionator",
  "dv-instruktor",
  "ebv-operator",
  "edv-instruktor",
  "edv-operator",
  "filmsatz-operator",
  "kamera-operator",
  "laserdruck-operator",
  "medienoperator",
  "mikrofilmoperator",
  "mikrooperator",
  "minilab-operator",
  "molkereiinstruktor",
  "nc-operator",
  "printoperator",
  "reitinstruktor",
  "scanner-operator",
  "step-aerobic-instruktor",
  "systemoperator",
  "video-operator"
]);
const pluralEForms: ReadonlySet<string> = new Set([
  "binnenschifffahrtskapitän",
  "checkkapitän",
  "confiseur",
  "diakon",
  "flugkapitän",
  "gardinendekorateur",
  "gemeindediakon",
  "hafenkapitän",
  "innendekorateur",
  "keramdekorateur",
  "keramikretuscheur",
  "konfektionär",
  "kunststoffkonfektionär",
  "lichtdruckretuscheur",
  "lotsenkapitän",
  "möbeldekorateur",
  "offsetretuscheur",
  "planenkonfektionär",
  "positivretuscheur",
  "reproretuscheur",
  "retuscheur",
  "schiffskapitän",
  "schwergewebekonfektionär",
  "theaterdekorateur",
  "tiefdruckretuscheur",
  "vorlagenretuscheur",
  "zeltkonfektionär",
  "zinkretuscheur"
]);
const logeForms: ReadonlySet<string> = new Set([
  "altphilolog",
  "diplom-oecotropholog",
  "diplom-wirtschaftsjapanolog",
  "diplom-wirtschaftssinolog",
  "diplom-ökotropholog",
  "diplomindolog",
  "diplomjapanolog",
  "diplomsinolog",
  "diplomturkolog",
  "humanphysiolog",
  "neurophysiolog",
  "pflanzenphysiolog",
  "tierphysiolog",
  "zellphysiolog",
  "zoophysiolog"
]);

export const reviewedPersonFormCountWave59 =
  unchangedForms.size +
  weakEnForms.size +
  pluralEnForms.size +
  pluralEForms.size +
  logeForms.size;

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

export function getReviewedPersonFormsWave59(
  normalizedBase: string
): GeneratedPersonForms | undefined {
  if (unchangedForms.has(normalizedBase)) {
    return regularForms(normalizedBase, normalizedBase);
  }

  if (weakEnForms.has(normalizedBase)) {
    const inflected = `${normalizedBase}en`;
    return regularForms(normalizedBase, inflected, inflected, inflected);
  }

  if (pluralEnForms.has(normalizedBase)) {
    return regularForms(normalizedBase, `${normalizedBase}en`);
  }

  if (pluralEForms.has(normalizedBase)) {
    return regularForms(normalizedBase, `${normalizedBase}e`);
  }

  if (logeForms.has(normalizedBase)) {
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

  return undefined;
}
