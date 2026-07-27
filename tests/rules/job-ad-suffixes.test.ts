import { describe, expect, it } from "vitest";
import { jobAdSuffixesRule } from "../../src/rules/job-ad-suffixes";

describe("jobAdSuffixesRule", () => {
  it.each([
    ["Erzieher (m/w/d)", "Erzieher"],
    ["Verkäuferin (w/m/d)", "Verkäuferin"],
    ["Developer (m/f/d)", "Developer"],
    ["Lehrer (m / w / x)", "Lehrer"]
  ])("wandelt %s in %s um", (input, expected) => {
    expect(jobAdSuffixesRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it("lässt andere Klammerangaben unverändert", () => {
    const input = "Mitarbeiter (Vollzeit/Teilzeit)";
    expect(jobAdSuffixesRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
