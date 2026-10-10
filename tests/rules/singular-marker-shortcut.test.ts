import { describe, expect, it } from "vitest";
import { singularDoubleFormsRule } from "../../src/rules/singular-double-forms";
import { transformText } from "../../src/core/transform-text";
import { defaultRules } from "../../src/rules";

describe("Singular-Doppelformen: Markersuffixe ohne Lexikon-Vollsuche", () => {
  it.each([
    "Nutzer:innen", "Lehrer:in", "Nutzer/innen", "Lehrer/in",
    "Nutzer/-innen", "Lehrer/-in"
  ])("überlässt %s den zuständigen Markerregeln", (eingabe) => {
    expect(singularDoubleFormsRule.apply(eingabe)).toEqual({
      text: eingabe, replacements: 0
    });
  });

  it("behält die vollständige sichtbare Markerkorrektur bei", () => {
    expect(transformText("Nutzer:innen", defaultRules, {
      profile: "aggressive"
    }).text).toBe("Nutzer");
    expect(transformText("Lehrer/innen", defaultRules, {
      profile: "aggressive"
    }).text).toBe("Lehrer");
  });

  it("erkennt weiterhin ausgeschriebene und lexikalisch geprüfte Singularpaare", () => {
    expect(singularDoubleFormsRule.apply("Brite/Britin")).toEqual({
      text: "Brite", replacements: 1
    });
    expect(singularDoubleFormsRule.apply("Brite:Britin")).toEqual({
      text: "Brite", replacements: 1
    });
  });
});
