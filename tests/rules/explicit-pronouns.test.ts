import { describe, expect, it } from "vitest";
import { explicitPronounsRule } from "../../src/rules/explicit-pronouns";

describe("explicitPronounsRule", () => {
  it.each([
    ["er:sie", "er"],
    ["sie/er", "er"],
    ["ihn*sie", "ihn"],
    ["ihr_ihm", "ihm"],
    ["seiner:ihrer", "seiner"],
    ["ihres/seines", "seines"],
    ["seinem·ihrem", "seinem"],
    ["ihren•seinen", "seinen"],
    ["sein’ihr", "sein"],
    ["ihre‘seine", "seine"],
    ["die/der", "der"],
    ["der/dem", "dem"],
    ["DER:DIE", "DER"],
    ["Sie:Er", "Er"]
  ])("wandelt %s in %s um", (input, expected) => {
    expect(explicitPronounsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it("verarbeitet mehrere explizite Paare in einem Satz", () => {
    expect(
      explicitPronounsRule.apply(
        "Er:sie gibt seinem:ihrem Kollegen, was ihm:ihr gehört."
      )
    ).toEqual({
      text: "Er gibt seinem Kollegen, was ihm gehört.",
      replacements: 3
    });
  });

  it.each([
    "Sie hilft ihr.",
    "Die Kundin ruft an.",
    "seine Katze",
    "ihre Nutzer",
    "er/siehe",
    "innerhalb",
    "der/den",
    "sein:ihr Hebamme:in",
    "der:die unbekannte:r"
  ])("lässt %s unverändert", (input) => {
    expect(explicitPronounsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
