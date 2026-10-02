import type { GeneratedPersonForms } from "./generated-person-lexicon";
import { getReviewedPersonFormsWave70 } from "./reviewed-person-forms-wave-70";
import { getReviewedPersonFormsWave71 } from "./reviewed-person-forms-wave-71";
import { getReviewedPersonFormsWave72 } from "./reviewed-person-forms-wave-72";
import { getReviewedPersonFormsWave73 } from "./reviewed-person-forms-wave-73";
import { getReviewedPersonFormsWave74 } from "./reviewed-person-forms-wave-74";
import { getReviewedPersonFormsWave75 } from "./reviewed-person-forms-wave-75";
import { getReviewedPersonFormsWave76 } from "./reviewed-person-forms-wave-76";


// Quellenneutraler, exakt freigegebener Zusatzbestand.
// Die Mengen sind Allow-Lists: Ableitungen gelten nur nach exaktem Basistreffer.
const unchangedForms: ReadonlySet<string> = new Set([
  "handdrucker",
  "handpressendrucker",
  "hilfsschlosser",
  "hochdrucker",
  "hochdruckrohrschlosser",
  "hydraulikschlosser",
  "illustrationsdrucker",
  "industrieschreiner",
  "innenausbauschreiner",
  "intarsienschreiner",
  "jalousieschlosser",
  "karosserieschlosser",
  "keramikdrucker",
  "kesselschlosser",
  "kfz-schlosser",
  "kleinoffsetdrucker",
  "konstruktionsschlosser",
  "kraftfahrzeugmotorenschlosser",
  "kraftfahrzeugschlosser",
  "kranbauschlosser",
  "kranschlosser",
  "kundendienstschreiner",
  "kunstdrucker",
  "kunstschlosser",
  "kunstschreiner",
  "kunststoffschlosser",
  "landkartendrucker",
  "landmaschinenschlosser",
  "laufschlosser",
  "lederdrucker",
  "lichtdrucker",
  "lieferschreiner",
  "linoleumdrucker",
  "lkw-schlosser",
  "maschinendrucker",
  "maschinenschlosser",
  "messeschreiner",
  "metallbauschlosser",
  "metallschlosser",
  "modellschlosser",
  "modellschreiner",
  "montageschlosser",
  "motorenschlosser",
  "motorradschlosser",
  "musterdrucker",
  "möbelschlosser",
  "möbelschreiner",
  "mühlenbauschlosser",
  "notendrucker",
  "obergärigbrauer",
  "offsetdrucker",
  "pkw-schlosser",
  "plattendrucker",
  "pneumatikschlosser",
  "porzellandrucker",
  "rahmenschlosser",
  "reliefdrucker",
  "rohrnetzschlosser",
  "rohrschlosser",
  "rollendrucker",
  "rollensiebdrucker",
  "rolltorschlosser",
  "rotaprintdrucker",
  "rotationsdrucker",
  "rotationsillustrationsdrucker",
  "rotationssiebdrucker",
  "rotationsstoffdrucker",
  "rotationstiefdrucker",
  "rouleauxdrucker",
  "sargschreiner",
  "schaltungsdrucker",
  "schienenfahrzeugschlosser",
  "schiffbauschlosser",
  "schiffsbetriebsschlosser",
  "schiffsmaschinenschlosser",
  "schlosser",
  "schreiner",
  "schwarzblechschlosser",
  "siebdrucker",
  "spezialdrucker",
  "spezialwerkzeugschlosser",
  "stahlbauschlosser",
  "stahlbüromöbelschlosser",
  "stahldrucker",
  "stahlkonstruktionsschlosser",
  "stahlmöbelschlosser",
  "steindrucker",
  "stellwerkschlosser",
  "stuhlschreiner",
  "tapetendrucker",
  "tapetenmaschinendrucker",
  "textildrucker",
  "tiefdrucker",
  "tiefdruckrotationsdrucker",
  "traktorenschlosser",
  "transparentdrucker",
  "turbinenschlosser",
  "verpackungsdrucker",
  "waagenbauschlosser",
  "wachstuchdrucker",
  "waggonbauschlosser",
  "weizenbierbrauer",
  "weißbierbrauer",
  "zeitschriftendrucker",
  "zeitungsrotationsdrucker",
  "zellglasdrucker",
  "zifferblattdrucker",
  "zinkdrucker",
  "ölfarbendrucker"
]);
const weakEnForms: ReadonlySet<string> = new Set([
  "immobilienanalyst",
  "investmentanalyst",
  "kreditanalyst",
  "portfolioanalyst",
  "rating-analyst",
  "rentenanalyst",
  "risikoanalyst",
  "wertpapieranalyst"
]);
const pluralEnForms: ReadonlySet<string> = new Set([
  "harmoniumrestaurator",
  "holzmöbelrestaurator",
  "holzrestaurator",
  "innenrevisor",
  "krankenversicherungsrevisor",
  "kreditrevisor",
  "kunstrestaurator",
  "lederrestaurator",
  "museumsrestaurator",
  "möbelrestaurator",
  "orientteppichrestaurator",
  "papierrestaurator",
  "parkettrestaurator",
  "plastikrestaurator",
  "posaunenrestaurator",
  "revisor",
  "sandsteinrestaurator",
  "skulpturenrestaurator",
  "sparkassenrevisor",
  "stuckrestaurator",
  "textilrestaurator",
  "trompetenrestaurator",
  "uhrenrestaurator",
  "verbandsrevisor",
  "versicherungsrevisor"
]);
const gehilfForms: ReadonlySet<string> = new Set([
  "gärtnergehilf",
  "gürtlergehilf",
  "handlungsgehilf",
  "hauswirtschaftsgehilf",
  "holländergehilf",
  "hotelgehilf",
  "imkergehilf",
  "kantinengehilf",
  "kassengehilf",
  "kaufmannsgehilf",
  "kellereigehilf",
  "kochgehilf",
  "kraftfahrzeugwerkstattgehilf",
  "käsereigehilf",
  "küchengehilf",
  "melkergehilf",
  "metzgergehilf",
  "notargehilf",
  "pappmaschinengehilf",
  "patentanwaltsgehilf",
  "pelztierzuchtgehilf",
  "pensionsgehilf",
  "pressergehilf",
  "rechtsanwaltsgehilf",
  "rechtsbeistandsgehilf",
  "redaktionsgehilf",
  "rollapparatgehilf",
  "rollmaschinengehilf",
  "rundsiebmaschinengehilf",
  "schankgehilf",
  "schlachtergehilf",
  "schleusengehilf",
  "schweinezuchtgehilf",
  "schwimmmeistergehilf",
  "sprengmeistergehilf",
  "steuerberatergehilf",
  "steuerberatungsgehilf",
  "steuerfachgehilf",
  "steuergehilf",
  "trockenmaschinengehilf",
  "umrollergehilf",
  "vermessungsgehilf",
  "vertriebsgehilf",
  "verwaltungsgehilf",
  "weinbaugehilf",
  "werkgehilf",
  "winzergehilf",
  "wärmestellengehilf",
  "wäschereigehilf"
]);
const koechForms: ReadonlySet<string> = new Set([
  "grillköch",
  "großküchenköch",
  "hilfsköch",
  "hotelköch",
  "jungköch",
  "kaltspeisenköch",
  "kantinenköch",
  "kasinoköch",
  "mannschaftsköch",
  "messeköch",
  "oberköch",
  "partyserviceköch",
  "restaurantköch",
  "salatköch",
  "schiffsköch",
  "soßenköch",
  "speisewagenköch",
  "spezialitätenköch",
  "süßspeisenköch",
  "teilköch",
  "vollwertköch",
  "vorspeisenköch"
]);
const baeuerForms: ReadonlySet<string> = new Set([
  "hopfenbäuer",
  "karpfenbäuer",
  "kohlbäuer",
  "krautbäuer",
  "obstbäuer",
  "rebbäuer",
  "teichbäuer",
  "weinbäuer",
  "ökobäuer"
]);

export const reviewedPersonFormCount =
  unchangedForms.size +
  weakEnForms.size +
  pluralEnForms.size +
  gehilfForms.size +
  koechForms.size +
  baeuerForms.size;

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

export function getReviewedPersonForms(
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
  if (gehilfForms.has(normalizedBase)) {
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
  if (koechForms.has(normalizedBase)) {
    const singular = `${normalizedBase.slice(0, -4)}koch`;
    return {
      plural: `${normalizedBase}e`,
      singular,
      feminineSingular: `${normalizedBase}in`,
      obliqueSingular: singular,
      genitiveSingular: `${singular}s`
    };
  }
  if (baeuerForms.has(normalizedBase)) {
    const prefix = normalizedBase.slice(0, -5);
    const singular = `${prefix}bauer`;
    const inflected = `${prefix}bauern`;
    return {
      plural: inflected,
      singular,
      feminineSingular: `${normalizedBase}in`,
      obliqueSingular: inflected,
      genitiveSingular: inflected
    };
  }
  return (
    getReviewedPersonFormsWave70(normalizedBase) ??
    getReviewedPersonFormsWave71(normalizedBase) ??
    getReviewedPersonFormsWave72(normalizedBase) ??
    getReviewedPersonFormsWave73(normalizedBase) ??
    getReviewedPersonFormsWave74(normalizedBase) ??
    getReviewedPersonFormsWave75(normalizedBase) ??
    getReviewedPersonFormsWave76(normalizedBase)
  );
}