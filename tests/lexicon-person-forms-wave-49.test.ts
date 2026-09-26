import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";

describe("neunundvierzigste konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Fluglots:innen", "Fluglotsen"],
    ["Gehilf*innen", "Gehilfen"],
    ["Grapholog_innen", "Graphologen"],
    ["Keltolog:innen", "Keltologen"],
    ["Ophthalmolog:innen", "Ophthalmologen"],
    ["Petrolog:innen", "Petrologen"],
    ["Serolog:innen", "Serologen"],
    ["Önolog:innen", "Önologen"],
    ["Pädaudiolog:innen", "Pädaudiologen"],
    ["Zytolog:innen", "Zytologen"]
  ])("normalisiert den abgesicherten Personenstamm %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["fluglots", "genitive", "fluglotsen"],
    ["gehilf", "dative", "gehilfen"],
    ["grapholog", "accusative", "graphologen"],
    ["keltolog", "genitive", "keltologen"],
    ["ophthalmolog", "dative", "ophthalmologen"],
    ["petrolog", "accusative", "petrologen"],
    ["serolog", "genitive", "serologen"],
    ["önolog", "dative", "önologen"],
    ["pädaudiolog", "accusative", "pädaudiologen"],
    ["zytolog", "genitive", "zytologen"]
  ] as const)("bildet %s im Kasus %s korrekt ab", (base, grammaticalCase, expected) => {
    expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
  });

  it.each([
    ["Fluglotse", "Fluglotsin", "Fluglotse"],
    ["Gehilfe", "Gehilfin", "Gehilfe"],
    ["Graphologe", "Graphologin", "Graphologe"],
    ["Keltologe", "Keltologin", "Keltologe"],
    ["Ophthalmologe", "Ophthalmologin", "Ophthalmologe"],
    ["Petrologe", "Petrologin", "Petrologe"],
    ["Serologe", "Serologin", "Serologe"],
    ["Önologe", "Önologin", "Önologe"],
    ["Pädaudiologe", "Pädaudiologin", "Pädaudiologe"],
    ["Zytologe", "Zytologin", "Zytologe"]
  ])("erkennt das abgesicherte Paar %s/%s", (masculine, feminine, expected) => {
    expect(mapMappedSingularPair(masculine, feminine)).toBe(expected);
  });
});
