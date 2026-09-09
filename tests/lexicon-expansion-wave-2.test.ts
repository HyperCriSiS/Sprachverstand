import { describe, expect, it } from "vitest";
import { knownPluralSeparatorsRule } from "../src/rules/known-plural-separators";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import { mapMappedSingular } from "../src/rules/person-lexicon";

describe("zweite konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Kinderpfleger:innen", "Kinderpfleger"],
    ["Landmaschinenmechatroniker:innen", "Landmaschinenmechatroniker"],
    ["Industrieelektroniker:innen", "Industrieelektroniker"],
    ["Bautischler:innen", "Bautischler"],
    ["Rohrschweißer:innen", "Rohrschweißer"]
  ])("deckt sichere unveränderte Pluralfamilien ab: %s", (input, expected) => {
    expect(knownPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["Orthoptist:innen", "Orthoptisten"],
    ["Fachlagerist:innen", "Fachlageristen"],
    ["Chemikant:innen", "Chemikanten"]
  ])("deckt geprüfte schwache Berufsformen ab: %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it("stellt die schwache Singularflexion in allen relevanten Kasus bereit", () => {
    expect(mapMappedSingular("orthoptist", "nominative")).toBe("orthoptist");
    expect(mapMappedSingular("orthoptist", "accusative")).toBe("orthoptisten");
    expect(mapMappedSingular("fachlagerist", "dative")).toBe("fachlageristen");
    expect(mapMappedSingular("chemikant", "genitive")).toBe("chemikanten");
  });

  it.each([
    "Pflege:innen",
    "Elektronik:innen",
    "Mechanik:innen",
    "Schweiß:innen",
    "Tisch:innen"
  ])("lässt ähnlich aussehende Nicht-Personenformen unverändert: %s", (input) => {
    expect(knownPluralSeparatorsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
