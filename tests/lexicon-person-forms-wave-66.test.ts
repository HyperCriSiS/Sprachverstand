import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";
import {
  getReviewedPersonFormsWave66,
  reviewedPersonFormCountWave66
} from "../src/rules/reviewed-person-forms-wave-66";

describe("sechsundsechzigste Lexikon-Ausbauwelle", () => {
  it("enthält genau den intern geprüften Exaktbestand", () => {
    expect(reviewedPersonFormCountWave66).toBe(5);

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
      "archäometer",
      "fiaker",
      "mikrograf",
      "countertenorstimme",
      "generalkonsulmaschine",
      "profilergerät"
    ]) {
      expect(getReviewedPersonFormsWave66(base), base).toBeUndefined();
    }
  });

  it.each([
    ["Choralmagister:innen", "Choralmagister"],
    ["Countertenor:innen", "Countertenöre"],
    ["Generalkonsul:innen", "Generalkonsuln"],
    ["Jollen-Instructor:innen", "Jollen-Instructoren"],
    ["Profiler:innen", "Profiler"]
  ])("ersetzt den geprüften Plural %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["Choralmagister", "Choralmagisterin", "Choralmagister"],
    ["Countertenor", "Countertenorin", "Countertenor"],
    ["Generalkonsul", "Generalkonsulin", "Generalkonsul"],
    ["Jollen-Instructor", "Jollen-Instructorin", "Jollen-Instructor"],
    ["Profiler", "Profilerin", "Profiler"]
  ])("erkennt das intern geprüfte Paar %s/%s", (masculine, feminine, expected) => {
    expect(mapMappedSingularPair(masculine, feminine)).toBe(expected);
  });

  it.each([
    ["choralmagister", "nominative", "choralmagister"],
    ["choralmagister", "genitive", "choralmagisters"],
    ["countertenor", "nominative", "countertenor"],
    ["countertenor", "genitive", "countertenors"],
    ["generalkonsul", "nominative", "generalkonsul"],
    ["generalkonsul", "genitive", "generalkonsuls"],
    ["jollen-instructor", "nominative", "jollen-instructor"],
    ["jollen-instructor", "genitive", "jollen-instructors"],
    ["profiler", "nominative", "profiler"],
    ["profiler", "genitive", "profilers"]
  ] as const)(
    "bildet die Basis %s im Kasus %s korrekt ab",
    (base, grammaticalCase, expected) => {
      expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
    }
  );
});
