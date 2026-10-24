import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Gegenprüfung vom 25.10.2026.
describe("Konjunktiv im Nebensatz mit eigenem Subjekt (N22)", () => {
  it.each([
    ["Ich hoffe, dass er heute die Ärzt*in möge.", "Ich hoffe, dass er heute den Arzt möge."],
    ["Ich hoffe, dass Peter die Ärzt*in möge.", "Ich hoffe, dass Peter den Arzt möge."],
    ["Ich hoffe, dass er die Ärzt*in werde unterstützen.", "Ich hoffe, dass er den Arzt werde unterstützen."],
    // Ohne eigenes Subjekt bleibt die Gruppe Subjekt.
    ["Wir hoffen, eine Ärzt*in werde eingeladen.", "Wir hoffen, ein Arzt werde eingeladen."],
    ["Ich hoffe, dass die Ärzt*in kommen möge.", "Ich hoffe, dass der Arzt kommen möge."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});
