import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../../src/rules/mapped-plural-separators";

// Explizite Regressionen real vorkommender Unicode- und Marker-Schreibweisen.
// Ein Treffer ist weiterhin nur mit bereits validierter Lexikonbasis zulässig.
describe("Unicode-Marker in bekannten Personenpluralen", () => {
  it.each([
    ["Nutzer∕innen", "Nutzer"],
    ["Nutzer⁄innen", "Nutzer"],
    ["Nutzer／innen", "Nutzer"],
    ["Nutzer∕-innen", "Nutzer"],
    ["Nutzer⁄-innen", "Nutzer"],
    ["Nutzer／-innen", "Nutzer"],
    ["Nutzer∕inne∕n", "Nutzer"],
    ["Nutzer⁄inne⁄n", "Nutzer"],
    ["Nutzer／inne／n", "Nutzer"],
    ["Ärzt∕innen", "Ärzte"],
    ["Student／-innen", "Studenten"],
    ["Kund⁄innen", "Kunden"],
    ["Nutzer(-innen)", "Nutzer"],
    ["Ärzt(-innen)", "Ärzte"],
    ["Nutzer(innen)", "Nutzer"],
    ["Nutzer:innen", "Nutzer"],
    ["Student*innen", "Studenten"],
    ["Kolleg_innen", "Kollegen"],
    ["NUTZER／INNEN", "NUTZER"],
    ["Mutter∕inneninitiative", "Mütterinitiative"]
  ])("bildet %s ausschließlich per Lexikontreffer zu %s ab", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it("verarbeitet verschiedene Markertypen innerhalb eines Satzes", () => {
    expect(
      mappedPluralSeparatorsRule.apply(
        "Nutzer∕innen, Ärzt⁄innen und Student／-innen bleiben im Text."
      )
    ).toEqual({
      text: "Nutzer, Ärzte und Studenten bleiben im Text.",
      replacements: 3
    });
  });

  it.each([
    "Robot∕innen",
    "Schwester⁄innen",
    "Cousine／innen",
    "Robot(-innen)",
    "Nutzer∕in",
    "Nutzer(-in)",
    "Nutzer: innen",
    "Nutzer\u00AD∕innen",
    "Vor\u00ADNutzer∕innen",
    "Kaufmann/frau",
    "https://example.org/",
    "ein:e neue Person",
    "Nutzerinnen"
  ])("lässt unbekannte, nicht-plurale oder geschützte Form %s unverändert", (input) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});