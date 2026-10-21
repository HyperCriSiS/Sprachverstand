import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";
import { singularDoubleFormsRule } from "../src/rules/singular-double-forms";

describe("achtunddreißigste konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Verfahrenstechnolog:innen", "Verfahrenstechnologen"],
    ["Radiologietechnolog*innen", "Radiologietechnologen"],
    ["Bergbautechnolog_innen", "Bergbautechnologen"]
  ])("normalisiert die Technologenfamilie %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it("bildet Technologe auch in Komposita schwach ab", () => {
    expect(mapMappedSingular("verfahrenstechnolog", "nominative")).toBe("verfahrenstechnologe");
    expect(mapMappedSingular("verfahrenstechnolog", "accusative")).toBe("verfahrenstechnologen");
    expect(mapMappedSingular("verfahrenstechnolog", "dative")).toBe("verfahrenstechnologen");
    expect(mapMappedSingular("verfahrenstechnolog", "genitive")).toBe("verfahrenstechnologen");
  });

  it.each([
    ["Zimmerer", "Zimmerin", "Zimmerer"],
    ["Brückenbauzimmerer", "Brückenbauzimmerin", "Brückenbauzimmerer"],
    ["Polsterer", "Polsterin", "Polsterer"],
    ["Verfahrenstechnologe", "Verfahrenstechnologin", "Verfahrenstechnologe"]
  ])("erkennt das unregelmäßige Paar %s/%s", (masculine, feminine, expected) => {
    expect(mapMappedSingularPair(masculine, feminine)).toBe(expected);
  });

  it.each([
    ["Brückenbauzimmerer/-zimmerin", "Brückenbauzimmerer"],
    ["Schiffszimmerer/-zimmerin", "Schiffszimmerer"],
    ["Verfahrenstechnologe/-technologin Metall", "Verfahrenstechnologe Metall"],
    ["Radiologietechnologe/-technologin", "Radiologietechnologe"]
  ])("normalisiert die lexikalisch abgesicherte Kurzform %s", (input, expected) => {
    expect(singularDoubleFormsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    "Fantast/-fantasin",
    "Programmierer/-programmierin",
    "Polsterer/-polsterin"
  ])("lässt unbelegte Kurzformen unverändert: %s", (input) => {
    expect(singularDoubleFormsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
