import { describe, expect, it } from "vitest";
import { transformText } from "../../src/core/transform-text";
import { defaultRules } from "../../src/rules";

const unchangedExamples = [
  "gewinnen",
  "ersinnen",
  "Heiden und ersinnen",
  "Rot-Rot",
  "Mütter und Väter",
  "Nutzerinnen und Benutzer",
  "Nutzerin und Nutzer",
  "Nutzerinnen und Nutzerinnen",
  "Innen",
  "Innenstadt",
  "Innenminister",
  "Innen- und Außendienst",
  "LinkedIn",
  "LogIn",
  "AddIn",
  "PlugIn",
  "DriveIn",
  "InDesign",
  "Nutzerinnen",
  "NUTZERINNEN",
  "Bäckerinnung"
] as const;

const correctedExamples = [
  ["Ärztinnen und Ärzten", "Ärzten"],
  ["Mutter:innen", "Mütter"],
  ["MutterInnen", "Mütter"],
  ["Mutter:in", "Mutter"],
  ["Tochter:innen", "Töchter"],
  ["TochterInnen", "Töchter"],
  ["Bruder:innen", "Brüder"],
  ["BruderInnen", "Brüder"],
  ["Nutzer:innenkonto", "Nutzerkonto"],
  ["NutzerInnenkonto", "Nutzerkonto"],
  ["VorNutzer:innenSuffix", "VorNutzerSuffix"],
  ["des:der Nutzer:in", "des Nutzers"],
  ["des:der Student:in", "des Studenten"],
  ["des:der Ärzt:in", "des Arztes"],
  ["Erbauer:innen", "Erbauer"],
  ["Modellbauer:innen", "Modellbauer"],
  ["Messebauer*innen", "Messebauer"],
  ["US-Bürger’innen", "US-Bürger"]
] as const;

describe("bekannte Fehlertreffer", () => {
  it.each(unchangedExamples)("lässt %s unverändert", (input) => {
    expect(
      transformText(input, defaultRules, { profile: "aggressive" })
    ).toEqual({
      text: input,
      replacements: 0
    });
  });

  it.each(correctedExamples)("korrigiert %s zu %s", (input, expected) => {
    expect(
      transformText(input, defaultRules, { profile: "aggressive" })
    ).toEqual({
      text: expected,
      replacements: 1
    });
  });
});
