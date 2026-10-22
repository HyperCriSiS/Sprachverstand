import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Webanalyse 21.10.2026: Bei Schrägstrich- und Koordinationspaaren wurde
// nur das zweite Substantiv umgewandelt (`die Hausärzt:in/Facharzt`,
// `Spender:in und Empfänger`), weil es ohne das gemeinsame Begleitwort
// des ersten beurteilt wurde.
describe("Schrägstrich- und Koordinationspaare", () => {
  it.each([
    ["bei Ihrem:r Hausärzt:in/Fachärzt:in", "bei Ihrem Hausarzt/Facharzt"],
    ["mit seinem/r Betreuer*in", "mit seinem Betreuer"],
    ["erhalten Sie von Ihrem/r Berater:in.", "erhalten Sie von Ihrem Berater."],
    ["Lehrer*in und Erzieher*in", "Lehrer und Erzieher"],
    ["Gesundheits- und Krankenpfleger*in", "Gesundheits- und Krankenpfleger"],
    // Ausgeschriebenes Begleitwortpaar: das maskuline Glied bleibt.
    ["jede und jeder Expert*in", "jeder Experte"]
  ])("wandelt %s ganz um", (input, expected) => expect(t(input)).toBe(expected));

  it.each([
    "die Hausärzt:in/Fachärzt:in",
    "die Künstler:in oder Kurator:in",
    "die Spender:in und Empfänger:in",
    "eine Patient*in und Therapeut*in"
  ])("lässt %s nicht halb umgewandelt", (input) => {
    const output = t(input);
    expect(output).toBe(input);
  });
});
