import { describe, expect, it } from "vitest";
import { additionalPersonSingularRule } from "../src/rules/additional-person-forms";
import { unmarkedSingularRule } from "../src/rules/unmarked-singular";

describe("angeforderte Singularformen", () => {
  it("entfernt die Markierung bei Creator*in", () => {
    expect(unmarkedSingularRule.apply("Creator*in")).toEqual({
      text: "Creator",
      replacements: 1
    });
  });

  it("entfernt die Markierung bei Content-Creator*in", () => {
    expect(unmarkedSingularRule.apply("Content-Creator*in")).toEqual({
      text: "Content-Creator",
      replacements: 1
    });
  });

  it("behandelt Krankenpfleger*in bereits korrekt", () => {
    expect(additionalPersonSingularRule.apply("Krankenpfleger*in")).toEqual({
      text: "Krankenpfleger",
      replacements: 1
    });
  });
});
