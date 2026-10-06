import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";
import {
  getReviewedPersonFormsWave80,
  reviewedPersonFormCountWave80
} from "../src/rules/reviewed-person-forms-wave-80";

const cases = [
  ["fachschaftler", "fachschaftler", "fachschaftler", "fachschaftlerin", "fachschaftler", "fachschaftlers"],
  ["titelhalter", "titelhalter", "titelhalter", "titelhalterin", "titelhalter", "titelhalters"],
  ["baron", "barone", "baron", "baronin", "baron", "barons"],
  ["bergkamerad", "bergkameraden", "bergkamerad", "bergkameradin", "bergkameraden", "bergkameraden"],
  ["diplomgeograph", "diplomgeographen", "diplomgeograph", "diplomgeographin", "diplomgeographen", "diplomgeographen"],
  ["ehrensenator", "ehrensenatoren", "ehrensenator", "ehrensenatorin", "ehrensenator", "ehrensenators"],
  ["familienernährer", "familienernährer", "familienernährer", "familienernährerin", "familienernährer", "familienernährers"],
  ["fcsp-teqballer", "fcsp-teqballer", "fcsp-teqballer", "fcsp-teqballerin", "fcsp-teqballer", "fcsp-teqballers"],
  ["föderalist", "föderalisten", "föderalist", "föderalistin", "föderalisten", "föderalisten"],
  ["knüpfer", "knüpfer", "knüpfer", "knüpferin", "knüpfer", "knüpfers"],
  ["stadtzürcher", "stadtzürcher", "stadtzürcher", "stadtzürcherin", "stadtzürcher", "stadtzürchers"],
  ["superintendent", "superintendenten", "superintendent", "superintendentin", "superintendenten", "superintendenten"],
  ["teufel", "teufel", "teufel", "teufelin", "teufel", "teufels"],
  ["uigur", "uiguren", "uigure", "uigurin", "uiguren", "uiguren"]
] as const;

const rejectedCases = [
  "bürgermeisters",
  "datei",
  "athleten",
  "teach",
  "aa",
  "august",
  "call",
  "cd",
  "constant",
  "corona-drive",
  "fe",
  "fortnite-wm",
  "gewerkschaftern",
  "inside",
  "kino",
  "ledvance-in-augsburg",
  "linked",
  "peruvian-indians-killed-in-bagua-says",
  "physikingenieure",
  "product",
  "redaktoer",
  "redaktör",
  "sloven",
  "studie",
  "tennantit",
  "us-albums",
  "wendel",
  "wta-palermo-moves-away-from-italy",
  "wunderwelten-festival-heidelberg"
] as const;

describe("achtzigste Lexikon-Ausbauwelle", () => {
  it("enthält alle 14 vollständig geprüften Exact-Mappings", () => {
    expect(reviewedPersonFormCountWave80).toBe(14);

    for (const [base, plural, singular, feminine, oblique, genitive] of cases) {
      expect(getReviewedPersonFormsWave80(base), base).toEqual({
        plural,
        singular,
        feminineSingular: feminine,
        obliqueSingular: oblique,
        genitiveSingular: genitive
      });
    }
  });

  it("hält alle 29 verworfenen Kandidaten aus Welle 80 heraus", () => {
    for (const base of rejectedCases) {
      expect(getReviewedPersonFormsWave80(base), base).toBeUndefined();
    }
  });

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
