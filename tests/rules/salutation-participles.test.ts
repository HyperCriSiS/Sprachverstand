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

  it.each([
    ["Studierende", "Studenten"],
    ["Lesende", "Leser"],
    ["Arbeitnehmende", "Arbeitnehmer"],
    ["Zuhörende", "Zuhörer"],
    ["Dozierende", "Dozenten"],
    ["Arbeitgebende", "Arbeitgeber"],
    ["Fördergebende", "Förderer"],
    ["Theatermachende", "Theatermacher"],
    ["mitarbeitende Personen", "mitarbeiter"],
    ["Mitarbeitende Personen", "Mitarbeiter"]
  ])("normalisiert die ausgewählte Personenbezeichnung %s", (input, expected) => {
    expect(salutationParticiplesRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it("verarbeitet mehrere ausgewählte Partizipformen", () => {
    expect(
      salutationParticiplesRule.apply(
        "Studierende, Arbeitnehmende und Lesende treffen sich."
      )
    ).toEqual({
      text: "Studenten, Arbeitnehmer und Leser treffen sich.",
      replacements: 3
    });
  });

  it.each([
    "Die Mitarbeitenden arbeiten.",
    "Die seit Stunden Forschenden ruhen.",
    "Eine Studierende wartet.",
    "Die Lesende macht eine Pause.",
    "lesende Kinder",
    "Lesende Kinder öffnen das Buch."
  ])("bewahrt den grammatisch abweichenden Kontext %s", (input) => {
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
