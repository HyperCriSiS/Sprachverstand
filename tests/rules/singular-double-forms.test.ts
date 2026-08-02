import { describe, expect, it } from "vitest";
import { singularDoubleFormsRule } from "../../src/rules/singular-double-forms";

describe("singularDoubleFormsRule", () => {
  it.each([
    ["Kunde/Kundin", "Kunde"],
    ["Kunde:Kundin", "Kunde"],
    ["Kundin / Kunde", "Kunde"],
    ["Arzt und Ärztin", "Arzt"],
    ["Arzt:Ärztin", "Arzt"],
    ["Studentin oder Student", "Student"],
    ["Kollege bzw. Kollegin", "Kollege"],
    ["Nutzer & Nutzerin", "Nutzer"],
    ["Online-Nutzer beziehungsweise Online-Nutzerin", "Online-Nutzer"],
    ["Privatkunde/Privatkundin", "Privatkunde"],
    ["Tierärztin/Tierarzt", "Tierarzt"],
    ["Koautor und Koautorin", "Koautor"],
    ["Bauer/Bäuerin", "Bauer"],
    ["Messebauer/Messebauerin", "Messebauer"],
    ["KUNDE/KUNDIN", "KUNDE"],
    ["eine Nutzerin oder ein Nutzer", "ein Nutzer"],
    ["einen Studenten und eine Studentin", "einen Studenten"],
    ["einer Studentin und einem Studenten", "einem Studenten"],
    ["eines Arztes oder einer Ärztin", "eines Arztes"],
    ["meine Kundin und mein Kunde", "mein Kunde"],
    ["unserem Piloten und unserer Pilotin", "unserem Piloten"]
  ])("führt %s zu %s zusammen", (input, expected) => {
    expect(singularDoubleFormsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it("verarbeitet mehrere Doppelformen in einem Satz", () => {
    expect(
      singularDoubleFormsRule.apply(
        "Kunde/Kundin spricht mit Arzt/Ärztin."
      )
    ).toEqual({
      text: "Kunde spricht mit Arzt.",
      replacements: 2
    });
  });

  it.each([
    "Die Kundin ruft an.",
    "Mutter/Vater",
    "Nutzer/Benutzer",
    "Kunde/Kundinnen",
    "Bauer/Bauerin",
    "Messebauer/Messebäuerin",
    "Innen- und Außendienst",
    "Nutzerin und Nutzerin"
  ])("lässt %s unverändert", (input) => {
    expect(singularDoubleFormsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
