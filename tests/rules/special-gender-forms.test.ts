import { describe, expect, it } from "vitest";
import { specialGenderFormsRule } from "../../src/rules/special-gender-forms";

describe("specialGenderFormsRule", () => {
  it.each([
    ["Rom*nja", "Roma"],
    ["Sinti*zze", "Sinti"],
    ["Studentys", "Studenten"],
    ["Lesys", "Leser"],
    ["Lehrys", "Lehrer"],
    ["Kollegys", "Kollegen"],
    ["Mitarbeitys", "Mitarbeiter"],
    ["Kommilitonys", "Kommilitonen"],
    ["Autorys", "Autoren"],
    ["KRITIKYS", "KRITIKER"]
  ])("wandelt %s in %s um", (input, expected) => {
    expect(specialGenderFormsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    "Roma",
    "Sinti",
    "Romnja",
    "Sintizze",
    "Studenten",
    "Analyseys"
  ])("lässt %s unverändert", (input) => {
    expect(specialGenderFormsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
