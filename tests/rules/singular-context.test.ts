import { describe, expect, it } from "vitest";
import { singularContextRule } from "../../src/rules/singular-context";

describe("singularContextRule", () => {
  it.each([
    ["jede:r Nutzer:in", "jeder Nutzer"],
    ["jede*n Nutzer*in", "jeden Nutzer"],
    ["jede_m Nutzer_in", "jedem Nutzer"],
    ["der/die Ärzt/in", "der Arzt"],
    ["die/den Ärzt/in", "den Arzt"],
    ["der/dem Ärzt/in", "dem Arzt"],
    ["ein:e Student:in", "ein Student"],
    ["eine:n Student:in", "einen Studenten"],
    ["einem:einer Student:in", "einem Studenten"],
    ["keine:m Kund:in", "keinem Kunden"],
    ["welche:r Kolleg:in", "welcher Kollege"],
    ["diese:n Pilot:in", "diesen Piloten"],
    ["der:die NutzerIn", "der Nutzer"],
    ["jede:r Tierärzt:in", "jeder Tierarzt"],
    ["eine:n KoautorIn", "einen Koautor"],
    ["JEDE:R NUTZER:IN", "JEDER NUTZER"]
  ])("wandelt %s in %s um", (input, expected) => {
    expect(singularContextRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it("verarbeitet mehrere Fälle innerhalb eines Satzes", () => {
    expect(
      singularContextRule.apply(
        "Jede:r Nutzer:in spricht mit einem:einer Student:in."
      )
    ).toEqual({
      text: "Jeder Nutzer spricht mit einem Studenten.",
      replacements: 2
    });
  });

  it.each([
    "eine NutzerIn",
    "NutzerIn",
    "Mutter:in",
    "jede:r Innenstadt",
    "ein:e Ausgabe",
    "eine:n Kundin",
    "des:der Nutzer:in",
    "jede:r Hebamme:in",
    "jede:r NutzerInnen",
    "jede:r Nutzer:innen"
  ])("lässt den mehrdeutigen oder unbekannten Fall %s unverändert", (input) => {
    expect(singularContextRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
