import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";

describe("siebenunddreißigste konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Skandinavist:innen", "Skandinavisten"],
    ["Albanolog*innen", "Albanologen"],
    ["Japanolog_innen", "Japanologen"],
    ["Sinolog:innen", "Sinologen"]
  ])("normalisiert die aktuelle BERUFENET-Form %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it("bildet Skandinavist schwach ab", () => {
    expect(mapMappedSingular("skandinavist", "nominative")).toBe("skandinavist");
    expect(mapMappedSingular("skandinavist", "accusative")).toBe("skandinavisten");
    expect(mapMappedSingular("skandinavist", "dative")).toBe("skandinavisten");
    expect(mapMappedSingular("skandinavist", "genitive")).toBe("skandinavisten");
    expect(mapMappedSingularPair("Skandinavist", "Skandinavistin")).toBe("Skandinavist");
  });

  it.each([
    ["albanolog", "albanologe", "albanologen", "Albanologe", "Albanologin"],
    ["japanolog", "japanologe", "japanologen", "Japanologe", "Japanologin"],
    ["sinolog", "sinologe", "sinologen", "Sinologe", "Sinologin"]
  ])("bildet %s mit schwacher e-Flexion korrekt ab", (stem, nominative, oblique, masculine, feminine) => {
    expect(mapMappedSingular(stem, "nominative")).toBe(nominative);
    expect(mapMappedSingular(stem, "accusative")).toBe(oblique);
    expect(mapMappedSingular(stem, "dative")).toBe(oblique);
    expect(mapMappedSingular(stem, "genitive")).toBe(oblique);
    expect(mapMappedSingularPair(masculine, feminine)).toBe(masculine);
  });
});
