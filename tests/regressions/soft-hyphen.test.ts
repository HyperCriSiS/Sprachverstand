import { describe, expect, it } from "vitest";
import { transformText } from "../../src/core/transform-text";
import { knownPluralSeparatorsRule } from "../../src/rules/known-plural-separators";

describe("Soft-Hyphens auf redaktionellen Webseiten", () => {
  it("erkennt eine gegenderte Form trotz mehrerer Soft-Hyphens", () => {
    const input = "Queere und Künst\u00adle\u00adr:in\u00adnen diskutieren.";

    expect(
      transformText(input, [knownPluralSeparatorsRule], {
        profile: "aggressive"
      })
    ).toEqual({
      text: "Queere und Künstler diskutieren.",
      replacements: 1
    });
  });

  it("lässt Soft-Hyphens in nicht ersetzten Wörtern bytegenau erhalten", () => {
    const input = "Sil\u00adben\u00adtren\u00adnung ohne Genderform";

    expect(
      transformText(input, [knownPluralSeparatorsRule], {
        profile: "aggressive"
      })
    ).toEqual({
      text: input,
      replacements: 0
    });
  });
});
