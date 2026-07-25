import { describe, expect, it } from "vitest";
import { knownPluralSeparatorsRule } from "../../src/rules/known-plural-separators";

describe("knownPluralSeparatorsRule", () => {
  it("entfernt verbreitete Separatoren bei sicheren Pluralformen", () => {
    const result = knownPluralSeparatorsRule.apply(
      "Nutzer:innen, Mitarbeiter*innen, Schüler_innen, Bürger/innen, " +
        "Lehrer·innen und Fahrer•innen"
    );

    expect(result).toEqual({
      text: "Nutzer, Mitarbeiter, Schüler, Bürger, Lehrer und Fahrer",
      replacements: 6
    });
  });

  it("erhält Großschreibung und zusammengesetzte Wörter", () => {
    const result = knownPluralSeparatorsRule.apply(
      "NUTZER:INNEN und Online-Nutzer:innen"
    );

    expect(result.text).toBe("NUTZER und Online-Nutzer");
    expect(result.replacements).toBe(2);
  });

  it("lässt morphologisch unsichere Wörter unverändert", () => {
    const input =
      "Ärzt:innen, Student:innen, Kolleg:innen, Kund:innen, " +
      "Mutter:innen, Bauer:innen, Autor:innen, Moderator:innen und " +
      "Lieferant:innen";

    expect(knownPluralSeparatorsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });

  it("verändert keine normalen Wörter oder bloßen Femininformen", () => {
    const input =
      "Nutzerinnen gewinnen innen, während andere etwas ersinnen.";

    expect(knownPluralSeparatorsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });

  it("ersetzt keine Wortbestandteile", () => {
    const input = "Nutzer:innenkonto und VorNutzer:innenSuffix";

    expect(knownPluralSeparatorsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
