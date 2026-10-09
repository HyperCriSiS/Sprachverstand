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
    "Die seit Stunden Forschenden ruhen.",
    "lesende Kinder",
    "Lesende Kinder öffnen das Buch."
  ])("bewahrt den grammatisch abweichenden Kontext %s", (input) => {
    expect(salutationParticiplesRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });


  it.each([
    ["Die Mitarbeitenden arbeiten.","Die Mitarbeiter arbeiten."],
    ["die Studierenden lernen.","die Studenten lernen."],
    ["Die Studierenden lernen.","Die Studenten lernen."],
    ["Eine Studierende wartet.","Eine Studentin wartet."],
    ["Ein Studierender kommt.","Ein Student kommt."],
    ["Der Studierende spricht.","Der Student spricht."],
    ["Die Lesende macht eine Pause.","Die Leserin macht eine Pause."],
    ["Eine Lehrende antwortet.","Eine Lehrerin antwortet."],
    ["Ein Forschender berichtet.","Ein Forscher berichtet."],
    ["mit den Mitarbeitenden sprechen","mit den Mitarbeitern sprechen"],
    ["mit den Forschenden sprechen","mit den Forschern sprechen"],
    ["mit den Studierenden lernen","mit den Studenten lernen"],
    ["den Studierenden folgen","den Studenten folgen"],
    ["einen Studierenden treffen","einen Studenten treffen"],
    ["einem Dozierenden helfen","einem Dozenten helfen"],
    ["eines Mitarbeitenden gedenken","eines Mitarbeiters gedenken"],
    ["die Dozierenden lehren","die Dozenten lehren"],
    ["DIE STUDIERENDEN KOMMEN","DIE STUDENTEN KOMMEN"]
  ])("normalisiert eindeutig substantivierte Formen in %s", (eingabe, ziel) => {
    expect(salutationParticiplesRule.apply(eingabe)).toEqual({
      text: ziel,
      replacements: 1
    });
  });

  it.each([
    "die studierenden Kinder spielen",
    "Die studierenden Kinder spielen",
    "die forschenden Wissenschaftler schreiben",
    "Die Studierenden Kinder kommen",
    "die Studierenden-Meldung",
    "Studierende Kinder besuchen uns",
    "die seit Stunden Forschenden ruhen",
    "der Studierenden",
    "den Mitarbeitenden",
    "den Forschenden",
    "einer Studierenden",
    "die Lernenden",
    "eine spielende Person",
    "die arbeitenden Kinder",
    "ein arbeitender Student"
  ])("schützt uneindeutige oder adjektivische Kontexte: %s", (eingabe) => {
    expect(salutationParticiplesRule.apply(eingabe)).toEqual({
      text: eingabe,
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
