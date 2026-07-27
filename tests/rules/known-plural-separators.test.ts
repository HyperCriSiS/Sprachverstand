import { describe, expect, it } from "vitest";
import { knownPluralSeparatorsRule } from "../../src/rules/known-plural-separators";

describe("knownPluralSeparatorsRule", () => {
  it("entfernt verbreitete Separatoren bei sicheren Pluralformen", () => {
    const result = knownPluralSeparatorsRule.apply(
      "Nutzer:innen, Mitarbeiter*innen, Schüler_innen, Bürger/innen, " +
        "Lehrer·innen, Fahrer•innen, Entwickler.innen, " +
        "US-Bürger’innen, Zuschauer‘innen und „Mitarbeiter/-innen“"
    );

    expect(result).toEqual({
      text:
        "Nutzer, Mitarbeiter, Schüler, Bürger, Lehrer, Fahrer, " +
        "Entwickler, US-Bürger, Zuschauer und „Mitarbeiter“",
      replacements: 10
    });
  });

  it("erhält Großschreibung und zusammengesetzte Wörter", () => {
    const result = knownPluralSeparatorsRule.apply(
      "NUTZER:INNEN, Online-Nutzer:innen, Nutzer:innenkonto und " +
        "Mitarbeiter*innenportal"
    );

    expect(result).toEqual({
      text: "NUTZER, Online-Nutzer, Nutzerkonto und Mitarbeiterportal",
      replacements: 4
    });
  });

  it.each([
    ["Gegner*innenschaft", "Gegnerschaft"],
    ["Professor*innenschaft", "Professorenschaft"],
    ["Pförtner*innen", "Pförtner"],
    ["Spender*innen", "Spender"],
    ["Tonmeister*innen", "Tonmeister"]
  ])("normalisiert den geprüften sicheren Fall %s", (input, expected) => {
    expect(knownPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
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

  it("korrigiert die vollständige Sternchen-Pluralform im Satz", () => {
    expect(knownPluralSeparatorsRule.apply("zehn Zuhörer*innen")).toEqual({
      text: "zehn Zuhörer",
      replacements: 1
    });
  });
});
