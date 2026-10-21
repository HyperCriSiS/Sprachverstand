import { describe, expect, it } from "vitest";
import { hasAmbiguousSingularDeterminer } from "../src/rules/singular-context-guard";
import { unmarkedSingularRule } from "../src/rules/unmarked-singular";

describe("Singular-Kontext ohne vollständige Präfixsuche", () => {
  it.each([
    ["eine ", true],
    ["einem ", false],
    ["eine erfahrene zuverlässige neue ", true],
    ["eine sehr erfahrene zuverlässige neue ", false],
    ["eine, erfahrene ", false],
    ["123die ", true],
    ["die𐐀 ", false],
    ["die 𐐀 ", true],
    ["die e\u0301rfahrene ", true],
    ["DER:DIE\u00a0zuverlässige\n", true],
    ["die\u200b", false],
    ["die", false],
    ["", false]
  ])("erhält den bisherigen Kontextvertrag für %j", (prefix, expected) => {
    expect(hasAmbiguousSingularDeterminer(prefix + "Nutzer:in", prefix.length))
      .toBe(expected);
  });

  it("entspricht dem bisherigen Vier-Token-Vertrag an Satz- und Unicodegrenzen", () => {
    // Unabhängige Referenz des bisherigen Erkennungsvertrags, keine
    // Wiederholung des neuen rückwärts lesenden Algorithmus.
    const pattern = /([\p{L}\p{M}:*_\/·•.’‘-]+(?:\s+[\p{L}\p{M}:*_\/·•.’‘-]+){0,3})\s+$/u;
    const tokens = ["die", "eine", "einem", "der:die", "keine", "eine*r", "große", "e\u0301rfahrene", "𐐀", "123die", "die𐐀", "x.y"];
    const separators = [" ", "\t", "\n", "\u00a0", ", ", ". ", "\u200b"];
    for (const first of tokens) for (const second of tokens) for (const gap of separators) {
      const prefix = "Vorheriger Satz. " + first + gap + second + " ";
      const captured = pattern.exec(prefix)?.[1]?.split(/\s+/u) ?? [];
      const expected = captured.some(token =>
        hasAmbiguousSingularDeterminer(token + " ", token.length + 1));
      expect(hasAmbiguousSingularDeterminer(prefix, prefix.length), prefix).toBe(expected);
    }
  });

  it("bewahrt Schutzentscheidungen auch nach langen Texten und langen Einzelwörtern", () => {
    const earlier = "Unabhängiger neutraler Satz. ".repeat(10_000);
    const adjective = "zuverlässig".repeat(1000);
    const protectedPrefix = earlier + "eine " + adjective + " ";
    expect(hasAmbiguousSingularDeterminer(protectedPrefix, protectedPrefix.length)).toBe(true);
    expect(unmarkedSingularRule.apply("eine erfahrene Nutzer:in").text)
      .toBe("eine erfahrene Nutzer:in");
    expect(unmarkedSingularRule.apply("ein erfahrener Nutzer:in").text)
      .toBe("ein erfahrener Nutzer");
  });
});
