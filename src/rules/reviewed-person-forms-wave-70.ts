import type { GeneratedPersonForms } from "./generated-person-lexicon";

// Quellenneutraler, exakt freigegebener Zusatzbestand aus Welle 70.
// Die Formen sind explizit hinterlegt; daraus wird keine generische Suffixregel abgeleitet.
const reviewedForms: ReadonlyMap<string, GeneratedPersonForms> = new Map([
  [
    "branntweinbrenner",
    {
      plural: "branntweinbrenner",
      singular: "branntweinbrenner",
      feminineSingular: "branntweinbrennerin",
      obliqueSingular: "branntweinbrenner",
      genitiveSingular: "branntweinbrenners"
    }
  ],
  [
    "likörbrenner",
    {
      plural: "likörbrenner",
      singular: "likörbrenner",
      feminineSingular: "likörbrennerin",
      obliqueSingular: "likörbrenner",
      genitiveSingular: "likörbrenners"
    }
  ],
  [
    "schnapsbrenner",
    {
      plural: "schnapsbrenner",
      singular: "schnapsbrenner",
      feminineSingular: "schnapsbrennerin",
      obliqueSingular: "schnapsbrenner",
      genitiveSingular: "schnapsbrenners"
    }
  ],
  [
    "silberschläger",
    {
      plural: "silberschläger",
      singular: "silberschläger",
      feminineSingular: "silberschlägerin",
      obliqueSingular: "silberschläger",
      genitiveSingular: "silberschlägers"
    }
  ],
  [
    "strichätzer",
    {
      plural: "strichätzer",
      singular: "strichätzer",
      feminineSingular: "strichätzerin",
      obliqueSingular: "strichätzer",
      genitiveSingular: "strichätzers"
    }
  ],
  [
    "zementbrenner",
    {
      plural: "zementbrenner",
      singular: "zementbrenner",
      feminineSingular: "zementbrennerin",
      obliqueSingular: "zementbrenner",
      genitiveSingular: "zementbrenners"
    }
  ],
  [
    "ziegelbrenner",
    {
      plural: "ziegelbrenner",
      singular: "ziegelbrenner",
      feminineSingular: "ziegelbrennerin",
      obliqueSingular: "ziegelbrenner",
      genitiveSingular: "ziegelbrenners"
    }
  ],
  [
    "zigarrenroller",
    {
      plural: "zigarrenroller",
      singular: "zigarrenroller",
      feminineSingular: "zigarrenrollerin",
      obliqueSingular: "zigarrenroller",
      genitiveSingular: "zigarrenrollers"
    }
  ]
]);

export const reviewedPersonFormCountWave70 = reviewedForms.size;

export function getReviewedPersonFormsWave70(
  normalizedBase: string
): GeneratedPersonForms | undefined {
  return reviewedForms.get(normalizedBase);
}
