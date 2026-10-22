import { describe, expect, it } from "vitest";
import {
  knownPluralSeparatorsRule,
  mapKnownSingular
} from "../src/rules/known-plural-separators";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";

describe("fünfunddreißigste konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Abfüller:innen", "Abfüller"],
    ["Abfüller*innen", "Abfüller"],
    ["Abfüller_innen", "Abfüller"]
  ])("normalisiert die Berufsform %s", (input, expected) => {
    expect(knownPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["Ägyptolog:innen", "Ägyptologen"],
    ["Ägyptolog*innen", "Ägyptologen"],
    ["Afrikanist:innen", "Afrikanisten"],
    ["Afrikanist*innen", "Afrikanisten"]
  ])("normalisiert die aktuelle BERUFENET-Form %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it("bildet Singular und Kasus von Abfüller korrekt ab", () => {
    expect(mapKnownSingular("abfüller", "nominative")).toBe("abfüller");
    expect(mapKnownSingular("abfüller", "genitive")).toBe("abfüllers");
  });

  it("bildet Singular und Kasus von Ägyptologe korrekt ab", () => {
    expect(mapMappedSingular("ägyptolog", "nominative")).toBe("ägyptologe");
    expect(mapMappedSingular("ägyptolog", "accusative")).toBe("ägyptologen");
    expect(mapMappedSingular("ägyptolog", "dative")).toBe("ägyptologen");
    expect(mapMappedSingular("ägyptolog", "genitive")).toBe("ägyptologen");
    expect(mapMappedSingularPair("Ägyptologe", "Ägyptologin")).toBe("Ägyptologe");
  });

  it("bildet Singular und Kasus von Afrikanist korrekt ab", () => {
    expect(mapMappedSingular("afrikanist", "nominative")).toBe("afrikanist");
    expect(mapMappedSingular("afrikanist", "accusative")).toBe("afrikanisten");
    expect(mapMappedSingular("afrikanist", "dative")).toBe("afrikanisten");
    expect(mapMappedSingular("afrikanist", "genitive")).toBe("afrikanisten");
    expect(mapMappedSingularPair("Afrikanist", "Afrikanistin")).toBe("Afrikanist");
  });
});
