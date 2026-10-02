import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";
import {
  getReviewedPersonFormsWave76,
  reviewedPersonFormCountWave76
} from "../src/rules/reviewed-person-forms-wave-76";

describe("sechsundsiebzigste Lexikon-Ausbauwelle", () => {
  it("enthält genau die fünf final angenommenen Sonderformen", () => {
    expect(reviewedPersonFormCountWave76).toBe(5);

    for (const [base, plural, singular, feminine, oblique, genitive] of [
    ["eri-wart", "eri-warte", "eri-wart", "eri-wartin", "eri-wart", "eri-warts"],
    ["eutonist", "eutonisten", "eutonist", "eutonistin", "eutonisten", "eutonisten"],
    ["fennist", "fennisten", "fennist", "fennistin", "fennisten", "fennisten"],
    ["monitor", "monitore", "monitor", "monitorin", "monitor", "monitors"],
    ["vermessinger", "vermessinger", "vermessinger", "vermessingerin", "vermessinger", "vermessingers"]
    ] as const) {
      expect(getReviewedPersonFormsWave76(base), base).toEqual({
        plural,
        singular,
        feminineSingular: feminine,
        obliqueSingular: oblique,
        genitiveSingular: genitive
      });
    }
  });

  it("lässt die beiden final verworfenen Formen außerhalb des Lexikons", () => {
    for (const base of ["printer", "xerograf"]) {
      expect(getReviewedPersonFormsWave76(base), base).toBeUndefined();
    }
  });

  it.each([
    ["Eri-wart:innen", "Eri-warte"],
    ["Eutonist:innen", "Eutonisten"],
    ["Fennist:innen", "Fennisten"],
    ["Monitor:innen", "Monitore"],
    ["Vermessinger:innen", "Vermessinger"]
  ])("ersetzt den geprüften Plural %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["Eri-wart", "Eri-wartin", "Eri-wart"],
    ["Eutonist", "Eutonistin", "Eutonist"],
    ["Fennist", "Fennistin", "Fennist"],
    ["Monitor", "Monitorin", "Monitor"],
    ["Vermessinger", "Vermessingerin", "Vermessinger"]
  ])("erkennt das geprüfte Paar %s/%s", (masculine, feminine, expected) => {
    expect(mapMappedSingularPair(masculine, feminine)).toBe(expected);
  });

  it.each([
    ["eri-wart", "nominative", "eri-wart"],
    ["eri-wart", "genitive", "eri-warts"],
    ["eutonist", "nominative", "eutonist"],
    ["eutonist", "genitive", "eutonisten"],
    ["fennist", "nominative", "fennist"],
    ["fennist", "genitive", "fennisten"],
    ["monitor", "nominative", "monitor"],
    ["monitor", "genitive", "monitors"],
    ["vermessinger", "nominative", "vermessinger"],
    ["vermessinger", "genitive", "vermessingers"]
  ] as const)(
    "bildet die Basis %s im Kasus %s korrekt ab",
    (base, grammaticalCase, expected) => {
      expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
    }
  );
});
