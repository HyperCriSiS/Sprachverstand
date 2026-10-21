import {afterEach, describe, expect, it, vi} from "vitest";
import {defaultRules} from "../src/rules";
import {transformTextWithSummary} from "../src/core/transform-text";

afterEach(() => vi.restoreAllMocks());

describe("necessary rule candidates", () => {
  it("does not start the full Unicode replacement patterns for plain neutral text", () => {
    const replace = vi.spyOn(String.prototype, "replace");
    for (const rule of defaultRules) {
      expect(rule.apply("Neutraler Inhalt 42")).toEqual({
        text: "Neutraler Inhalt 42", replacements: 0
      });
    }
    expect(replace.mock.calls.filter(([pattern]) =>
      pattern instanceof RegExp && pattern.source.includes("\\p{L}"))).toHaveLength(0);
  });

  it.each([
    ["Nutzer:innen", "Nutzer"],
    ["Nutzer/innen", "Nutzer"],
    ["Nutzer/inne/n", "Nutzer"],
    ["Nutzer I nnen", "Nutzer"],
    ["NutzerInnenkonto", "Nutzerkonto"],
    ["Verbündete:r", "Verbündeter"],
    ["Mutter:in", "Mutter"],
    ["Kaufmann/-frau", "Kaufmann"],
    ["mit Nutzer:innen", "mit Nutzern"],
    ["Liebe Mitarbeitende", "Liebe Mitarbeiter"],
    ["ROM*NJA", "ROMA"],
    ["Studentys", "Studenten"],
    ["Benutzungshandbuch", "Benutzerhandbuch"],
    ["Prof.in", "Professorin"],
    ["Techniker (m/w/d)", "Techniker"]
  ])("keeps required nonstandard candidates: %s", (input, expected) => {
    expect(transformTextWithSummary(input, defaultRules, {profile: "aggressive"}).text)
      .toBe(expected);
  });
});
