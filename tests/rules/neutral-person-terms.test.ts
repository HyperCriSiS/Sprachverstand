import { describe, expect, it } from "vitest";
import { neutralPersonTermsRule } from "../../src/rules/neutral-person-terms";

describe("neutralPersonTermsRule", () => {
  it.each([
    ["mitarbeitende Personen", "mitarbeiter"],
    ["Mitarbeitende Personen", "Mitarbeiter"],
    ["Benutzungshandbuch", "Benutzerhandbuch"]
  ])("wandelt den geprüften Kontext %s in %s um", (input, expected) => {
    expect(neutralPersonTermsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it("verarbeitet mehrere geprüfte Umschreibungen", () => {
    expect(
      neutralPersonTermsRule.apply(
        "Mitarbeitende Personen öffnen das Benutzungshandbuch"
      )
    ).toEqual({
      text: "Mitarbeiter öffnen das Benutzerhandbuch",
      replacements: 2
    });
  });

  it.each([
    "Mitarbeitende",
    "Studierende",
    "Lesende",
    "Teilnehmende",
    "Nutzende",
    "Zuhörende",
    "Testpersonen",
    "Persönlichkeiten",
    "Liebes Kollegium",
    "Besuch der ärztlichen Sprechstunde",
    "Die seit Stunden Lesenden machen eine Pause."
  ])("lässt den nicht hinreichend bestimmten Kontext %s unverändert", (input) => {
    expect(neutralPersonTermsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
