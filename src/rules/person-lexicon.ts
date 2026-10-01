import {
  getGeneratedPersonForms,
  type GeneratedPersonForms
} from "./generated-person-lexicon";
import { nationalityPersonForms } from "./nationality-person-forms";
import { getReviewedPersonForms } from "./reviewed-person-forms";
import { getReviewedPersonFormsWave59 } from "./reviewed-person-forms-wave-59";
import { getReviewedPersonFormsWave60 } from "./reviewed-person-forms-wave-60";
import { getReviewedPersonFormsWave61 } from "./reviewed-person-forms-wave-61";
import { getReviewedPersonFormsWave62 } from "./reviewed-person-forms-wave-62";
import { getReviewedPersonFormsWave63 } from "./reviewed-person-forms-wave-63";
import { getReviewedPersonFormsWave64 } from "./reviewed-person-forms-wave-64";
import { getReviewedPersonFormsWave65 } from "./reviewed-person-forms-wave-65";
import { getReviewedPersonFormsWave66 } from "./reviewed-person-forms-wave-66";
import { getReviewedPersonFormsWave67 } from "./reviewed-person-forms-wave-67";
import { getReviewedPersonFormsWave68 } from "./reviewed-person-forms-wave-68";

export type GrammaticalCase =
  | "nominative"
  | "accusative"
  | "dative"
  | "genitive";

type MatchMode = "exact" | "suffix";

interface PersonForms {
  readonly stem: string;
  readonly plural: string;
  readonly singular?: string;
  readonly feminineSingular?: string;
  readonly compoundFeminineSingular?: string;
  readonly obliqueSingular?: string;
  readonly genitiveSingular?: string;
  readonly compoundPlural?: string;
  readonly match?: MatchMode;
}

const locale = "de-DE";

function getExactPersonForms(
  normalizedBase: string
): GeneratedPersonForms | undefined {
  return (
    getGeneratedPersonForms(normalizedBase) ??
    getReviewedPersonForms(normalizedBase) ??
    getReviewedPersonFormsWave59(normalizedBase) ??
    getReviewedPersonFormsWave60(normalizedBase) ??
    getReviewedPersonFormsWave61(normalizedBase) ??
    getReviewedPersonFormsWave62(normalizedBase) ??
    getReviewedPersonFormsWave63(normalizedBase) ??
    getReviewedPersonFormsWave64(normalizedBase) ??
    getReviewedPersonFormsWave65(normalizedBase) ??
    getReviewedPersonFormsWave66(normalizedBase) ??
    getReviewedPersonFormsWave67(normalizedBase) ??
    getReviewedPersonFormsWave68(normalizedBase)
  );
}

function weak(
  stem: string,
  singular = stem,
  obliqueSingular = `${stem}en`
): PersonForms {
  return {
    stem,
    singular,
    obliqueSingular,
    plural: obliqueSingular
  };
}

function regular(
  stem: string,
  plural: string,
  singular = stem,
  genitiveSingular?: string
): PersonForms {
  return genitiveSingular === undefined
    ? { stem, singular, plural }
    : { stem, singular, genitiveSingular, plural };
}

const personForms: readonly PersonForms[] = [
  { ...regular("tischler", "tischler"), match: "exact" as const },
  { ...regular("torhüter", "torhüter"), match: "exact" as const },
  { ...regular("turner", "turner"), match: "exact" as const },
  { ...regular("torwart", "torwarte", "torwart", "torwarts"), match: "exact" as const },
  { ...weak("vorfahr", "vorfahre", "vorfahren"), match: "exact" as const },
  { ...regular("scharlatan", "scharlatane", "scharlatan", "scharlatans"), match: "exact" as const },
  { ...regular("schelm", "schelme", "schelm", "schelms"), match: "exact" as const },
  { ...weak("sexist"), match: "exact" as const },
  { ...regular("sparringspartner", "sparringspartner", "sparringspartner", "sparringspartners"), match: "exact" as const },
  { ...regular("speaker", "speaker", "speaker", "speakers"), match: "exact" as const },
  { ...weak("südostasiat"), match: "exact" as const },
  { ...regular("lateinamerikaner", "lateinamerikaner"), match: "exact" as const },
  { ...weak("lebensgefährt", "lebensgefährte", "lebensgefährten"), match: "exact" as const },
  { ...regular("leutnant", "leutnants"), match: "exact" as const },
  { ...regular("metzger", "metzger"), match: "exact" as const },
  { ...weak("misanthrop"), match: "exact" as const },
  { ...weak("nachkomm", "nachkomme", "nachkommen"), match: "exact" as const },
  { ...regular("neuling", "neulinge", "neuling", "neulings"), match: "exact" as const },
  { ...regular("ordner", "ordner"), match: "exact" as const },
  { ...weak("ostasiat"), match: "exact" as const },
  { ...weak("pedant"), match: "exact" as const },
  { ...weak("philanthrop"), match: "exact" as const },
  { ...weak("egoman", "egomane", "egomanen"), match: "exact" as const },
  { ...weak("ehegatt", "ehegatte", "ehegatten"), match: "exact" as const },
  { ...weak("ergonom"), match: "exact" as const },
  { ...regular("intermediär", "intermediäre", "intermediär", "intermediärs"), match: "exact" as const },
  { ...weak("adjutant"), match: "exact" as const },
  { ...weak("autodidakt"), match: "exact" as const },
  weak("banaus", "banause", "banausen"),
  { ...weak("dilettant"), match: "exact" as const },
  { ...weak("technolog", "technologe", "technologen") },
  { ...regular("zimmerer", "zimmerer"), feminineSingular: "zimmerin" },
  { ...regular("polsterer", "polsterer"), feminineSingular: "polsterin", match: "exact" as const },
  { ...weak("skandinavist"), match: "exact" as const },
  { ...weak("albanolog", "albanologe", "albanologen"), match: "exact" as const },
  { ...weak("japanolog", "japanologe", "japanologen"), match: "exact" as const },
  { ...weak("sinolog", "sinologe", "sinologen"), match: "exact" as const },
  { ...weak("anglist"), match: "exact" as const },
  { ...weak("amerikanist"), match: "exact" as const },
  { ...weak("arabist"), match: "exact" as const },
  { ...regular("audiodeskriptor", "audiodeskriptoren"), match: "exact" as const },
  { ...weak("baltist"), match: "exact" as const },
  { ...weak("finnougrist"), match: "exact" as const },
  { ...weak("ägyptolog", "ägyptologe", "ägyptologen"), match: "exact" as const },
  { ...weak("astrolog", "astrologe", "astrologen"), match: "exact" as const },
  { ...regular("dekorateur", "dekorateure", "dekorateur", "dekorateurs"), match: "exact" as const },
  { ...weak("indolog", "indologe", "indologen"), match: "exact" as const },
  { ...weak("kinesiolog", "kinesiologe", "kinesiologen"), match: "exact" as const },
  { ...weak("kryptolog", "kryptologe", "kryptologen"), match: "exact" as const },
  { ...weak("lots", "lotse", "lotsen"), match: "exact" as const },
  { ...weak("metallurg", "metallurge", "metallurgen"), match: "exact" as const },
  { ...weak("museolog", "museologe", "museologen"), match: "exact" as const },
  { ...weak("politolog", "politologe", "politologen"), match: "exact" as const },
  { ...weak("orthopäd", "orthopäde", "orthopäden"), match: "exact" as const },
  { ...weak("podolog", "podologe", "podologen"), match: "exact" as const },
  { ...weak("urolog", "urologe", "urologen"), match: "exact" as const },
  { ...weak("kardiolog", "kardiologe", "kardiologen"), match: "exact" as const },
  { ...weak("neurolog", "neurologe", "neurologen"), match: "exact" as const },
  { ...weak("hämatolog", "hämatologe", "hämatologen"), match: "exact" as const },
  { ...weak("gastroenterolog", "gastroenterologe", "gastroenterologen"), match: "exact" as const },
  { ...weak("immunolog", "immunologe", "immunologen"), match: "exact" as const },
  { ...weak("physiolog", "physiologe", "physiologen"), match: "exact" as const },
  { ...weak("pharmakolog", "pharmakologe", "pharmakologen"), match: "exact" as const },
  { ...weak("bakteriolog", "bakteriologe", "bakteriologen"), match: "exact" as const },
  { ...weak("endokrinolog", "endokrinologe", "endokrinologen"), match: "exact" as const },
  { ...weak("entomolog", "entomologe", "entomologen"), match: "exact" as const },
  { ...weak("etymolog", "etymologe", "etymologen"), match: "exact" as const },
  { ...weak("gemmolog", "gemmologe", "gemmologen"), match: "exact" as const },
  { ...weak("genealog", "genealoge", "genealogen"), match: "exact" as const },
  { ...weak("gerontolog", "gerontologe", "gerontologen"), match: "exact" as const },
  { ...weak("kriminolog", "kriminologe", "kriminologen"), match: "exact" as const },
  { ...weak("limnolog", "limnologe", "limnologen"), match: "exact" as const },
  { ...weak("ornitholog", "ornithologe", "ornithologen"), match: "exact" as const },
  { ...weak("turkolog", "turkologe", "turkologen"), match: "exact" as const },
  { ...weak("toxikolog", "toxikologe", "toxikologen"), match: "exact" as const },
  { ...weak("radiolog", "radiologe", "radiologen"), match: "exact" as const },
  { ...weak("pneumolog", "pneumologe", "pneumologen"), match: "exact" as const },
  { ...weak("philolog", "philologe", "philologen"), match: "exact" as const },
  { ...weak("parasitolog", "parasitologe", "parasitologen"), match: "exact" as const },
  { ...weak("paläontolog", "paläontologe", "paläontologen"), match: "exact" as const },
  { ...weak("glaziolog", "glaziologe", "glaziologen"), match: "exact" as const },
  { ...weak("lichenolog", "lichenologe", "lichenologen"), match: "exact" as const },
  { ...weak("hungarolog", "hungarologe", "hungarologen"), match: "exact" as const },
  { ...weak("dermatolog", "dermatologe", "dermatologen"), match: "exact" as const },
  { ...weak("epidemiolog", "epidemiologe", "epidemiologen"), match: "exact" as const },
  { ...weak("hydrolog", "hydrologe", "hydrologen"), match: "exact" as const },
  { ...weak("mineralog", "mineraloge", "mineralogen"), match: "exact" as const },
  { ...weak("mykolog", "mykologe", "mykologen"), match: "exact" as const },
  { ...weak("nephrolog", "nephrologe", "nephrologen"), match: "exact" as const },
  { ...weak("klimatolog", "klimatologe", "klimatologen"), match: "exact" as const },
  { ...weak("histolog", "histologe", "histologen"), match: "exact" as const },
  { ...weak("fluglots", "fluglotse", "fluglotsen"), match: "exact" as const },
  { ...weak("gehilf", "gehilfe", "gehilfen"), match: "exact" as const },
  { ...weak("grapholog", "graphologe", "graphologen"), match: "exact" as const },
  { ...weak("keltolog", "keltologe", "keltologen"), match: "exact" as const },
  { ...weak("ophthalmolog", "ophthalmologe", "ophthalmologen"), match: "exact" as const },
  { ...weak("petrolog", "petrologe", "petrologen"), match: "exact" as const },
  { ...weak("serolog", "serologe", "serologen"), match: "exact" as const },
  { ...weak("önolog", "önologe", "önologen"), match: "exact" as const },
  { ...weak("pädaudiolog", "pädaudiologe", "pädaudiologen"), match: "exact" as const },
  { ...weak("zytolog", "zytologe", "zytologen"), match: "exact" as const },
  { ...weak("heilgehilf", "heilgehilfe", "heilgehilfen"), match: "exact" as const },
  { ...weak("kosmetolog", "kosmetologe", "kosmetologen"), match: "exact" as const },
  { ...weak("motopäd", "motopäde", "motopäden"), match: "exact" as const },
  { ...weak("pantomim", "pantomime", "pantomimen"), match: "exact" as const },
  { ...regular("parfumeur", "parfumeure", "parfumeur", "parfumeurs"), match: "exact" as const },
  { ...weak("planetolog", "planetologe", "planetologen"), match: "exact" as const },
  { ...weak("röntgenolog", "röntgenologe", "röntgenologen"), match: "exact" as const },
  { ...weak("sedimentolog", "sedimentologe", "sedimentologen"), match: "exact" as const },
  { ...weak("tibetolog", "tibetologe", "tibetologen"), match: "exact" as const },
  { ...weak("ökotropholog", "ökotrophologe", "ökotrophologen"), match: "exact" as const },
  { ...regular("ausbesserer", "ausbesserer", "ausbesserer", "ausbesserers"), match: "exact" as const },
  { ...weak("badegehilf", "badegehilfe", "badegehilfen"), match: "exact" as const },
  { ...regular("beiköch", "beiköche", "beikoch", "beikochs"), match: "exact" as const },
  { ...weak("bürobot", "bürobote", "büroboten"), match: "exact" as const },
  { ...weak("geragog", "geragoge", "geragogen"), match: "exact" as const },
  { ...weak("hispanolog", "hispanologe", "hispanologen"), match: "exact" as const },
  { ...weak("infektolog", "infektologe", "infektologen"), match: "exact" as const },
  { ...weak("malaiolog", "malaiologe", "malaiologen"), match: "exact" as const },
  { ...weak("motolog", "motologe", "motologen"), match: "exact" as const },
  { ...weak("ökotoxikolog", "ökotoxikologe", "ökotoxikologen"), match: "exact" as const },
  { ...weak("aerolog", "aerologe", "aerologen"), match: "exact" as const },
  { ...weak("algesiolog", "algesiologe", "algesiologen"), match: "exact" as const },
  { ...weak("anaplastolog", "anaplastologe", "anaplastologen"), match: "exact" as const },
  { ...weak("atlaslog", "atlasloge", "atlaslogen"), match: "exact" as const },
  { ...weak("kaukasiolog", "kaukasiologe", "kaukasiologen"), match: "exact" as const },
  { ...weak("morpholog", "morphologe", "morphologen"), match: "exact" as const },
  { ...weak("sozialgerontolog", "sozialgerontologe", "sozialgerontologen"), match: "exact" as const },
  { ...weak("töpfergesell", "töpfergeselle", "töpfergesellen"), match: "exact" as const },
  { ...weak("vitalog", "vitaloge", "vitalogen"), match: "exact" as const },
  { ...weak("wirtschaftsjapanolog", "wirtschaftsjapanologe", "wirtschaftsjapanologen"), match: "exact" as const },
  { ...regular("fernheiler", "fernheiler", "fernheiler", "fernheilers"), match: "exact" as const },
  { ...weak("gerontagog", "gerontagoge", "gerontagogen"), match: "exact" as const },
  { ...weak("oecolog", "oecologe", "oecologen"), match: "exact" as const },
  { ...weak("paradontolog", "paradontologe", "paradontologen"), match: "exact" as const },
  { ...weak("wirtschaftsmalaiolog", "wirtschaftsmalaiologe", "wirtschaftsmalaiologen"), match: "exact" as const },
  { ...weak("wirtschaftssinolog", "wirtschaftssinologe", "wirtschaftssinologen"), match: "exact" as const },
  { ...weak("akrobat", "akrobat", "akrobaten"), match: "exact" as const },
  { ...weak("aktienanalyst", "aktienanalyst", "aktienanalysten"), match: "exact" as const },
  { ...regular("aktuar", "aktuare", "aktuar", "aktuars"), match: "exact" as const },
  { ...regular("altbierbrauer", "altbierbrauer", "altbierbrauer", "altbierbrauers"), match: "exact" as const },
  { ...weak("anatom", "anatom", "anatomen"), match: "exact" as const },
  { ...weak("anästhesist", "anästhesist", "anästhesisten"), match: "exact" as const },
  { ...regular("adremadrucker", "adremadrucker", "adremadrucker", "adremadruckers"), match: "exact" as const },
  { ...regular("adressendrucker", "adressendrucker", "adressendrucker", "adressendruckers"), match: "exact" as const },
  { ...regular("akquisiteur", "akquisiteure", "akquisiteur", "akquisiteurs"), match: "exact" as const },
  { ...regular("akustikschreiner", "akustikschreiner", "akustikschreiner", "akustikschreiners"), match: "exact" as const },
  { ...regular("aluminiumdrucker", "aluminiumdrucker", "aluminiumdrucker", "aluminiumdruckers"), match: "exact" as const },
  { ...regular("anilindrucker", "anilindrucker", "anilindrucker", "anilindruckers"), match: "exact" as const },
  { ...regular("antikschreiner", "antikschreiner", "antikschreiner", "antikschreiners"), match: "exact" as const },
  { ...regular("anzeigenakquisiteur", "anzeigenakquisiteure", "anzeigenakquisiteur", "anzeigenakquisiteurs"), match: "exact" as const },
  { ...regular("aquarelldrucker", "aquarelldrucker", "aquarelldrucker", "aquarelldruckers"), match: "exact" as const },
  {
    stem: "ackerbäuer",
    singular: "ackerbauer",
    feminineSingular: "ackerbäuerin",
    obliqueSingular: "ackerbauern",
    genitiveSingular: "ackerbauern",
    plural: "ackerbauern",
    match: "exact" as const
  },
  { ...weak("ackergehilf", "ackergehilfe", "ackergehilfen"), match: "exact" as const },
  { ...regular("alleinköch", "alleinköche", "alleinkoch", "alleinkochs"), feminineSingular: "alleinköchin", match: "exact" as const },
  {
    stem: "almbäuer",
    singular: "almbauer",
    feminineSingular: "almbäuerin",
    obliqueSingular: "almbauern",
    genitiveSingular: "almbauern",
    plural: "almbauern",
    match: "exact" as const
  },
  { ...weak("anwaltsgehilf", "anwaltsgehilfe", "anwaltsgehilfen"), match: "exact" as const },
  { ...regular("archivrestaurator", "archivrestauratoren", "archivrestaurator", "archivrestaurators"), match: "exact" as const },
  { ...regular("auftragsakquisiteur", "auftragsakquisiteure", "auftragsakquisiteur", "auftragsakquisiteurs"), match: "exact" as const },
  { ...regular("aufzugschlosser", "aufzugschlosser", "aufzugschlosser", "aufzugschlossers"), match: "exact" as const },
  { ...weak("augenarztgehilf", "augenarztgehilfe", "augenarztgehilfen"), match: "exact" as const },
  { ...weak("augenoptikergehilf", "augenoptikergehilfe", "augenoptikergehilfen"), match: "exact" as const },
  { ...regular("ausstellungsschreiner", "ausstellungsschreiner", "ausstellungsschreiner", "ausstellungsschreiners"), match: "exact" as const },
  { ...regular("autoreparaturschlosser", "autoreparaturschlosser", "autoreparaturschlosser", "autoreparaturschlossers"), match: "exact" as const },
  { ...regular("autoschlosser", "autoschlosser", "autoschlosser", "autoschlossers"), match: "exact" as const },
  { ...regular("bahnbetriebsschlosser", "bahnbetriebsschlosser", "bahnbetriebsschlosser", "bahnbetriebsschlossers"), match: "exact" as const },
  { ...weak("bandagist", "bandagist", "bandagisten"), match: "exact" as const },
  { ...weak("bankenanalyst", "bankenanalyst", "bankenanalysten"), match: "exact" as const },
  { ...regular("bankrevisor", "bankrevisoren", "bankrevisor", "bankrevisors"), match: "exact" as const },
  { ...weak("bargehilf", "bargehilfe", "bargehilfen"), match: "exact" as const },
  { ...regular("baumaschinenschlosser", "baumaschinenschlosser", "baumaschinenschlosser", "baumaschinenschlossers"), match: "exact" as const },
  { ...regular("bauschlosser", "bauschlosser", "bauschlosser", "bauschlossers"), match: "exact" as const },
  { ...regular("bauschreiner", "bauschreiner", "bauschreiner", "bauschreiners"), match: "exact" as const },
  { ...regular("bausparkassenrevisor", "bausparkassenrevisoren", "bausparkassenrevisor", "bausparkassenrevisors"), match: "exact" as const },
  { ...regular("beilagenköch", "beilagenköche", "beilagenkoch", "beilagenkochs"), match: "exact" as const },
  { ...weak("bestattungsgehilf", "bestattungsgehilfe", "bestattungsgehilfen"), match: "exact" as const },
  { ...regular("betriebsschlosser", "betriebsschlosser", "betriebsschlosser", "betriebsschlossers"), match: "exact" as const },
  { ...regular("betriebsschreiner", "betriebsschreiner", "betriebsschreiner", "betriebsschreiners"), match: "exact" as const },
  { ...weak("bienenzuchtgehilf", "bienenzuchtgehilfe", "bienenzuchtgehilfen"), match: "exact" as const },
  { ...regular("bierbrauer", "bierbrauer", "bierbrauer", "bierbrauers"), match: "exact" as const },
  { ...regular("blaudrucker", "blaudrucker", "blaudrucker", "blaudruckers"), match: "exact" as const },
  { ...regular("blechdrucker", "blechdrucker", "blechdrucker", "blechdruckers"), match: "exact" as const },
  { ...regular("blechschlosser", "blechschlosser", "blechschlosser", "blechschlossers"), match: "exact" as const },
  { ...regular("blindenschriftdrucker", "blindenschriftdrucker", "blindenschriftdrucker", "blindenschriftdruckers"), match: "exact" as const },
  { ...weak("bodenakrobat", "bodenakrobat", "bodenakrobaten"), match: "exact" as const },
  { ...weak("bohrgehilf", "bohrgehilfe", "bohrgehilfen"), match: "exact" as const },
  { ...weak("bonitätsanalyst", "bonitätsanalyst", "bonitätsanalysten"), match: "exact" as const },
  { ...regular("bratenköch", "bratenköche", "bratenkoch", "bratenkochs"), match: "exact" as const },
  { ...regular("brauer", "brauer", "brauer", "brauers"), match: "exact" as const },
  { ...regular("brückenbauschlosser", "brückenbauschlosser", "brückenbauschlosser", "brückenbauschlossers"), match: "exact" as const },
  { ...regular("buchdrucker", "buchdrucker", "buchdrucker", "buchdruckers"), match: "exact" as const },
  { ...regular("buchrestaurator", "buchrestauratoren", "buchrestaurator", "buchrestaurators"), match: "exact" as const },
  { ...regular("buntdrucker", "buntdrucker", "buntdrucker", "buntdruckers"), match: "exact" as const },
  { ...weak("business-analyst", "business-analyst", "business-analysten"), match: "exact" as const },
  { ...weak("bäckergehilf", "bäckergehilfe", "bäckergehilfen"), match: "exact" as const },
  { ...weak("büchereigehilf", "büchereigehilfe", "büchereigehilfen"), match: "exact" as const },
  { ...weak("büfettgehilf", "büfettgehilfe", "büfettgehilfen"), match: "exact" as const },
  { ...weak("bühnenakrobat", "bühnenakrobat", "bühnenakrobaten"), match: "exact" as const },
  { ...regular("bühnenschreiner", "bühnenschreiner", "bühnenschreiner", "bühnenschreiners"), match: "exact" as const },
  { ...weak("bürogehilf", "bürogehilfe", "bürogehilfen"), match: "exact" as const },
  { ...weak("cash-flow-analyst", "cash-flow-analyst", "cash-flow-analysten"), match: "exact" as const },
  { ...regular("chefköch", "chefköche", "chefkoch", "chefkochs"), match: "exact" as const },
  { ...weak("data-analyst", "data-analyst", "data-analysten"), match: "exact" as const },
  { ...weak("data-warehouse-analyst", "data-warehouse-analyst", "data-warehouse-analysten"), match: "exact" as const },
  { ...regular("denkmalrestaurator", "denkmalrestauratoren", "denkmalrestaurator", "denkmalrestaurators"), match: "exact" as const },
  { ...regular("dieselmotorenschlosser", "dieselmotorenschlosser", "dieselmotorenschlosser", "dieselmotorenschlossers"), match: "exact" as const },
  { ...weak("digital-analyst", "digital-analyst", "digital-analysten"), match: "exact" as const },
  { ...regular("digitaldrucker", "digitaldrucker", "digitaldrucker", "digitaldruckers"), match: "exact" as const },
  { ...regular("diplom-restaurator", "diplom-restauratoren", "diplom-restaurator", "diplom-restaurators"), match: "exact" as const },
  { ...regular("diätköch", "diätköche", "diätkoch", "diätkochs"), match: "exact" as const },
  { ...regular("drahtschlosser", "drahtschlosser", "drahtschlosser", "drahtschlossers"), match: "exact" as const },
  { ...weak("drahtseilakrobat", "drahtseilakrobat", "drahtseilakrobaten"), match: "exact" as const },
  { ...regular("drucker", "drucker", "drucker", "druckers"), match: "exact" as const },
  { ...regular("druckereirevisor", "druckereirevisoren", "druckereirevisor", "druckereirevisors"), match: "exact" as const },
  { ...regular("dv-revisor", "dv-revisoren", "dv-revisor", "dv-revisors"), match: "exact" as const },
  { ...regular("edv-revisor", "edv-revisoren", "edv-revisor", "edv-revisors"), match: "exact" as const },
  { ...regular("einfarbenoffsetdrucker", "einfarbenoffsetdrucker", "einfarbenoffsetdrucker", "einfarbenoffsetdruckers"), match: "exact" as const },
  { ...regular("eisenbahnschlosser", "eisenbahnschlosser", "eisenbahnschlosser", "eisenbahnschlossers"), match: "exact" as const },
  { ...regular("eisenbauschlosser", "eisenbauschlosser", "eisenbauschlosser", "eisenbauschlossers"), match: "exact" as const },
  { ...regular("eisenmöbelschlosser", "eisenmöbelschlosser", "eisenmöbelschlosser", "eisenmöbelschlossers"), match: "exact" as const },
  { ...regular("elektrofahrzeugschlosser", "elektrofahrzeugschlosser", "elektrofahrzeugschlosser", "elektrofahrzeugschlossers"), match: "exact" as const },
  { ...regular("elektrosignalschlosser", "elektrosignalschlosser", "elektrosignalschlosser", "elektrosignalschlossers"), match: "exact" as const },
  { ...weak("fachgehilf", "fachgehilfe", "fachgehilfen"), match: "exact" as const },
  { ...regular("fahrzeugschlosser", "fahrzeugschlosser", "fahrzeugschlosser", "fahrzeugschlossers"), match: "exact" as const },
  { ...weak("fehleranalyst", "fehleranalyst", "fehleranalysten"), match: "exact" as const },
  { ...regular("feinblechschlosser", "feinblechschlosser", "feinblechschlosser", "feinblechschlossers"), match: "exact" as const },
  {
    stem: "feldgemüsebäuer",
    singular: "feldgemüsebauer",
    feminineSingular: "feldgemüsebäuerin",
    obliqueSingular: "feldgemüsebauern",
    genitiveSingular: "feldgemüsebauern",
    plural: "feldgemüsebauern",
    match: "exact" as const
  },
  { ...regular("fensterschreiner", "fensterschreiner", "fensterschreiner", "fensterschreiners"), match: "exact" as const },
  { ...regular("fernmelderevisor", "fernmelderevisoren", "fernmelderevisor", "fernmelderevisors"), match: "exact" as const },
  { ...regular("filmlichtdrucker", "filmlichtdrucker", "filmlichtdrucker", "filmlichtdruckers"), match: "exact" as const },
  { ...regular("filmrestaurator", "filmrestauratoren", "filmrestaurator", "filmrestaurators"), match: "exact" as const },
  { ...weak("finanzanalyst", "finanzanalyst", "finanzanalysten"), match: "exact" as const },
  { ...weak("fischergehilf", "fischergehilfe", "fischergehilfen"), match: "exact" as const },
  { ...regular("fischköch", "fischköche", "fischkoch", "fischkochs"), match: "exact" as const },
  { ...weak("fischzuchtgehilf", "fischzuchtgehilfe", "fischzuchtgehilfen"), match: "exact" as const },
  { ...regular("flachdrucker", "flachdrucker", "flachdrucker", "flachdruckers"), match: "exact" as const },
  { ...weak("fleischergehilf", "fleischergehilfe", "fleischergehilfen"), match: "exact" as const },
  { ...regular("flexodrucker", "flexodrucker", "flexodrucker", "flexodruckers"), match: "exact" as const },
  { ...regular("foliendrucker", "foliendrucker", "foliendrucker", "foliendruckers"), match: "exact" as const },
  { ...weak("fondsanalyst", "fondsanalyst", "fondsanalysten"), match: "exact" as const },
  { ...weak("fotomatongehilf", "fotomatongehilfe", "fotomatongehilfen"), match: "exact" as const },
  { ...regular("fotorestaurator", "fotorestauratoren", "fotorestaurator", "fotorestaurators"), match: "exact" as const },
  { ...weak("fraud-analyst", "fraud-analyst", "fraud-analysten"), match: "exact" as const },
  { ...weak("funkgehilf", "funkgehilfe", "funkgehilfen"), match: "exact" as const },
  { ...weak("fährgehilf", "fährgehilfe", "fährgehilfen"), match: "exact" as const },
  { ...weak("gasthofgehilf", "gasthofgehilfe", "gasthofgehilfen"), match: "exact" as const },
  { ...weak("gaststättengehilf", "gaststättengehilfe", "gaststättengehilfen"), match: "exact" as const },
  { ...weak("geflügelzuchtgehilf", "geflügelzuchtgehilfe", "geflügelzuchtgehilfen"), match: "exact" as const },
  { ...regular("gemälderestaurator", "gemälderestauratoren", "gemälderestaurator", "gemälderestaurators"), match: "exact" as const },
  {
    stem: "gemüsebäuer",
    singular: "gemüsebauer",
    feminineSingular: "gemüsebäuerin",
    obliqueSingular: "gemüsebauern",
    genitiveSingular: "gemüsebauern",
    plural: "gemüsebauern",
    match: "exact" as const
  },
  { ...regular("gestellbauschlosser", "gestellbauschlosser", "gestellbauschlosser", "gestellbauschlossers"), match: "exact" as const },
  { ...weak("gestütsgehilf", "gestütsgehilfe", "gestütsgehilfen"), match: "exact" as const },
  { ...regular("getriebeschlosser", "getriebeschlosser", "getriebeschlosser", "getriebeschlossers"), match: "exact" as const },
  { ...weak("gewerbegehilf", "gewerbegehilfe", "gewerbegehilfen"), match: "exact" as const },
  { ...regular("glasbedrucker", "glasbedrucker", "glasbedrucker", "glasbedruckers"), match: "exact" as const },
  { ...weak("goldschmiedegehilf", "goldschmiedegehilfe", "goldschmiedegehilfen"), match: "exact" as const },
  { ...regular("grafikrestaurator", "grafikrestauratoren", "grafikrestaurator", "grafikrestaurators"), match: "exact" as const },
  { ...weak("afrikanist"), match: "exact" as const },
  weak("hirt", "hirte", "hirten"),
  regular("schäfer", "schäfer"),
  regular("mesner", "mesner"),
  {
    stem: "schwäger",
    singular: "schwager",
    feminineSingular: "schwägerin",
    genitiveSingular: "schwagers",
    plural: "schwäger"
  },
  { ...regular("operator", "operatoren"), match: "exact" as const },
  { ...weak("trauzeug", "trauzeuge", "trauzeugen"), match: "exact" as const },
  { ...regular("sünder", "sünder"), match: "exact" as const },
  { ...weak("ries", "riese", "riesen"), match: "exact" as const },
  { ...weak("finn", "finne", "finnen"), match: "exact" as const },
  { ...weak("dän", "däne", "dänen"), match: "exact" as const },
  { ...weak("tschech", "tscheche", "tschechen"), match: "exact" as const },
  { ...weak("ir", "ire", "iren"), match: "exact" as const },
  { ...weak("schwed", "schwede", "schweden"), match: "exact" as const },
  { ...weak("lett", "lette", "letten"), match: "exact" as const },
  { ...weak("est", "este", "esten"), match: "exact" as const },
  { ...weak("slowak", "slowake", "slowaken"), match: "exact" as const },
  { ...weak("pol", "pole", "polen"), match: "exact" as const },
  { ...weak("ungar", "ungar", "ungarn"), match: "exact" as const },
  { ...weak("serb", "serbe", "serben"), match: "exact" as const },
  { ...weak("kroat", "kroate", "kroaten"), match: "exact" as const },
  { ...weak("slowen", "slowene", "slowenen"), match: "exact" as const },
  { ...regular("belgier", "belgier"), match: "exact" as const },
  regular("koreaner", "koreaner"),
  { ...regular("pakistaner", "pakistaner"), match: "exact" as const },
  { ...regular("iraker", "iraker"), match: "exact" as const },
  { ...regular("araber", "araber"), match: "exact" as const },
  { ...regular("marokkaner", "marokkaner"), match: "exact" as const },
  { ...regular("algerier", "algerier"), match: "exact" as const },
  { ...regular("tunesier", "tunesier"), match: "exact" as const },
  { ...regular("holländer", "holländer"), match: "exact" as const },
  { ...regular("engländer", "engländer"), match: "exact" as const },
  { ...regular("thailänder", "thailänder"), match: "exact" as const },
  { ...regular("indonesier", "indonesier"), match: "exact" as const },
  { ...regular("philippiner", "philippiner"), match: "exact" as const },
  { ...weak("portugies", "portugiese", "portugiesen"), match: "exact" as const },
  { ...regular("luxemburger", "luxemburger"), match: "exact" as const },
  { ...regular("bosnier", "bosnier"), match: "exact" as const },
  { ...regular("montenegriner", "montenegriner"), match: "exact" as const },
  { ...regular("litauer", "litauer"), match: "exact" as const },
  { ...regular("georgier", "georgier"), match: "exact" as const },
  { ...regular("armenier", "armenier"), match: "exact" as const },
  { ...weak("kasach", "kasache", "kasachen"), match: "exact" as const },
  { ...weak("kosovar", "kosovare", "kosovaren"), match: "exact" as const },
  { ...weak("belaruss", "belarusse", "belarussen"), match: "exact" as const },
  { ...weak("mongol", "mongole", "mongolen"), match: "exact" as const },
  { ...weak("tadschik", "tadschike", "tadschiken"), match: "exact" as const },
  { ...weak("usbek", "usbeke", "usbeken"), match: "exact" as const },
  { ...weak("kirgis", "kirgise", "kirgisen"), match: "exact" as const },
  { ...weak("turkmen", "turkmene", "turkmenen"), match: "exact" as const },
  { ...weak("nepales", "nepalese", "nepalesen"), match: "exact" as const },
  { ...regular("aserbaidschaner", "aserbaidschaner"), match: "exact" as const },
  { ...regular("mazedonier", "mazedonier"), match: "exact" as const },
  { ...regular("moldauer", "moldauer"), match: "exact" as const },
  { ...regular("bahamaer", "bahamaer"), match: "exact" as const },
  { ...regular("bahrainer", "bahrainer"), match: "exact" as const },
  { ...regular("bangladescher", "bangladescher"), match: "exact" as const },
  { ...regular("barbadier", "barbadier"), match: "exact" as const },
  { ...regular("belizer", "belizer"), match: "exact" as const },
  { ...regular("beniner", "beniner"), match: "exact" as const },
  { ...regular("bhutaner", "bhutaner"), match: "exact" as const },
  { ...regular("bolivianer", "bolivianer"), match: "exact" as const },
  { ...regular("botsuaner", "botsuaner"), match: "exact" as const },
  { ...regular("bruneier", "bruneier"), match: "exact" as const },
  { ...regular("burkiner", "burkiner"), match: "exact" as const },
  { ...regular("burundier", "burundier"), match: "exact" as const },
  ...nationalityPersonForms,
  regular("graveur", "graveure"),
  regular("rotisseur", "rotisseure"),
  regular("poissonnier", "poissonniers"),
  regular("desinfektor", "desinfektoren"),
  regular("präparator", "präparatoren"),
  regular("repetitor", "repetitoren"),
  regular("arrangeur", "arrangeure"),
  regular("gardemanger", "gardemangers"),
  regular("prior", "prioren"),
  weak("reprograf"),
  weak("modist"),
  weak("visagist"),
  weak("katechet"),
  weak("kartograf"),
  weak("galerist"),
  weak("chemigraf"),
  weak("flexograf"),
  weak("illusionist"),
  weak("humorist"),
  weak("orientalist"),
  regular("polier", "poliere"),
  regular("platzwart", "platzwarte"),
  regular("orchesterwart", "orchesterwarte"),
  regular("galvaniseur", "galvaniseure"),
  regular("kalkulator", "kalkulatoren"),
  regular("stuckateur", "stuckateure"),
  regular("dokumentar", "dokumentare"),
  regular("registrator", "registratoren"),
  regular("konservator", "konservatoren"),
  regular("requisiteur", "requisiteure"),
  regular("juwelier", "juweliere"),
  regular("kastellan", "kastellane"),
  weak("typist"),
  weak("telefonist"),
  weak("dozent"),
  weak("pharmakant"),
  weak("expedient"),
  weak("drogist"),
  weak("pharmazeut"),
  weak("maschinist"),
  weak("chemikant"),
  weak("fachlagerist"),
  weak("orthoptist"),
  weak("hochschulabsolvent"),
  weak("psychotherapeut"),
  regular("psychiater", "psychiater"),
  regular("administrator", "administratoren"),
  regular("bibliothekar", "bibliothekare"),
  regular("parlamentarier", "parlamentarier"),
  regular("unteroffizier", "unteroffiziere"),
  regular("supervisor", "supervisoren"),
  regular("koordinator", "koordinatoren"),
  regular("organisator", "organisatoren"),
  regular("kommissar", "kommissare"),
  regular("kontrolleur", "kontrolleure"),
  regular("investor", "investoren"),
  regular("inspektor", "inspektoren"),
  regular("moderator", "moderatoren"),
  regular("redakteur", "redakteure"),
  regular("ingenieur", "ingenieure"),
  regular("professor", "professoren"),
  regular("direktor", "direktoren"),
  regular("funktionär", "funktionäre"),
  regular("aktionär", "aktionäre"),
  regular("sekretär", "sekretäre"),
  regular("millionär", "millionäre"),
  regular("pensionär", "pensionäre"),
  regular("regisseur", "regisseure"),
  regular("sponsor", "sponsoren"),
  regular("mentor", "mentoren"),
  regular("lektor", "lektoren"),
  regular("rektor", "rektoren"),
  regular("offizier", "offiziere"),
  regular("minister", "minister"),
  regular("kanzler", "kanzler"),
  regular("techniker", "techniker"),
  regular("übersetzer", "übersetzer"),
  regular("lehrling", "lehrlinge", "lehrling", "lehrlings"),
  regular("akteur", "akteure"),
  regular("friseur", "friseure"),
  regular("frisör", "frisöre"),
  regular("notar", "notare"),
  regular("volontär", "volontäre"),
  regular("revolutionär", "revolutionäre"),
  regular("pastor", "pastoren", "pastor", "pastors"),
  regular("autor", "autoren"),
  regular("freund", "freunde", "freund", "freundes"),
  regular("könig", "könige", "könig", "königs"),
  regular("chef", "chefs", "chef", "chefs"),
  regular("wirt", "wirte", "wirt", "wirts"),
  weak("interessent"),
  weak("abonnent"),
  weak("adressat"),
  weak("absolvent"),
  weak("habilitand"),
  weak("doktorand"),
  weak("praktikant"),
  weak("präsident"),
  weak("lieferant"),
  weak("demonstrant"),
  weak("diskutant"),
  weak("dissident"),
  weak("produzent"),
  weak("referent"),
  weak("respondent"),
  weak("konsument"),
  weak("konkurrent"),
  weak("korrespondent"),
  weak("assistent"),
  weak("agent"),
  weak("informant"),
  weak("laborant"),
  weak("klient"),
  weak("journalist"),
  weak("komponist"),
  weak("fotograf"),
  weak("philosoph"),
  weak("prophet"),
  weak("protestant"),
  weak("chirurg"),
  weak("architekt"),
  weak("therapeut"),
  weak("astronaut"),
  weak("polizist"),
  weak("kapitalist"),
  weak("sozialist"),
  weak("spezialist"),
  weak("terrorist"),
  weak("aktivist"),
  weak("tourist"),
  weak("migrant"),
  weak("mandant"),
  weak("kandidat"),
  weak("diplomat"),
  weak("demokrat"),
  weak("veteran"),
  weak("student"),
  weak("patient"),
  weak("experte", "experte", "experten"),
  weak("expert", "experte", "experten"),
  weak("soldat"),
  weak("athlet"),
  weak("jurist"),
  weak("pilot"),
  weak("poet"),
  {
    stem: "herr",
    singular: "herr",
    feminineSingular: "herrin",
    obliqueSingular: "herrn",
    genitiveSingular: "herrn",
    plural: "herren"
  },
  weak("narr"),
  weak("prinz"),
  weak("held"),
  weak("mensch"),
  weak("nachbar", "nachbar", "nachbarn"),
  weak("kolleg", "kollege", "kollegen"),
  weak("pädagog", "pädagoge", "pädagogen"),
  weak("psycholog", "psychologe", "psychologen"),
  weak("biolog", "biologe", "biologen"),
  weak("soziolog", "soziologe", "soziologen"),
  weak("theolog", "theologe", "theologen"),
  weak("geolog", "geologe", "geologen"),
  weak("archäolog", "archäologe", "archäologen"),
  weak("anthropolog", "anthropologe", "anthropologen"),
  weak("ökolog", "ökologe", "ökologen"),
  weak("zoolog", "zoologe", "zoologen"),
  { ...weak("zeitzeug", "zeitzeuge", "zeitzeugen"), match: "exact" as const },
  { ...weak("augenzeug", "augenzeuge", "augenzeugen"), match: "exact" as const },
  { ...weak("zeug", "zeuge", "zeugen"), match: "exact" as const },
  { ...weak("postbot", "postbote", "postboten"), match: "exact" as const },
  { ...weak("bot", "bote", "boten"), match: "exact" as const },
  { ...weak("miterb", "miterbe", "miterben"), match: "exact" as const },
  { ...weak("erb", "erbe", "erben"), match: "exact" as const },
  { ...weak("lai", "laie", "laien"), match: "exact" as const },
  weak("genoss", "genosse", "genossen"),
  weak("insass", "insasse", "insassen"),
  weak("kund", "kunde", "kunden"),
  {
    stem: "beamt",
    singular: "beamter",
    feminineSingular: "beamtin",
    obliqueSingular: "beamten",
    genitiveSingular: "beamten",
    plural: "beamte"
  },
  {
    stem: "vorständ",
    singular: "vorstand",
    feminineSingular: "vorständin",
    genitiveSingular: "vorstandes",
    plural: "vorstände"
  },
  {
    stem: "männ",
    singular: "mann",
    feminineSingular: "männin",
    genitiveSingular: "mannes",
    plural: "männer",
    match: "exact" as const
  },
  { stem: "kaufleut", plural: "kaufleute", match: "exact" as const },
  { stem: "köch", plural: "köche", match: "exact" as const },
  {
    stem: "anwält",
    singular: "anwalt",
    feminineSingular: "anwältin",
    genitiveSingular: "anwalts",
    plural: "anwälte"
  },
  {
    stem: "gäst",
    singular: "gast",
    feminineSingular: "gästin",
    genitiveSingular: "gastes",
    plural: "gäste"
  },
  {
    stem: "bischöf",
    singular: "bischof",
    feminineSingular: "bischöfin",
    genitiveSingular: "bischofs",
    plural: "bischöfe"
  },
  { ...regular("päpst", "päpste", "papst", "papstes"), match: "exact" as const },
  {
    stem: "rät",
    singular: "rat",
    feminineSingular: "rätin",
    genitiveSingular: "rates",
    plural: "räte"
  },
  {
    stem: "koch",
    singular: "koch",
    feminineSingular: "köchin",
    genitiveSingular: "koches",
    plural: "köche"
  },
  { stem: "mutter", plural: "mütter" },
  { stem: "tochter", plural: "töchter" },
  { stem: "bruder", plural: "brüder" },
  { stem: "vater", plural: "väter" },
  regular("ärzt", "ärzte", "arzt", "arztes"),
  { stem: "bäuer", plural: "bauern", match: "exact" as const },
  {
    stem: "bauer",
    singular: "bauer",
    feminineSingular: "bäuerin",
    compoundFeminineSingular: "bauerin",
    obliqueSingular: "bauern",
    plural: "bauern",
    compoundPlural: "bauer",
    match: "exact" as const
  }
].sort((left, right) => right.stem.length - left.stem.length);

function applyCase(source: string, replacement: string): string {
  if (source.includes("-") && replacement.includes("-")) {
    const sourceParts = source.split("-");
    const replacementParts = replacement.split("-");

    if (sourceParts.length === replacementParts.length) {
      return replacementParts
        .map((part, index) => applyCase(sourceParts[index] ?? "", part))
        .join("-");
    }
  }

  const lowerSource = source.toLocaleLowerCase(locale);
  const upperSource = source.toLocaleUpperCase(locale);

  if (source === upperSource && source !== lowerSource) {
    return replacement.toLocaleUpperCase(locale);
  }

  const sourceCharacters = [...source];
  const firstSourceCharacter = sourceCharacters[0];
  const remainingSource = sourceCharacters.slice(1).join("");

  if (
    firstSourceCharacter &&
    firstSourceCharacter === firstSourceCharacter.toLocaleUpperCase(locale) &&
    remainingSource === remainingSource.toLocaleLowerCase(locale)
  ) {
    const replacementCharacters = [...replacement];
    const firstReplacementCharacter = replacementCharacters.shift();

    return firstReplacementCharacter
      ? firstReplacementCharacter.toLocaleUpperCase(locale) +
          replacementCharacters.join("")
      : replacement;
  }

  return replacement.toLocaleLowerCase(locale);
}

function applyMapping(
  base: string,
  mapping: PersonForms,
  replacement: string
): string {
  const sourceSuffix = base.slice(-mapping.stem.length);
  const prefix = base.slice(0, -mapping.stem.length);
  return prefix + applyCase(sourceSuffix, replacement);
}

function findSingularMapping(base: string): PersonForms | undefined {
  const normalizedBase = base.toLocaleLowerCase(locale);

  return personForms.find((mapping) =>
    mapping.match === "exact"
      ? normalizedBase === mapping.stem
      : normalizedBase.endsWith(mapping.stem)
  );
}

function hasMatchingPrefixes(
  masculine: string,
  feminine: string,
  masculineSuffix: string,
  feminineSuffix: string
): boolean {
  const normalizedMasculine = masculine.toLocaleLowerCase(locale);
  const normalizedFeminine = feminine.toLocaleLowerCase(locale);

  if (
    !normalizedMasculine.endsWith(masculineSuffix) ||
    !normalizedFeminine.endsWith(feminineSuffix)
  ) {
    return false;
  }

  return (
    normalizedMasculine.slice(0, -masculineSuffix.length) ===
    normalizedFeminine.slice(0, -feminineSuffix.length)
  );
}

function hasMatchingShortenedFeminine(
  masculine: string,
  feminine: string,
  masculineSuffix: string,
  feminineSuffix: string
): boolean {
  const normalizedMasculine = masculine.toLocaleLowerCase(locale);
  const normalizedFeminine = feminine.toLocaleLowerCase(locale);

  return (
    normalizedMasculine.endsWith(masculineSuffix) &&
    normalizedFeminine === `-${feminineSuffix}`
  );
}

export function mapMappedPlural(base: string): string | undefined {
  const normalizedBase = base.toLocaleLowerCase(locale);
  const generated = getExactPersonForms(normalizedBase);

  if (generated) {
    return applyCase(base, generated.plural);
  }

  for (const mapping of personForms) {
    if (mapping.match !== "exact" && normalizedBase.endsWith(mapping.stem)) {
      return applyMapping(base, mapping, mapping.plural);
    }

    if (normalizedBase === mapping.stem) {
      return applyMapping(base, mapping, mapping.plural);
    }

    if (
      mapping.compoundPlural &&
      normalizedBase.length > mapping.stem.length &&
      normalizedBase.endsWith(mapping.stem)
    ) {
      return applyMapping(base, mapping, mapping.compoundPlural);
    }
  }

  return undefined;
}

function selectSingularForm(
  forms: GeneratedPersonForms,
  grammaticalCase: GrammaticalCase
): string | undefined {
  if (!forms.singular) {
    return undefined;
  }

  if (grammaticalCase === "nominative") {
    return forms.singular;
  }
  if (grammaticalCase === "genitive") {
    return (
      forms.genitiveSingular ??
      forms.obliqueSingular ??
      `${forms.singular}s`
    );
  }
  return forms.obliqueSingular ?? forms.singular;
}

export function mapMappedSingular(
  base: string,
  grammaticalCase: GrammaticalCase
): string | undefined {
  const normalizedBase = base.toLocaleLowerCase(locale);
  const generated = getExactPersonForms(normalizedBase);
  const generatedReplacement = generated
    ? selectSingularForm(generated, grammaticalCase)
    : undefined;

  if (generatedReplacement) {
    return applyCase(base, generatedReplacement);
  }

  const mapping = findSingularMapping(base);
  if (!mapping?.singular) {
    return undefined;
  }

  const replacement = selectSingularForm(mapping, grammaticalCase);
  return replacement ? applyMapping(base, mapping, replacement) : undefined;
}

function mapGeneratedSingularPairOrientation(
  masculine: string,
  feminine: string
): string | undefined {
  const normalizedFeminine = feminine.toLocaleLowerCase(locale);
  if (!normalizedFeminine.endsWith("in")) {
    return undefined;
  }

  const generated = getExactPersonForms(normalizedFeminine.slice(0, -2));
  if (
    !generated?.singular ||
    !generated.feminineSingular ||
    masculine.toLocaleLowerCase(locale) !== generated.singular ||
    normalizedFeminine !== generated.feminineSingular
  ) {
    return undefined;
  }

  return masculine;
}

export function mapMappedSingularPair(
  left: string,
  right: string
): string | undefined {
  const generatedDirect = mapGeneratedSingularPairOrientation(left, right);
  if (generatedDirect) {
    return generatedDirect;
  }
  const generatedReverse = mapGeneratedSingularPairOrientation(right, left);
  if (generatedReverse) {
    return generatedReverse;
  }

  for (const mapping of personForms) {
    if (!mapping.singular) {
      continue;
    }

    const feminine = mapping.feminineSingular ?? `${mapping.stem}in`;
    const direct = hasMatchingPrefixes(left, right, mapping.singular, feminine);
    const reverse = hasMatchingPrefixes(right, left, mapping.singular, feminine);
    const directShort = hasMatchingShortenedFeminine(
      left,
      right,
      mapping.singular,
      feminine
    );

    if (mapping.match !== "exact" || left.length === mapping.singular.length) {
      if (direct || (mapping.match !== "exact" && directShort)) {
        return left;
      }
    }

    if (mapping.match !== "exact" || right.length === mapping.singular.length) {
      if (reverse) {
        return right;
      }
    }

    if (!mapping.compoundFeminineSingular) {
      continue;
    }

    if (
      hasMatchingPrefixes(
        left,
        right,
        mapping.singular,
        mapping.compoundFeminineSingular
      )
    ) {
      return left;
    }

    if (
      hasMatchingPrefixes(
        right,
        left,
        mapping.singular,
        mapping.compoundFeminineSingular
      )
    ) {
      return right;
    }
  }

  return undefined;
}

function mapGeneratedInflectedPairOrientation(
  feminine: string,
  masculine: string,
  grammaticalCase: GrammaticalCase
): string | undefined {
  const normalizedFeminine = feminine.toLocaleLowerCase(locale);
  if (!normalizedFeminine.endsWith("in")) {
    return undefined;
  }

  const generated = getExactPersonForms(normalizedFeminine.slice(0, -2));
  const expectedMasculine = generated
    ? selectSingularForm(generated, grammaticalCase)
    : undefined;
  if (
    !generated?.feminineSingular ||
    !expectedMasculine ||
    normalizedFeminine !== generated.feminineSingular ||
    masculine.toLocaleLowerCase(locale) !== expectedMasculine
  ) {
    return undefined;
  }

  return masculine;
}

export function mapMappedInflectedSingularPair(
  left: string,
  right: string,
  grammaticalCase: GrammaticalCase
): string | undefined {
  const generatedDirect = mapGeneratedInflectedPairOrientation(
    left,
    right,
    grammaticalCase
  );
  if (generatedDirect) {
    return generatedDirect;
  }
  const generatedReverse = mapGeneratedInflectedPairOrientation(
    right,
    left,
    grammaticalCase
  );
  if (generatedReverse) {
    return generatedReverse;
  }

  for (const mapping of personForms) {
    if (!mapping.singular) {
      continue;
    }

    const masculine =
      grammaticalCase === "nominative"
        ? mapping.singular
        : grammaticalCase === "genitive"
          ? mapping.genitiveSingular ??
            mapping.obliqueSingular ??
            `${mapping.singular}s`
          : mapping.obliqueSingular ?? mapping.singular;
    const feminine = mapping.feminineSingular ?? `${mapping.stem}in`;

    if (hasMatchingPrefixes(left, right, feminine, masculine)) {
      return right;
    }
    if (hasMatchingPrefixes(right, left, feminine, masculine)) {
      return left;
    }

    if (!mapping.compoundFeminineSingular) {
      continue;
    }
    if (
      hasMatchingPrefixes(
        left,
        right,
        mapping.compoundFeminineSingular,
        masculine
      )
    ) {
      return right;
    }
    if (
      hasMatchingPrefixes(
        right,
        left,
        mapping.compoundFeminineSingular,
        masculine
      )
    ) {
      return left;
    }
  }

  return undefined;
}