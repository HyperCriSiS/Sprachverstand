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
  it("enthält alle fünf abschließend geprüften Exaktmappings vollständig", () => {
    expect(reviewedPersonFormCountWave76).toBe(5);

    for (const [base, plural, oblique, genitive] of [
      ["eri-wart", "eri-warte", "eri-wart", "eri-warts"],
      ["eutonist", "eutonisten", "eutonisten", "eutonisten"],
      ["fennist", "fennisten", "fennisten", "fennisten"],
      ["monitor", "monitore", "monitor", "monitors"],
      ["vermessinger", "vermessinger", "vermessinger", "vermessingers"]
    ] as const) {
      expect(getReviewedPersonFormsWave76(base), base).toEqual({
        plural,
        singular: base,
        feminineSingular: `${base}in`,
        obliqueSingular: oblique,
        genitiveSingular: genitive
      });
    }
  });

  it("lässt die beiden verworfenen Restformen weiterhin außerhalb der Welle", () => {
    for (const base of ["printer", "xerograf"]) {
      expect(getReviewedPersonFormsWave76(base), base).toBeUndefined();
    }
  });

  it.each([
    ["Eri-Wart:innen", "Eri-Warte"],
    ["Eutonist:innen", "Eutonisten"],
    ["Fennist:innen", "Fennisten"],
    ["Monitor:innen", "Monitore"],
    ["Vermessinger:innen", "Vermessinger"]
  ])("ersetzt geprüfte Plurale %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["Eri-Wart", "Eri-Wartin", "Eri-Wart"],
    ["Eutonist", "Eutonistin", "Eutonist"],
    ["Fennist", "Fennistin", "Fennist"],
    ["Monitor", "Monitorin", "Monitor"],
    ["Vermessinger", "Vermessingerin", "Vermessinger"]
  ])("erkennt geprüfte Paare %s/%s", (masculine, feminine, expected) => {
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
    "bildet geprüfte Basis %s im Kasus %s korrekt ab",
    (base, grammaticalCase, expected) => {
      expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
    }
  );
});
