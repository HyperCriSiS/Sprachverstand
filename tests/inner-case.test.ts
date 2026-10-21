import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";
import { preserveInnerCase } from "../src/rules/inner-case";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Webanalyse 21.10.2026: Großbuchstaben im Wortinneren gingen verloren
// (`AfDler*innen` → „Afdler“, `TikToker*in` → „tiktoker“).
describe("Großbuchstaben im Wortinneren", () => {
  it.each([
    ["Das Weltbild vieler AfDler*innen", "Das Weltbild vieler AfDler"],
    ["ein*e berühmte*r TikToker*in", "ein berühmter TikToker"],
    ["18 EDEKAner:innen", "18 EDEKAner"],
    ["die JEFer:innen", "die JEFer"],
    ["für BWLer*innen", "für BWLer"],
    ["die CeMAS-Researcher:innen", "die CeMAS-Researcher"],
    ["Data Scientist*innen", "Data Scientists"],
    ["IT-Expert*innen", "IT-Experten"],
    ["AfDler*innen", "AfDler"],
    ["MA:innen", "MA"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));

  it.each([
    // Übliche Groß-/Kleinschreibung unverändert.
    ["LEHRER*INNEN", "LEHRER"],
    ["Lehrer*innen", "Lehrer"],
    ["ÄrztInnen", "Ärzte"],
    ["BäuerInnen", "Bauern"]
  ])("wie bisher: %s", (input, expected) => expect(t(input)).toBe(expected));

  it("greift nur bei gemischter Schreibung", () => {
    expect(preserveInnerCase("AfDler", "afdler")).toBe("AfDler");
    expect(preserveInnerCase("Lehrer", "lehrer")).toBeUndefined();
    expect(preserveInnerCase("LEHRER", "lehrer")).toBeUndefined();
    expect(preserveInnerCase("BäuerIn", "bauern")).toBeUndefined();
  });
});
