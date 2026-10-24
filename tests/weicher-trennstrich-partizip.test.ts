import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Gegenprüfung vom 26.10.2026 (N32).
describe("Weicher Trennstrich hebt richtige Partizipersetzungen nicht auf", () => {
  it.each([
    ["Für die Exkur­sionen haben wir gezielt Dozierende gefragt.", "Für die Exkur­sionen haben wir gezielt Dozenten gefragt."],
    ["Sie reflektieren Bestehendes anders als Mit­arbei­tende mit Erfahrung.", "Sie reflektieren Bestehendes anders als Mitarbeiter mit Erfahrung."],
    // Markierte Wörter folgen dem gemeinsamen Kontext: keine halbe Umwandlung.
    ["dass wir für jeden Fall eine spezia­li­sierte Anwält:in finden",
      "dass wir für jeden Fall eine spezia­li­sierte Anwält:in finden"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});
