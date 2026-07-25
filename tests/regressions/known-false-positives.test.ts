import { describe, expect, it } from "vitest";
import { transformText } from "../../src/core/transform-text";
import { defaultRules } from "../../src/rules";

const unchangedExamples = [
  "gewinnen",
  "ersinnen",
  "Heiden und ersinnen",
  "Rot-Rot",
  "Innen",
  "Nutzerinnen",
  "Bäckerinnung",
  "Mutter:innen",
  "Tochter:innen",
  "Bruder:innen",
  "Erbauer:innen",
  "Nutzer:innenkonto",
  "VorNutzer:innenSuffix"
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
});
