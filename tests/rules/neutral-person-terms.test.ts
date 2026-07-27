import { describe, expect, it } from "vitest";
import { neutralPersonTermsRule } from "../../src/rules/neutral-person-terms";

describe("neutralPersonTermsRule", () => {
  it.each([
    ["Mitarbeitende", "Mitarbeiter"],
    ["Studierende", "Studenten"],
    ["Lesende", "Leser"],
    ["Teilnehmende", "Teilnehmer"],
    ["Nutzende", "Nutzer"],
    ["Zuhörende", "Zuhörer"],
    ["mitarbeitende Personen", "mitarbeiter"]
  ])("wandelt %s in %s um", (input, expected) => {
    expect(neutralPersonTermsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it("verarbeitet mehrere ausgewählte Umschreibungen", () => {
    expect(
      neutralPersonTermsRule.apply("Studenten durch Studierende und Lesende")
    ).toEqual({
      text: "Studenten durch Studenten und Leser",
      replacements: 2
    });
  });

  it.each([
    "Testpersonen",
    "Persönlichkeiten",
    "Liebes Kollegium",
    "Besuch der ärztlichen Sprechstunde",
    "Benutzungshandbuch"
  ])("lässt %s unverändert", (input) => {
    expect(neutralPersonTermsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
