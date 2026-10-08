import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import { mapMappedSingular, mapMappedSingularPair } from "../src/rules/person-lexicon";
import { getReviewedPersonFormsWave83, reviewedPersonFormCountWave83 } from "../src/rules/reviewed-person-forms-wave-83";

// Unabhängig aufgeschriebene Stichprobe für Lexik, Plural und Kasus.
const beispiele = [
  [
    "achtklässler",
    "achtklässler",
    "achtklässlerin",
    "achtklässlers"
  ],
  [
    "berufskomiker",
    "berufskomiker",
    "berufskomikerin",
    "berufskomikers"
  ],
  [
    "deutsch-afrikaner",
    "deutsch-afrikaner",
    "deutsch-afrikanerin",
    "deutsch-afrikaners"
  ],
  [
    "hinterwäldler",
    "hinterwäldler",
    "hinterwäldlerin",
    "hinterwäldlers"
  ],
  [
    "kirchgänger",
    "kirchgänger",
    "kirchgängerin",
    "kirchgängers"
  ],
  [
    "pkw-lenker",
    "pkw-lenker",
    "pkw-lenkerin",
    "pkw-lenkers"
  ],
  [
    "weltrekordhalter",
    "weltrekordhalter",
    "weltrekordhalterin",
    "weltrekordhalters"
  ],
  [
    "zwölftklässler",
    "zwölftklässler",
    "zwölftklässlerin",
    "zwölftklässlers"
  ]
] as const;

// Unvollständige Stämme, Sachwörter und Sonderflexionen bleiben ausgeschlossen.
const ausgeschlosseneBasen = [
  "bierwander",
  "gender",
  "israel",
  "klassenclown",
  "kulturpessimist",
  "strandwander",
  "warenimporteur",
  "zauber",
  "zimmer",
  "zuliefer"
] as const;

describe("dreiundachtzigste Lexikon-Ausbauwelle", () => {
  it("enthält genau 142 geprüfte Exaktbasen", () => {
    expect(reviewedPersonFormCountWave83).toBe(142);
  });

  it.each(beispiele)("bildet die vollständigen Flexionsformen für %s ab", (base, plural, feminine, genitive) => {
    expect(getReviewedPersonFormsWave83(base)).toEqual({
      plural, singular: base, feminineSingular: feminine,
      obliqueSingular: base, genitiveSingular: genitive
    });
    expect(mappedPluralSeparatorsRule.apply(`${base}:innen`)).toEqual({
      text: plural, replacements: 1
    });
    expect(mapMappedSingularPair(base, feminine)).toBe(base);
    expect(mapMappedSingular(base, "nominative")).toBe(base);
    expect(mapMappedSingular(base, "genitive")).toBe(genitive);
  });

  it.each(ausgeschlosseneBasen)("schließt %s gezielt aus", (base) => {
    expect(getReviewedPersonFormsWave83(base)).toBeUndefined();
  });

  it("verändert weder unmarkierte Wörter noch fremde Wortendungen", () => {
    expect(mappedPluralSeparatorsRule.apply("Aachener")).toEqual({ text: "Aachener", replacements: 0 });
    expect(getReviewedPersonFormsWave83("aachenerfirma")).toBeUndefined();
  });
});
