import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

describe("Substantivierte Partizipien in der vollständigen Pipeline", () => {
  it.each([
    ["Die Mitarbeitenden arbeiten.","Die Mitarbeiter arbeiten."],
    ["die Studierenden lernen.","die Studenten lernen."],
    ["Eine Studierende wartet.","Eine Studentin wartet."],
    ["Ein Studierender kommt.","Ein Student kommt."],
    ["Eine Lehrende antwortet.","Eine Lehrerin antwortet."],
    ["mit den Mitarbeitenden sprechen","mit den Mitarbeitern sprechen"],
    ["mit den Forschenden sprechen","mit den Forschern sprechen"],
    ["mit den Studierenden lernen","mit den Studenten lernen"],
    ["den Studierenden folgen","den Studenten folgen"],
    ["einem Dozierenden helfen","einem Dozenten helfen"],
    ["eines Mitarbeitenden gedenken","eines Mitarbeiters gedenken"],
    ["die Dozierenden lehren","die Dozenten lehren"]
  ])("beugt klare Kontextform %s grammatisch korrekt", (eingabe, ziel) => {
    const ergebnis = transformText(eingabe, defaultRules, { profile: "aggressive" });
    expect(ergebnis.text).toBe(ziel);
    expect(ergebnis.replacements).toBeGreaterThan(0);
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
  ])("bewahrt attributive oder mehrdeutige Schreibweise: %s", (eingabe) => {
    expect(transformText(eingabe, defaultRules, { profile: "aggressive" }).text)
      .toBe(eingabe);
  });

  it("respektiert abgeschaltete Partizip-Gruppe", () => {
    const ausgabe = transformText("die Studierenden", defaultRules, {
      profile: "aggressive",
      disabledRuleIds: new Set(["salutation.participial-forms"])
    });
    expect(ausgabe).toEqual({ text: "die Studierenden", replacements: 0 });
  });

  it("respektiert persönliche Ausnahmen auch innerhalb eines Satzes", () => {
    const ergebnis = transformText(
      "Die Studierenden und die Mitarbeitenden treffen sich.",
      defaultRules,
      { profile: "aggressive", protectedTerms: ["die Studierenden"] }
    );
    expect(ergebnis.text).toBe("Die Studierenden und die Mitarbeiter treffen sich.");
    expect(ergebnis.replacements).toBe(1);
  });
});
