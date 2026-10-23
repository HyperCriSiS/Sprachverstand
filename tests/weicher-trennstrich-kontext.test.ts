import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;
const shy = "­";

// Gegenprüfung 24.10.2026, R04: Wörter mit weichem Trennstrich und ihr Kontext.
describe("Weicher Trennstrich mit Begleitwort und Adjektiv (R04)", () => {
  it.each([
    [`angehende*r Theater${shy}wissen${shy}schaftler*in, Camila`, "angehender Theaterwissenschaftler, Camila"],
    [`Wir suchen eine Theater${shy}wissen${shy}schaftler*in.`, "Wir suchen einen Theaterwissenschaftler."],
    [`Dies gilt, wenn die Mieter*in${shy} nen erst kündigen.`, "Dies gilt, wenn die Mieter erst kündigen."],
    [`Wir arbeiten mit unseren inter${shy}na${shy}tionalen Partner*innen.`, `Wir arbeiten mit unseren inter${shy}na${shy}tionalen Partnern.`]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));

  it("behält Trennstrich und Leerzeichen ohne Umwandlung", () => {
    const input = `Die Zxyabc*in${shy} nen und die Ver${shy}an${shy}stal${shy}tung.`;
    expect(t(input)).toBe(input);
  });
});
