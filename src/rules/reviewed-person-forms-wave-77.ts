import type { GeneratedPersonForms } from "./generated-person-lexicon";

// Quellenneutraler, exakt freigegebener Zusatzbestand aus Welle 77.
// Die ESCO-Neufunde werden ausschließlich als geprüfte Einzelmappings übernommen.
const reviewedForms: ReadonlyMap<string, GeneratedPersonForms> = new Map([
  [
    "automatenstricker",
    {
      plural: "automatenstricker",
      singular: "automatenstricker",
      feminineSingular: "automatenstrickerin",
      obliqueSingular: "automatenstricker",
      genitiveSingular: "automatenstrickers"
    }
  ],
  [
    "chemieproduktemischer",
    {
      plural: "chemieproduktemischer",
      singular: "chemieproduktemischer",
      feminineSingular: "chemieproduktemischerin",
      obliqueSingular: "chemieproduktemischer",
      genitiveSingular: "chemieproduktemischers"
    }
  ],
  [
    "farbmischer",
    {
      plural: "farbmischer",
      singular: "farbmischer",
      feminineSingular: "farbmischerin",
      obliqueSingular: "farbmischer",
      genitiveSingular: "farbmischers"
    }
  ],
  [
    "feuerwehrpumpenwart",
    {
      plural: "feuerwehrpumpenwarte",
      singular: "feuerwehrpumpenwart",
      feminineSingular: "feuerwehrpumpenwartin",
      obliqueSingular: "feuerwehrpumpenwart",
      genitiveSingular: "feuerwehrpumpenwarts"
    }
  ],
  [
    "haussitter",
    {
      plural: "haussitter",
      singular: "haussitter",
      feminineSingular: "haussitterin",
      obliqueSingular: "haussitter",
      genitiveSingular: "haussitters"
    }
  ],
  [
    "holzwerkstoffplattenklassierer",
    {
      plural: "holzwerkstoffplattenklassierer",
      singular: "holzwerkstoffplattenklassierer",
      feminineSingular: "holzwerkstoffplattenklassiererin",
      obliqueSingular: "holzwerkstoffplattenklassierer",
      genitiveSingular: "holzwerkstoffplattenklassierers"
    }
  ],
  [
    "instruktor",
    {
      plural: "instruktoren",
      singular: "instruktor",
      feminineSingular: "instruktorin",
      obliqueSingular: "instruktor",
      genitiveSingular: "instruktors"
    }
  ],
  [
    "kalanderbügler",
    {
      plural: "kalanderbügler",
      singular: "kalanderbügler",
      feminineSingular: "kalanderbüglerin",
      obliqueSingular: "kalanderbügler",
      genitiveSingular: "kalanderbüglers"
    }
  ],
  [
    "kostenanalyst",
    {
      plural: "kostenanalysten",
      singular: "kostenanalyst",
      feminineSingular: "kostenanalystin",
      obliqueSingular: "kostenanalysten",
      genitiveSingular: "kostenanalysten"
    }
  ],
  [
    "maschinenstricker",
    {
      plural: "maschinenstricker",
      singular: "maschinenstricker",
      feminineSingular: "maschinenstrickerin",
      obliqueSingular: "maschinenstricker",
      genitiveSingular: "maschinenstrickers"
    }
  ],
  [
    "metallnieter",
    {
      plural: "metallnieter",
      singular: "metallnieter",
      feminineSingular: "metallnieterin",
      obliqueSingular: "metallnieter",
      genitiveSingular: "metallnieters"
    }
  ],
  [
    "pestizidmischer",
    {
      plural: "pestizidmischer",
      singular: "pestizidmischer",
      feminineSingular: "pestizidmischerin",
      obliqueSingular: "pestizidmischer",
      genitiveSingular: "pestizidmischers"
    }
  ],
  [
    "pumpenwart",
    {
      plural: "pumpenwarte",
      singular: "pumpenwart",
      feminineSingular: "pumpenwartin",
      obliqueSingular: "pumpenwart",
      genitiveSingular: "pumpenwarts"
    }
  ],
  [
    "rigger",
    {
      plural: "rigger",
      singular: "rigger",
      feminineSingular: "riggerin",
      obliqueSingular: "rigger",
      genitiveSingular: "riggers"
    }
  ],
  [
    "tufter",
    {
      plural: "tufter",
      singular: "tufter",
      feminineSingular: "tufterin",
      obliqueSingular: "tufter",
      genitiveSingular: "tufters"
    }
  ],
  [
    "veranstaltungs-rigger",
    {
      plural: "veranstaltungs-rigger",
      singular: "veranstaltungs-rigger",
      feminineSingular: "veranstaltungs-riggerin",
      obliqueSingular: "veranstaltungs-rigger",
      genitiveSingular: "veranstaltungs-riggers"
    }
  ],
  [
    "veranstaltungsrigger",
    {
      plural: "veranstaltungsrigger",
      singular: "veranstaltungsrigger",
      feminineSingular: "veranstaltungsriggerin",
      obliqueSingular: "veranstaltungsrigger",
      genitiveSingular: "veranstaltungsriggers"
    }
  ]
]);

export const reviewedPersonFormCountWave77 = reviewedForms.size;

export function getReviewedPersonFormsWave77(
  normalizedBase: string
): GeneratedPersonForms | undefined {
  return reviewedForms.get(normalizedBase);
}
