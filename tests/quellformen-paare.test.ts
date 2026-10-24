import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Restfälle der Gegenprüfung vom 26.10.2026 (R05).
describe("Ungewöhnliche Paarschreibungen nach markiertem Adjektiv", () => {
  it.each([
    ["als staatlich anerkannte/n Heilpädagogen/in oder", "als staatlich anerkannten Heilpädagogen oder"],
    ["Sozialpädagogische/n Assistentin/en (w/m/d) bzw. staatl. anerkannte/n Erzieher/in (m/w/d)",
      "Sozialpädagogischen Assistenten bzw. staatl. anerkannten Erzieher"],
    // Ohne markiertes Adjektiv bleibt die Lesart als Plural oder Kasusform.
    ["Wie spreche ich mit Freundin/en darüber?", "Wie spreche ich mit Freundin/en darüber?"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});
