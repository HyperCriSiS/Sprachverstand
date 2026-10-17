import { describe, expect, it } from "vitest";
import { isProbablyTechnicalText } from "../src/core/text-safety";

describe("Technische Textprüfung ohne wiederholte E-Mail-Präfixsuche", () => {
  it.each([
    ["name@example.org", true],
    ["@@name@example.org", true],
    ["name@example.org@tail", true],
    ["name@example.", false],
    ["name@.org", false],
    ["name@x..", true],
    ["name\u00a0@example.org", false],
    ["𐐀@e\u0301.org", true],
    ["name@x\u200b.org", true]
  ])("bewahrt die bisherige Schutzentscheidung für %s", (token, expected) => {
    expect(isProbablyTechnicalText("Prosa " + token + " neutral")).toBe(expected);
  });

  it("entspricht dem bisherigen E-Mail-Vertrag bei vielen Unicode- und Tokenkombinationen", () => {
    const previous = /[^\s@]+@[^\s@]+\.[^\s@]+/u;
    const characters = ["a", "x", "@", ".", " ", "\t", "\u00a0", "𐐀", "e\u0301", "\u200b"];
    let seed = 193181;
    for (let trial = 0; trial < 5000; trial += 1) {
      let token = "";
      for (let index = 0; index < 30; index += 1) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        token += characters[seed % characters.length];
      }
      const input = "Prosa " + token + " neutral";
      expect(isProbablyTechnicalText(input), input).toBe(previous.test(input));
    }
  });

  it("bewahrt Base64- und Fehladressentscheidungen bei langen Einzel-Tokens", () => {
    const word = "A".repeat(20000);
    expect(isProbablyTechnicalText(word)).toBe(true);
    expect(isProbablyTechnicalText(word + "@abc.")).toBe(false);
  });
});
