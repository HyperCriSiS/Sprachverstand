import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";
import { defaultEnabledRuleGroupIds, disabledRuleIdsForGroups } from "../src/rules/catalog";
import { mapMappedSingular, mapMappedSingularPair } from "../src/rules/person-lexicon";

// Stamm, maskuliner Singular, Femininum, Plural, Genitiv: unabhängig geprüfte Ziele.
const cases = [
  ["Audiolog", "Audiologe", "Audiologin", "Audiologen", "Audiologen"],
  ["Choreolog", "Choreologe", "Choreologin", "Choreologen", "Choreologen"],
  ["Diätolog", "Diätologe", "Diätologin", "Diätologen", "Diätologen"],
  ["Flugmeteorolog", "Flugmeteorologe", "Flugmeteorologin", "Flugmeteorologen", "Flugmeteorologen"],
  ["Grafolog", "Grafologe", "Grafologin", "Grafologen", "Grafologen"],
  ["Kosmolog", "Kosmologe", "Kosmologin", "Kosmologen", "Kosmologen"],
  ["Metrolog", "Metrologe", "Metrologin", "Metrologen", "Metrologen"],
  ["Sophrolog", "Sophrologe", "Sophrologin", "Sophrologen", "Sophrologen"],
  ["Thanatolog", "Thanatologe", "Thanatologin", "Thanatologen", "Thanatologen"],
  ["Matros", "Matrose", "Matrosin", "Matrosen", "Matrosen"],
  ["Leichtmatros", "Leichtmatrose", "Leichtmatrosin", "Leichtmatrosen", "Leichtmatrosen"],
  ["Industriekletter", "Industriekletterer", "Industriekletterin", "Industriekletterer", "Industriekletterers"],
  ["Möbelpolster", "Möbelpolsterer", "Möbelpolsterin", "Möbelpolsterer", "Möbelpolsterers"]
] as const;
const options = { profile: "aggressive" as const, disabledRuleIds: disabledRuleIdsForGroups(defaultEnabledRuleGroupIds) };

describe("Exakte Berufsbezeichnungen mit abweichendem Singularstamm", () => {
  it.each(cases)("%s: Singular, Paar, Plural und Kasus stimmen", (stem, masculine, feminine, plural, genitive) => {
    expect(transformText(`${masculine}/${feminine}`, defaultRules, options).text).toBe(masculine);
    expect(transformText(`${feminine}/${masculine}`, defaultRules, options).text).toBe(masculine);
    expect(mapMappedSingularPair(masculine, feminine)).toBe(masculine);
    expect(mapMappedSingularPair(feminine, masculine)).toBe(masculine);
    expect(mapMappedSingular(stem, "nominative")).toBe(masculine);
    expect(mapMappedSingular(stem, "accusative")).toBe(plural);
    expect(mapMappedSingular(stem, "dative")).toBe(plural);
    expect(mapMappedSingular(stem, "genitive")).toBe(genitive);
    expect(transformText(`Die ${stem}:innen arbeiten.`, defaultRules, options).text).toBe(`Die ${plural} arbeiten.`);
    const unmarked = `Der ${masculine} arbeitet mit der ${feminine}.`;
    expect(transformText(unmarked, defaultRules, options).text).toBe(unmarked);
  });

  it.each([
    "Fantasieaudiologe/Fantasieaudiologin",
    "Fantasieindustriekletterer/Fantasieindustriekletterin",
    "General/Generalin", "Stallknecht/Stallknechtin",
    "Leichtmatrose/Leichmatrosin",
    "Holzbohrmaschinenbediener/Hozbohrmaschinenbedienerin",
    "Kolumnist/Koloumnistin", "Kuvertmacher/Kuvermacherin",
    "Papiermachéformer/Papiermachéoformerin",
    "Pultrusionsmaschinenbediener/Pultrusionmaschinenbedienerin",
    "Änderungschneider/Änderungsschneiderin"
  ])("leitet keine weiteren oder inkonsistenten Paare ab: %s", text => {
    expect(transformText(text, defaultRules, options).text).toBe(text);
  });

  it.each([
    ["Wir sprechen mit einer Audiologin/einem Audiologen.", "Wir sprechen mit einem Audiologen."],
    ["Die Aufgabe der Matrosin/des Matrosen ist klar.", "Die Aufgabe des Matrosen ist klar."],
    ["Die Möbelpolsterin und der Möbelpolsterer arbeiten.", "Die Möbelpolsterin und der Möbelpolsterer arbeiten."]
  ])("bewahrt den Satzbezug: %s", (input, expected) => {
    expect(transformText(input, defaultRules, options).text).toBe(expected);
  });
});