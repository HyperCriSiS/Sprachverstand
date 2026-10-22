import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";
import {
  getReviewedPersonFormsWave73,
  reviewedPersonFormCountWave73
} from "../src/rules/reviewed-person-forms-wave-73";

describe("dreiundsiebzigste Lexikon-Ausbauwelle", () => {
  it("enthält genau den intern geprüften Exaktbestand", () => {
    expect(reviewedPersonFormCountWave73).toBe(11);

    for (const base of [
      "wickler",
      "bohrer",
      "presser",
      "stanzer",
      "walzer",
      "zieher",
      "spritzer",
      "sortierer",
      "mischer",
      "kopierer",
      "computervisualist",
      "eri-wart",
      "eutonist",
      "fennist",
      "mindermaschinenstricker",
      "modellist",
      "tapisserist",
      "verschmelzer",
      "wäscher"
    ]) {
      expect(getReviewedPersonFormsWave73(base), base).toBeUndefined();
    }
  });

  it.each([
    ["Ankerwickler:innen", "Ankerwickler"],
    ["Elektromaschinenwickler:innen", "Elektromaschinenwickler"],
    ["Elektromotorenwickler:innen", "Elektromotorenwickler"],
    ["Elektrowickler:innen", "Elektrowickler"],
    ["Heizfadenwickler:innen", "Heizfadenwickler"],
    ["Heizspiralenwickler:innen", "Heizspiralenwickler"],
    ["Metallschlauchwickler:innen", "Metallschlauchwickler"],
    ["Motorenwickler:innen", "Motorenwickler"],
    ["Reifenwickler:innen", "Reifenwickler"],
    ["Spulenwickler:innen", "Spulenwickler"],
    ["Transformatorenwickler:innen", "Transformatorenwickler"]
  ])("ersetzt den geprüften Plural %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["Ankerwickler", "Ankerwicklerin", "Ankerwickler"],
    ["Elektromaschinenwickler", "Elektromaschinenwicklerin", "Elektromaschinenwickler"],
    ["Elektromotorenwickler", "Elektromotorenwicklerin", "Elektromotorenwickler"],
    ["Elektrowickler", "Elektrowicklerin", "Elektrowickler"],
    ["Heizfadenwickler", "Heizfadenwicklerin", "Heizfadenwickler"],
    ["Heizspiralenwickler", "Heizspiralenwicklerin", "Heizspiralenwickler"],
    ["Metallschlauchwickler", "Metallschlauchwicklerin", "Metallschlauchwickler"],
    ["Motorenwickler", "Motorenwicklerin", "Motorenwickler"],
    ["Reifenwickler", "Reifenwicklerin", "Reifenwickler"],
    ["Spulenwickler", "Spulenwicklerin", "Spulenwickler"],
    ["Transformatorenwickler", "Transformatorenwicklerin", "Transformatorenwickler"]
  ])("erkennt das intern geprüfte Paar %s/%s", (masculine, feminine, expected) => {
    expect(mapMappedSingularPair(masculine, feminine)).toBe(expected);
  });

  it.each([
    ["ankerwickler", "nominative", "ankerwickler"],
    ["ankerwickler", "genitive", "ankerwicklers"],
    ["elektromaschinenwickler", "nominative", "elektromaschinenwickler"],
    ["elektromaschinenwickler", "genitive", "elektromaschinenwicklers"],
    ["elektromotorenwickler", "nominative", "elektromotorenwickler"],
    ["elektromotorenwickler", "genitive", "elektromotorenwicklers"],
    ["elektrowickler", "nominative", "elektrowickler"],
    ["elektrowickler", "genitive", "elektrowicklers"],
    ["heizfadenwickler", "nominative", "heizfadenwickler"],
    ["heizfadenwickler", "genitive", "heizfadenwicklers"],
    ["heizspiralenwickler", "nominative", "heizspiralenwickler"],
    ["heizspiralenwickler", "genitive", "heizspiralenwicklers"],
    ["metallschlauchwickler", "nominative", "metallschlauchwickler"],
    ["metallschlauchwickler", "genitive", "metallschlauchwicklers"],
    ["motorenwickler", "nominative", "motorenwickler"],
    ["motorenwickler", "genitive", "motorenwicklers"],
    ["reifenwickler", "nominative", "reifenwickler"],
    ["reifenwickler", "genitive", "reifenwicklers"],
    ["spulenwickler", "nominative", "spulenwickler"],
    ["spulenwickler", "genitive", "spulenwicklers"],
    ["transformatorenwickler", "nominative", "transformatorenwickler"],
    ["transformatorenwickler", "genitive", "transformatorenwicklers"]
  ] as const)(
    "bildet die Basis %s im Kasus %s korrekt ab",
    (base, grammaticalCase, expected) => {
      expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
    }
  );
});
