import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";
import {
  getReviewedPersonFormsWave81,
  reviewedPersonFormCountWave81
} from "../src/rules/reviewed-person-forms-wave-81";

const cases = [
  ["abbrecher", "abbrecher", "abbrecher", "abbrecherin", "abbrecher", "abbrechers"],
  ["abwander", "abwanderer", "abwanderer", "abwanderin", "abwanderer", "abwanderers"],
  ["adjunkt", "adjunkten", "adjunkt", "adjunktin", "adjunkten", "adjunkten"],
  ["allergolog", "allergologen", "allergologe", "allergologin", "allergologen", "allergologen"],
  ["aggressor", "aggressoren", "aggressor", "aggressorin", "aggressor", "aggressors"],
  ["bastard", "bastarde", "bastard", "bastardin", "bastard", "bastards"],
  ["bergbäuer", "bergbauern", "bergbauer", "bergbäuerin", "bergbauern", "bergbauern"],
  ["bürg", "bürgen", "bürge", "bürgin", "bürgen", "bürgen"],
  ["chilen", "chilenen", "chilene", "chilenin", "chilenen", "chilenen"],
  ["destinatär", "destinatäre", "destinatär", "destinatärin", "destinatär", "destinatärs"],
  ["dompteur", "dompteure", "dompteur", "dompteurin", "dompteur", "dompteurs"],
  ["gräf", "grafen", "graf", "gräfin", "grafen", "grafen"],
  ["greis", "greise", "greis", "greisin", "greis", "greises"],
  ["myanmar", "myanmaren", "myanmare", "myanmarin", "myanmaren", "myanmaren"],
  ["mythograf", "mythografen", "mythograf", "mythografin", "mythografen", "mythografen"],
  ["nachfahr", "nachfahren", "nachfahre", "nachfahrin", "nachfahren", "nachfahren"]
] as const;

describe("einundachtzigste Lexikon-Ausbauwelle", () => {
  it("enthält exakt 248 vollständig geprüfte Scribbr-Mappings", () => {
    expect(reviewedPersonFormCountWave81).toBe(248);
  });

  it.each(cases)(
    "bildet die geprüften Vollformen für %s korrekt ab",
    (base, plural, singular, feminine, oblique, genitive) => {
      expect(getReviewedPersonFormsWave81(base), base).toEqual({
        plural,
        singular,
        feminineSingular: feminine,
        obliqueSingular: oblique,
        genitiveSingular: genitive
      });
    }
  );

  it.each(["general", "mieterinnenvere"])(
    "hält den verworfenen Kandidaten %s aus Welle 81 heraus",
    (base) => {
      expect(getReviewedPersonFormsWave81(base)).toBeUndefined();
    }
  );

  it.each(["General:innen", "mieterinnenvere:innen"])(
    "lässt den verworfenen Separatorfall %s unverändert",
    (input) => {
      expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
        text: input,
        replacements: 0
      });
    }
  );

  it.each(cases)(
    "ersetzt den geprüften Plural für %s",
    (base, plural) => {
      expect(mappedPluralSeparatorsRule.apply(`${base}:innen`)).toEqual({
        text: plural,
        replacements: 1
      });
    }
  );

  it.each(cases)(
    "erkennt das geprüfte Singularpaar für %s",
    (_base, _plural, singular, feminine) => {
      expect(mapMappedSingularPair(singular, feminine)).toBe(singular);
    }
  );

  it.each(cases)(
    "bildet die geprüften Kasusformen für %s korrekt ab",
    (base, _plural, singular, _feminine, oblique, genitive) => {
      expect(mapMappedSingular(base, "nominative")).toBe(singular);
      expect(mapMappedSingular(base, "accusative")).toBe(oblique);
      expect(mapMappedSingular(base, "dative")).toBe(oblique);
      expect(mapMappedSingular(base, "genitive")).toBe(genitive);
    }
  );
});