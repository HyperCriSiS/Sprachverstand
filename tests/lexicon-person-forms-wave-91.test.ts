import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import { mapMappedSingular, mapMappedSingularPair } from "../src/rules/person-lexicon";
import {
  getReviewedPersonFormsWave91,
  reviewedPersonFormCountWave91
} from "../src/rules/reviewed-person-forms-wave-91";

// Unabhängige erwartete Ziele; kein generisches Ableiten aus der Wortendung.
const sonderfaelle = [
  ["amtsvormund", "amtsvormünder"],
  ["auktionssensal", "auktionssensale"],
  ["automatenkassier", "automatenkassiere"],
  ["bankkassier", "bankkassiere"],
  ["brigadegeneral", "brigadegeneräle"],
  ["brigadier", "brigadiers"],
  ["börsensensal", "börsensensale"],
  ["general", "generäle"],
  ["generalleutnant", "generalleutnants"],
  ["generalmajor", "generalmajore"],
  ["grenadier", "grenadiere"],
  ["hotelportier", "hotelportiers"],
  ["ikarier", "ikarier"],
  ["konsul", "konsuln"],
  ["korporal", "korporale"],
  ["major", "majore"],
  ["oberstleutnant", "oberstleutnants"],
  ["pfarrvikar", "pfarrvikare"],
  ["staffelkapitän", "staffelkapitäne"],
  ["vizeleutnant", "vizeleutnants"],
  ["wechselstubenkassier", "wechselstubenkassiere"]
] as const;

describe("Lexikonwelle 91: besondere Pluralformen aus Einzelprüfungen", () => {
  it("prüft genau 21 unterschiedliche Wörter", () => {
    expect(sonderfaelle).toHaveLength(21);
    expect(new Set(sonderfaelle.map(([basis]) => basis)).size).toBe(21);
    expect(reviewedPersonFormCountWave91).toBe(21);
  });

  it.each(sonderfaelle)("%s -> %s: Plural und alle Singularfälle", (basis, plural) => {
    expect(getReviewedPersonFormsWave91(basis)).toEqual({
      plural,
      singular: basis,
      feminineSingular: `${basis}in`,
      obliqueSingular: basis,
      genitiveSingular: `${basis}s`
    });
    expect(mappedPluralSeparatorsRule.apply(`${basis}:innen`)).toEqual({
      text: plural,
      replacements: 1
    });
    expect(mapMappedSingularPair(basis, `${basis}in`)).toBe(basis);
    expect(mapMappedSingularPair(`${basis}in`, basis)).toBe(basis);
    for (const kasus of ["nominative", "accusative", "dative"] as const) {
      expect(mapMappedSingular(basis, kasus)).toBe(basis);
    }
    expect(mapMappedSingular(basis, "genitive")).toBe(`${basis}s`);
  });

  it.each(["stallknecht", "stallknechtin", "generalsekretärs", "bankkassierfirma", "hotelportierdienst", "majorität"])(
    "leitet für %s keine zusätzliche Lexikonregel ab", (basis) => {
      expect(getReviewedPersonFormsWave91(basis)).toBeUndefined();
    }
  );
  it("ändert unmarkierte militärische Dienstgrade nicht", () => {
    expect(mappedPluralSeparatorsRule.apply("Die Generale treffen den Major.")).toEqual({
      text: "Die Generale treffen den Major.",
      replacements: 0
    });
  });
});
