import { describe, expect, it } from "vitest";
import { createRegexRule } from "../src/core/rule";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const safeRule = createRegexRule({
  id: "test.safe",
  risk: "safe",
  pattern: /Nutzer:innen/gu,
  replace: () => "Nutzer"
});

const aggressiveRule = createRegexRule({
  id: "test.aggressive",
  risk: "aggressive",
  pattern: /Leser:innen/gu,
  replace: () => "Leser"
});

describe("transformText", () => {
  it("wendet erlaubte Regeln an und zählt Ersetzungen", () => {
    const result = transformText(
      "Nutzer:innen und Nutzer:innen",
      [safeRule],
      { profile: "conservative" }
    );

    expect(result).toEqual({
      text: "Nutzer und Nutzer",
      replacements: 2
    });
  });

  it("berücksichtigt das Risikoprofil", () => {
    const result = transformText(
      "Leser:innen",
      [aggressiveRule],
      { profile: "standard" }
    );

    expect(result).toEqual({
      text: "Leser:innen",
      replacements: 0
    });
  });

  it("überspringt explizit deaktivierte Regeln", () => {
    const result = transformText(
      "Nutzer:innen",
      [safeRule],
      {
        profile: "conservative",
        disabledRuleIds: new Set(["test.safe"])
      }
    );

    expect(result.text).toBe("Nutzer:innen");
  });

  it("schützt persönliche Wörter und Phrasen ohne Teilworttreffer", () => {
    const result = transformText(
      "Nutzer:innen und Nutzer:innenkonto",
      [safeRule],
      {
        profile: "conservative",
        protectedTerms: ["Nutzer:innen"]
      }
    );

    expect(result).toEqual({
      text: "Nutzer:innen und Nutzerkonto",
      replacements: 1
    });
  });

  it("wendet Regeln außerhalb persönlicher Ausnahmen weiter an", () => {
    const result = transformText(
      "Geschützte Nutzer:innen und weitere Nutzer:innen",
      [safeRule],
      {
        profile: "conservative",
        protectedTerms: ["Geschützte Nutzer:innen"]
      }
    );

    expect(result).toEqual({
      text: "Geschützte Nutzer:innen und weitere Nutzer",
      replacements: 1
    });
  });

  it("wendet eigene Ersetzungen vor den eingebauten Regeln an und schützt das Ergebnis", () => {
    expect(
      transformText("Nutzer:innen und Sonderform", [safeRule], {
        profile: "conservative",
        customReplacements: [
          { source: "Nutzer:innen", replacement: "Leser" },
          { source: "Sonderform", replacement: "Nutzer:innen" }
        ]
      })
    ).toEqual({
      text: "Leser und Nutzer:innen",
      replacements: 2
    });
  });

  it("führt eigene Ersetzungen nicht rekursiv aus", () => {
    expect(
      transformText("A", [], {
        profile: "conservative",
        customReplacements: [
          { source: "A", replacement: "B" },
          { source: "B", replacement: "C" }
        ]
      })
    ).toEqual({ text: "B", replacements: 1 });
  });

  it("beachtet bei eigenen Ersetzungen die Groß- und Kleinschreibung", () => {
    expect(
      transformText("Form form", [], {
        profile: "conservative",
        customReplacements: [{ source: "Form", replacement: "Begriff" }]
      })
    ).toEqual({ text: "Begriff form", replacements: 1 });
  });

  it("gibt persönlichen Ausnahmen Vorrang vor eigenen Ersetzungen", () => {
    expect(
      transformText("Nutzer:innen", [safeRule], {
        profile: "conservative",
        protectedTerms: ["Nutzer:innen"],
        customReplacements: [
          { source: "Nutzer:innen", replacement: "Leser" }
        ]
      })
    ).toEqual({ text: "Nutzer:innen", replacements: 0 });
  });

  it("korrigiert standardmäßig auch innerhalb von Anführungszeichen", () => {
    expect(
      transformText("„Nutzer:innen“ und Nutzer:innen", [safeRule], {
        profile: "conservative"
      })
    ).toEqual({
      text: "„Nutzer“ und Nutzer",
      replacements: 2
    });
  });

  it("kann direkt zitierte Schreibweisen schützen", () => {
    expect(
      transformText(
        "„Nutzer:innen“ und \"Nutzer:innen\" sowie Nutzer:innen",
        [safeRule],
        {
          profile: "conservative",
          processQuotedText: false
        }
      )
    ).toEqual({
      text: "„Nutzer:innen“ und \"Nutzer:innen\" sowie Nutzer",
      replacements: 1
    });
  });
});
describe("Pre-Release P1: normale Feminina und finale Benutzerersetzungen", () => {
  it.each([
    "Die Studentin arbeitet.",
    "Die Kundin arbeitet.",
    "Wir sprechen mit der Ärztin.",
    "Ohne die Kundin geht es nicht.",
    "Wegen der Studentin bleibt die Schule geschlossen.",
    "Die Kundin.",
    "Ich besuche die Kundin.",
    "Das ist eine Studentin."
  ])("verändert ein nicht markiertes Femininum nicht: %s", (eingabe) => {
    expect(transformText(eingabe, defaultRules, { profile: "aggressive" }).text).toBe(eingabe);
  });

  it("erhält ein durch Partizipkorrektur erzeugtes Femininum auch im zweiten Durchlauf", () => {
    const optionen = { profile: "aggressive" as const };
    const einmal = transformText("Die Studierende arbeitet.", defaultRules, optionen);
    expect(einmal.text).toBe("Die Studentin arbeitet.");
    expect(transformText(einmal.text, defaultRules, optionen)).toEqual({
      text: einmal.text, replacements: 0
    });
  });

  it("korrigiert ausdrücklich sichtbares Binnen-I weiterhin", () => {
    expect(transformText("Die StudentIn arbeitet.", defaultRules, { profile: "aggressive" }).text)
      .toBe("Der Student arbeitet.");
  });

  it("schützt eine vollständige Phrase mit weichem Trennzeichen", () => {
    const eingabe = "geschützte Nutzer\u00ad:innen und weitere Nutzer\u00ad:innen";
    expect(transformText(eingabe, [safeRule], {
      profile: "conservative",
      protectedTerms: ["geschützte Nutzer\u00ad:innen"]
    })).toEqual({
      text: "geschützte Nutzer\u00ad:innen und weitere Nutzer",
      replacements: 1
    });
  });

  it("wendet die eingebauten Regeln niemals erneut auf ein eigenes Ersetzungsziel an", () => {
    expect(transformText("Hallo", [safeRule], {
      profile: "conservative",
      customReplacements: [{ source: "Hallo", replacement: "Nutzer\u00ad:innen" }]
    })).toEqual({ text: "Nutzer\u00ad:innen", replacements: 1 });
  });

  it("korrigiert ungeschützte weiche Trennstellen weiterhin", () => {
    expect(transformText("Nutzer\u00ad:innen", [safeRule], { profile: "conservative" }))
      .toEqual({ text: "Nutzer", replacements: 1 });
  });
});
