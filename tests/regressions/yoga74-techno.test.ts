import { describe, expect, it } from "vitest";
import { defaultRules } from "../../src/rules";
import { transformText } from "../../src/core/transform-text";

describe("Regression yoga74.de/techno", () => {
  it.each([
    ["Technoliebhaber:innen", "Technoliebhaber"],
    ["Musikliebhaber*innen", "Musikliebhaber"],
    ["Weinliebhaber_innen", "Weinliebhaber"],
    ["Kunstliebhaber/innen", "Kunstliebhaber"]
  ])("normalisiert das Liebhaber-Kompositum %s", (input, expected) => {
    expect(
      transformText(input, defaultRules, { profile: "aggressive" })
    ).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it("verändert das normale Wort Liebhaberei nicht", () => {
    expect(
      transformText("Technoliebhaberei", defaultRules, { profile: "aggressive" })
    ).toEqual({
      text: "Technoliebhaberei",
      replacements: 0
    });
  });
});
