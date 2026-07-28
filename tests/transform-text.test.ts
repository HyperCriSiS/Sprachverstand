import { describe, expect, it } from "vitest";
import { createRegexRule } from "../src/core/rule";
import { transformText } from "../src/core/transform-text";

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
