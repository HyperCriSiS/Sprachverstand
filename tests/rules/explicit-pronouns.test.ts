import { describe, expect, it } from "vitest";
import { explicitPronounsRule } from "../../src/rules/explicit-pronouns";

describe("explicitPronounsRule", () => {
  it.each([
    ["er:sie", "er"],
    ["sie/er", "er"],
    ["ihn*sie", "ihn"],
    ["ihr_ihm", "ihm"],
    ["dessen:deren", "dessen"],
    ["deren/dessen", "dessen"],
    ["dieser:diese", "dieser"],
    ["diese/diesen", "diesen"],
    ["diesem*dieser", "diesem"],
    ["dieser_dieses", "dieses"],
    ["jede:r", "jeder"],
    ["jede*r", "jeder"],
    ["ein:e", "ein"],
    ["ein_e", "ein"],
    ["seiner:ihrer", "seiner"],
    ["ihres/seines", "seines"],
    ["seinem·ihrem", "seinem"],
    ["ihren•seinen", "seinen"],
    ["sein’ihr", "sein"],
    ["ihre‘seine", "seine"],
    ["die/der", "der"],
    ["der/dem", "dem"],
    ["DER:DIE", "DER"],
    ["DESSEN:DEREN", "DESSEN"],
    ["DIESER:DIESE", "DIESER"],
    ["JEDE:R", "JEDER"],
    ["EIN:E", "EIN"],
    ["Sie:Er", "Er"],
    ["jede/-r", "jeder"],
    ["JEDE/-R", "JEDER"]
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
    "dessen Fall",
    "deren Nutzer",
    "dieser Fall",
    "diese Nutzer",
    "eine Person",
    "ein:e Nutzer:in",
    "jede:r Nutzer:in",
    "sein:ihr Hebamme:in",
    "dieser:diese Nutzer:in",
    "der:die unbekannte:r",
    "jede/-r Nutzer:in"
  ])("lässt %s unverändert", (input) => {
    expect(explicitPronounsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
