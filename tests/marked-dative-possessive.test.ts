import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

describe("Dativplural nach Begleitwörtern auf -en", () => {
  it.each([
    ["Wir danken unseren erfahrenen Lehrer*innen.", "Wir danken unseren erfahrenen Lehrern."],
    ["Sie vertrauen ihren Kolleg:innen.", "Sie vertrauen ihren Kollegen."],
    ["Wir danken allen Mitarbeiter:innen.", "Wir danken allen Mitarbeitern."],
    ["Das gehört diesen Forscher*innen.", "Das gehört diesen Forschern."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));

  it.each([
    ["Wir begrüßen unsere Lehrer*innen.", "Wir begrüßen unsere Lehrer."],
    ["Ihre persönlichen Betreuer:innen helfen gern.", "Ihre persönlichen Betreuer helfen gern."],
    ["persönlichen Betreuer:innen", "persönlichen Betreuer"]
  ])("lässt Nicht-Dativ unverändert: %s", (input, expected) => expect(t(input)).toBe(expected));
});
