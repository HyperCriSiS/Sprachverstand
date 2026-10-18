import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

describe("Substantivierte Adjektive im Plural mit Marker (Angestellt:innen)", () => {
  it.each([
    ["die Vorgesetzt:innen", "die Vorgesetzten"],
    ["ihre Vorgesetzt*innen", "ihre Vorgesetzten"],
    ["alle Angestellt:innen", "alle Angestellten"],
    ["Rechte der Beschäftigt*innen", "Rechte der Beschäftigten"],
    ["Er sprach mit allen Verwandt:innen.", "Er sprach mit allen Verwandten."],
    ["die neuen Angestellt:innen", "die neuen Angestellten"],
    ["die Kolleg:innen und Vorgesetzt:innen", "die Kollegen und Vorgesetzten"],
    ["Die AngestelltInnen", "Die Angestellten"]
  ])("schwache Flexion: %s", (input, expected) => expect(t(input)).toBe(expected));

  it.each([
    ["Bekannt*innen", "Bekannte"],
    ["Verwandt:innen sind eingeladen", "Verwandte sind eingeladen"],
    ["für Angestellt:innen", "für Angestellte"],
    ["viele neue Angestellt:innen", "viele neue Angestellte"],
    ["25 Beschäftigt*innen", "25 Beschäftigte"],
    ["Liebe Kolleg*innen und Vorgesetzt*innen", "Liebe Kollegen und Vorgesetzte"],
    ["Das Team: Angestellt:innen", "Das Team: Angestellte"]
  ])("starke Flexion: %s", (input, expected) => expect(t(input)).toBe(expected));

  it.each([
    // Ohne eindeutigen Anker bleibt der Text unverändert.
    "Wir suchen Angestellt:innen.",
    "Sie begrüßten Verwandt:innen",
    "Kolleg:innen, Vorgesetzt:innen",
    // Kein Marker bzw. unbekannte Basis.
    "Bekanntinnen",
    "die Angestellten"
  ])("bleibt unverändert oder unberührt: %s", (input) => {
    expect(t(input)).toBe(input.replace("Kolleg:innen", "Kollegen"));
  });
});
