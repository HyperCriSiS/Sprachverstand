import type { GeneratedPersonForms } from "./generated-person-lexicon";

// Quellenneutraler, exakt freigegebener Zusatzbestand aus Welle 71.
// Die Formen sind explizit hinterlegt; daraus wird keine generische Suffixregel abgeleitet.
const reviewedForms: ReadonlyMap<string, GeneratedPersonForms> = new Map([
  [
    "branntsteinbrenner",
    {
      plural: "branntsteinbrenner",
      singular: "branntsteinbrenner",
      feminineSingular: "branntsteinbrennerin",
      obliqueSingular: "branntsteinbrenner",
      genitiveSingular: "branntsteinbrenners"
    }
  ],
  [
    "destillatbrenner",
    {
      plural: "destillatbrenner",
      singular: "destillatbrenner",
      feminineSingular: "destillatbrennerin",
      obliqueSingular: "destillatbrenner",
      genitiveSingular: "destillatbrenners"
    }
  ],
  [
    "einzieher",
    {
      plural: "einzieher",
      singular: "einzieher",
      feminineSingular: "einzieherin",
      obliqueSingular: "einzieher",
      genitiveSingular: "einziehers"
    }
  ],
  [
    "hammerdrücker",
    {
      plural: "hammerdrücker",
      singular: "hammerdrücker",
      feminineSingular: "hammerdrückerin",
      obliqueSingular: "hammerdrücker",
      genitiveSingular: "hammerdrückers"
    }
  ],
  [
    "handflämmer",
    {
      plural: "handflämmer",
      singular: "handflämmer",
      feminineSingular: "handflämmerin",
      obliqueSingular: "handflämmer",
      genitiveSingular: "handflämmers"
    }
  ],
  [
    "kakaomahler",
    {
      plural: "kakaomahler",
      singular: "kakaomahler",
      feminineSingular: "kakaomahlerin",
      obliqueSingular: "kakaomahler",
      genitiveSingular: "kakaomahlers"
    }
  ],
  [
    "kernschwärzer",
    {
      plural: "kernschwärzer",
      singular: "kernschwärzer",
      feminineSingular: "kernschwärzerin",
      obliqueSingular: "kernschwärzer",
      genitiveSingular: "kernschwärzers"
    }
  ],
  [
    "kondensmilchsieder",
    {
      plural: "kondensmilchsieder",
      singular: "kondensmilchsieder",
      feminineSingular: "kondensmilchsiederin",
      obliqueSingular: "kondensmilchsieder",
      genitiveSingular: "kondensmilchsieders"
    }
  ],
  [
    "maschinendrücker",
    {
      plural: "maschinendrücker",
      singular: "maschinendrücker",
      feminineSingular: "maschinendrückerin",
      obliqueSingular: "maschinendrücker",
      genitiveSingular: "maschinendrückers"
    }
  ],
  [
    "metalldrücker",
    {
      plural: "metalldrücker",
      singular: "metalldrücker",
      feminineSingular: "metalldrückerin",
      obliqueSingular: "metalldrücker",
      genitiveSingular: "metalldrückers"
    }
  ],
  [
    "metallschläger",
    {
      plural: "metallschläger",
      singular: "metallschläger",
      feminineSingular: "metallschlägerin",
      obliqueSingular: "metallschläger",
      genitiveSingular: "metallschlägers"
    }
  ],
  [
    "metallätzer",
    {
      plural: "metallätzer",
      singular: "metallätzer",
      feminineSingular: "metallätzerin",
      obliqueSingular: "metallätzer",
      genitiveSingular: "metallätzers"
    }
  ],
  [
    "senger",
    {
      plural: "senger",
      singular: "senger",
      feminineSingular: "sengerin",
      obliqueSingular: "senger",
      genitiveSingular: "sengers"
    }
  ],
  [
    "universaldrücker",
    {
      plural: "universaldrücker",
      singular: "universaldrücker",
      feminineSingular: "universaldrückerin",
      obliqueSingular: "universaldrücker",
      genitiveSingular: "universaldrückers"
    }
  ],
  [
    "webgeschirreinzieher",
    {
      plural: "webgeschirreinzieher",
      singular: "webgeschirreinzieher",
      feminineSingular: "webgeschirreinzieherin",
      obliqueSingular: "webgeschirreinzieher",
      genitiveSingular: "webgeschirreinziehers"
    }
  ],
  [
    "weißbeizer",
    {
      plural: "weißbeizer",
      singular: "weißbeizer",
      feminineSingular: "weißbeizerin",
      obliqueSingular: "weißbeizer",
      genitiveSingular: "weißbeizers"
    }
  ],
  [
    "zapfer",
    {
      plural: "zapfer",
      singular: "zapfer",
      feminineSingular: "zapferin",
      obliqueSingular: "zapfer",
      genitiveSingular: "zapfers"
    }
  ],
  [
    "zinkdrücker",
    {
      plural: "zinkdrücker",
      singular: "zinkdrücker",
      feminineSingular: "zinkdrückerin",
      obliqueSingular: "zinkdrücker",
      genitiveSingular: "zinkdrückers"
    }
  ],
  [
    "zinndrücker",
    {
      plural: "zinndrücker",
      singular: "zinndrücker",
      feminineSingular: "zinndrückerin",
      obliqueSingular: "zinndrücker",
      genitiveSingular: "zinndrückers"
    }
  ],
  [
    "ätzer",
    {
      plural: "ätzer",
      singular: "ätzer",
      feminineSingular: "ätzerin",
      obliqueSingular: "ätzer",
      genitiveSingular: "ätzers"
    }
  ]
]);

export const reviewedPersonFormCountWave71 = reviewedForms.size;

export function getReviewedPersonFormsWave71(
  normalizedBase: string
): GeneratedPersonForms | undefined {
  return reviewedForms.get(normalizedBase);
}
