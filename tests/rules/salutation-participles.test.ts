import { describe, expect, it } from "vitest";
import { salutationParticiplesRule } from "../../src/rules/salutation-participles";

describe("salutationParticiplesRule", () => {
  it.each([
    ["Sehr geehrte Mitarbeitende", "Sehr geehrte Mitarbeiter"],
    ["Liebe Teilnehmende", "Liebe Teilnehmer"],
    [
      "Sehr geehrte Nutzende unserer Produkte",
      "Sehr geehrte Nutzer unserer Produkte"
    ],
    ["Liebe Studierende,", "Liebe Studenten,"],
    ["SEHR GEEHRTE FORSCHENDE", "SEHR GEEHRTE FORSCHER"]
  ])("wandelt %s in %s um", (input, expected) => {
    expect(salutationParticiplesRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it("verändert Partizipformen außerhalb eindeutiger Anreden nicht", () => {
    const input =
      "Die Mitarbeitenden arbeiten, die seit Stunden Forschenden ruhen und Nutzende testen.";

    expect(salutationParticiplesRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });

  it("lässt semantisch eigenständige Sammelbegriffe unverändert", () => {
    const input = "Sehr geehrte Persönlichkeiten. Liebes Kollegium.";

    expect(salutationParticiplesRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
