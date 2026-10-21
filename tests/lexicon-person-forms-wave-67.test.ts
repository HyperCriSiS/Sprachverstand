import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";
import {
  getReviewedPersonFormsWave67,
  reviewedPersonFormCountWave67
} from "../src/rules/reviewed-person-forms-wave-67";

describe("siebenundsechzigste Lexikon-Ausbauwelle", () => {
  it("enthält genau den intern geprüften Exaktbestand", () => {
    expect(reviewedPersonFormCountWave67).toBe(1);

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
      "mikrograf",
      "monitor",
      "walzer",
      "archäometermaschine"
    ]) {
      expect(getReviewedPersonFormsWave67(base), base).toBeUndefined();
    }
  });

  it("ersetzt den geprüften Plural", () => {
    expect(mappedPluralSeparatorsRule.apply("Archäometer:innen")).toEqual({
      text: "Archäometer",
      replacements: 1
    });
  });

  it("erkennt das intern geprüfte Singularpaar", () => {
    expect(mapMappedSingularPair("Archäometer", "Archäometerin")).toBe(
      "Archäometer"
    );
  });

  it.each([
    ["archäometer", "nominative", "archäometer"],
    ["archäometer", "accusative", "archäometer"],
    ["archäometer", "dative", "archäometer"],
    ["archäometer", "genitive", "archäometers"]
  ] as const)(
    "bildet die Basis %s im Kasus %s korrekt ab",
    (base, grammaticalCase, expected) => {
      expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
    }
  );
});
