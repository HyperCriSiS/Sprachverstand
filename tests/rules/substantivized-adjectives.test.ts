import { describe, expect, it } from "vitest";
import { substantivizedAdjectivesRule } from "../../src/rules/substantivized-adjectives";

describe("substantivizedAdjectivesRule", () => {
  it.each([
    ["Erwachsene:r", "Erwachsener"],
    ["Erwachsene:n", "Erwachsenen"],
    ["Erwachsene:m", "Erwachsenem"],
    ["ein:e Erwachsene:r", "ein Erwachsener"],
    ["eine:n Erwachsene:n", "einen Erwachsenen"],
    ["einem:einer Erwachsene:n", "einem Erwachsenen"],
    ["der:die Beschäftigte:r", "der Beschäftigte"],
    ["den:die Beschäftigte:n", "den Beschäftigten"],
    ["jede:r Volljährige:r", "jeder Volljährige"],
    ["jene:r Volljährige:r", "jener Volljährige"],
    ["mein:e Angehörige:r", "mein Angehöriger"],
    ["Sachverständige:r", "Sachverständiger"],
    ["Vorgesetzte:r", "Vorgesetzter"],
    ["einem:einer Arbeitslose:n", "einem Arbeitslosen"],
    ["AUSZUBILDENDE:R", "AUSZUBILDENDER"]
  ])("wandelt %s in %s um", (input, expected) => {
    expect(substantivizedAdjectivesRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    "Erwachsene",
    "erwachsene Kinder",
    "Unbekannte:r",
    "Verantwortliche",
    "Verbündete:r",
    "ein:e Erwachsene:n",
    "einem:einer Erwachsene:r"
  ])("lässt %s unverändert", (input) => {
    expect(substantivizedAdjectivesRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
