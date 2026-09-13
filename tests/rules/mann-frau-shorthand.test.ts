import { describe, expect, it } from "vitest";
import { singularDoubleFormsRule } from "../../src/rules/singular-double-forms";

describe("explizite Mann-Frau-Kurzformen", () => {
  it.each([
    ["Automatenfachmann/-frau", "Automatenfachmann"],
    ["Automobilkaufmann/-frau", "Automobilkaufmann"],
    ["Bankkaufmann/-frau", "Bankkaufmann"],
    ["Berg- und Maschinenmann/-frau", "Berg- und Maschinenmann"],
    ["Fachmann/-frau - Systemgastronomie", "Fachmann - Systemgastronomie"],
    ["Hotelfachmann/-frau", "Hotelfachmann"],
    [
      "Medienkaufmann/-frau Digital und Print",
      "Medienkaufmann Digital und Print",
    ],
    ["Pflegefachmann/-frau", "Pflegefachmann"],
    ["Werkfeuerwehrmann/-frau", "Werkfeuerwehrmann"],
    ["BANKKAUFMANN/-FRAU", "BANKKAUFMANN"],
  ])("normalisiert die amtliche Kurzform %s", (input, expected) => {
    expect(singularDoubleFormsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1,
    });
  });

  it.each([
    "Zimmermann/Zimmerfrau",
    "Mann/Frau",
    "Kaufmann/Kauffrau",
    "mannigfaltig/-frau",
  ])(
    "lässt nicht explizit unterstützte Vollformen unverändert: %s",
    (input) => {
      expect(singularDoubleFormsRule.apply(input)).toEqual({
        text: input,
        replacements: 0,
      });
    },
  );
});
