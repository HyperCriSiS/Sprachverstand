import { describe, expect, it } from "vitest";
import { salutationParticiplesRule } from "../src/rules/salutation-participles";
import { substantivizedAdjectivesRule } from "../src/rules/substantivized-adjectives";
import { transformText } from "../src/core/transform-text";
import { knownPluralSeparatorsRule } from "../src/rules/known-plural-separators";

describe("Begrenzte Kontextscans erhalten Sprach- und Schutzgrenzen", () => {
  it.each([
    "eine sehr besonders außerordentlich zuverlässig aktiv neu Forschende",
    "die\u00a0𐐀\tForschende",
    "eine e\u0301rfahrene Forschende",
    "als Forschende"
  ])("bewahrt den Singular-Kontext nach langem Präfix: %s", (suffix) => {
    const prefix = "Neutraler Satz. ".repeat(1000);
    expect(salutationParticiplesRule.apply(prefix + suffix)).toEqual({
      text: prefix + suffix, replacements: 0
    });
  });

  it("schneidet keine langen Wörter zu scheinbaren Artikeln zurecht", () => {
    const prefix = "x".repeat(2000) + "eine ";
    expect(salutationParticiplesRule.apply(prefix + "Forschende")).toEqual({
      text: prefix + "Forscher", replacements: 1
    });
    const markedPrefix = "x".repeat(2000) + "ein:e ";
    expect(substantivizedAdjectivesRule.apply(markedPrefix + "Erwachsene:r")).toEqual({
      text: markedPrefix + "Erwachsener", replacements: 1
    });
  });

  it("bewahrt markierte Artikel vor inkongruenten Adjektiven nach langem Text", () => {
    const input = "Neutraler Satz. ".repeat(1000) + "einem:einer Erwachsene:r";
    expect(substantivizedAdjectivesRule.apply(input)).toEqual({text: input, replacements: 0});
  });

  it("entfernt Soft-Hyphens nur aus korrigierten Tokens, auch bei langen Kontexten", () => {
    const prefix = ("Sil\u00adben ".repeat(1000));
    expect(transformText(prefix + "Nut\u00adzer:innen", [knownPluralSeparatorsRule], {
      profile: "aggressive", leadingContext: "Voran\u00adgestellt "
    })).toEqual({text: prefix + "Nutzer", replacements: 1});
  });

  it("erhält gültige Zitatpaare hinter vielen ungepaarten Öffnungszeichen", () => {
    const prefix = "„neutral ".repeat(1000);
    const input = prefix + '"Nutzer:innen" und Nutzer:innen';
    expect(transformText(input, [knownPluralSeparatorsRule], {
      profile: "aggressive", processQuotedText: false
    })).toEqual({text: prefix + '"Nutzer:innen" und Nutzer', replacements: 1});
  });
});
