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
});
