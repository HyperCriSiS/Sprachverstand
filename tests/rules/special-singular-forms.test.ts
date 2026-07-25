import { describe, expect, it } from "vitest";
import { specialSingularFormsRule } from "../../src/rules/special-singular-forms";

describe("specialSingularFormsRule", () => {
  it.each([
    ["Mutter:in", "Mutter"],
    ["eine Mutter*in", "eine Mutter"],
    ["der MutterIn", "der Mutter"],
    ["Tochter.in", "Tochter"],
    ["Schwester’in", "Schwester"],
    ["MUTTER:IN", "MUTTER"]
  ])("wandelt %s in %s um", (input, expected) => {
    expect(specialSingularFormsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    "Vater:in",
    "BruderIn",
    "Mutterinnen",
    "Mutter:innen",
    "Mutter:inneninitiative",
    "Bemutter:in"
  ])("lässt die unsichere oder plurale Form %s unverändert", (input) => {
    expect(specialSingularFormsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
