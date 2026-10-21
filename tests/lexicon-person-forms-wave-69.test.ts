import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";
import {
  getReviewedPersonFormsWave69,
  reviewedPersonFormCountWave69
} from "../src/rules/reviewed-person-forms-wave-69";

describe("neunundsechzigste Lexikon-Ausbauwelle", () => {
  it("enthält genau den intern geprüften Exaktbestand", () => {
    expect(reviewedPersonFormCountWave69).toBe(5);

    for (const base of [
      "computervisualist",
      "eri-wart",
      "eutonist",
      "fennist",
      "mindermaschinenstricker",
      "modellist",
      "tapisserist",
      "verschmelzer",
      "wäscher",
      "fiaker",
      "monitor",
      "bohrer",
      "walzer",
      "logenschließermaschine",
      "mikrografiegerät"
    ]) {
      expect(getReviewedPersonFormsWave69(base), base).toBeUndefined();
    }
  });

  it.each([
    ["Logenschließer:innen", "Logenschließer"],
    ["Mikrograf:innen", "Mikrografen"],
    ["Perforatortaster:innen", "Perforatortaster"],
    ["Süßmoster:innen", "Süßmoster"],
    ["Wertpapierabwickler:innen", "Wertpapierabwickler"]
  ])("ersetzt den geprüften Plural %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["Logenschließer", "Logenschließerin", "Logenschließer"],
    ["Mikrograf", "Mikrografin", "Mikrograf"],
    ["Perforatortaster", "Perforatortasterin", "Perforatortaster"],
    ["Süßmoster", "Süßmosterin", "Süßmoster"],
    ["Wertpapierabwickler", "Wertpapierabwicklerin", "Wertpapierabwickler"]
  ])("erkennt das intern geprüfte Paar %s/%s", (masculine, feminine, expected) => {
    expect(mapMappedSingularPair(masculine, feminine)).toBe(expected);
  });

  it.each([
    ["logenschließer", "nominative", "logenschließer"],
    ["logenschließer", "genitive", "logenschließers"],
    ["mikrograf", "nominative", "mikrograf"],
    ["mikrograf", "accusative", "mikrografen"],
    ["mikrograf", "dative", "mikrografen"],
    ["mikrograf", "genitive", "mikrografen"],
    ["perforatortaster", "nominative", "perforatortaster"],
    ["perforatortaster", "genitive", "perforatortasters"],
    ["süßmoster", "nominative", "süßmoster"],
    ["süßmoster", "genitive", "süßmosters"],
    ["wertpapierabwickler", "nominative", "wertpapierabwickler"],
    ["wertpapierabwickler", "genitive", "wertpapierabwicklers"]
  ] as const)(
    "bildet die Basis %s im Kasus %s korrekt ab",
    (base, grammaticalCase, expected) => {
      expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
    }
  );
});
