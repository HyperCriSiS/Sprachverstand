import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

describe("Häufige Personenbezeichnungen: Azubi, Fan, Flüchtling", () => {
  it.each([
    ["die Azubi:innen", "die Azubis"],
    ["alle AzubiInnen", "alle Azubis"],
    ["mit den Azubi*innen", "mit den Azubis"],
    ["jede*r Azubi*in", "jeder Azubi"],
    ["die Fan:innen", "die Fans"],
    ["ein:e Fan:in", "ein Fan"],
    ["die Flüchtling:innen", "die Flüchtlinge"],
    ["mit Flüchtling*innen", "mit Flüchtlingen"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));

  it.each(["die Fans", "der Fanclub", "Fanartikel", "die Azubis", "Flüchtlingshilfe"])(
    "lässt ungegenderte Wörter unverändert: %s", (input) => expect(t(input)).toBe(input));
});
