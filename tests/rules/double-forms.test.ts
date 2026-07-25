import { describe, expect, it } from "vitest";
import { doubleFormsRule } from "../../src/rules/double-forms";

describe("doubleFormsRule", () => {
  it.each([
    ["Nutzerinnen und Nutzer", "Nutzer"],
    ["Nutzer und Nutzerinnen", "Nutzer"],
    ["Ärztinnen oder Ärzte", "Ärzte"],
    ["Studenten & Studentinnen", "Studenten"],
    ["Koautorinnen/Koautoren", "Koautoren"],
    ["Bauerinnen bzw. Bauern", "Bauern"],
    [
      "Online-Nutzerinnen beziehungsweise Online-Nutzer",
      "Online-Nutzer"
    ],
    ["Nutzer:innen und Nutzer", "Nutzer"],
    ["Nutzer und NutzerInnen", "Nutzer"],
    ["Ärzt*innen/Ärzte", "Ärzte"],
    ["Nutzerinnen und Nutzer:innen", "Nutzer"],
    ["Ärztinnen und Ärzten", "Ärzten"],
    ["Ärzten und Ärztinnen", "Ärzten"],
    ["Nutzerinnen und Nutzern", "Nutzern"],
    ["Bürgern und Bürgerinnen", "Bürgern"]
  ])("führt %s zu %s zusammen", (input, expected) => {
    expect(doubleFormsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it("ersetzt Doppelnennungen innerhalb eines Satzes", () => {
    expect(
      doubleFormsRule.apply(
        "Die Nutzerinnen und Nutzer sprechen mit Ärztinnen und Ärzten."
      )
    ).toEqual({
      text: "Die Nutzer sprechen mit Ärzten.",
      replacements: 2
    });
  });

  it("erhält die vorhandene Versalschreibung der maskulinen Form", () => {
    expect(doubleFormsRule.apply("NUTZERINNEN UND NUTZER")).toEqual({
      text: "NUTZER",
      replacements: 1
    });
  });

  it.each([
    "Heiden und ersinnen",
    "Mütter und Väter",
    "Ärztinnen und Ärztes",
    "Nutzerinnen und Benutzer",
    "Nutzerin und Nutzer",
    "Nutzerinnen und Nutzerinnen",
    "Nutzer:innen und Nutzer:innen",
    "Modellbauerinnen und Modellbauer",
    "Nutzerinnen und Nutzerkonten"
  ])("lässt %s unverändert", (input) => {
    expect(doubleFormsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
