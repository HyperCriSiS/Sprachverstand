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
    ["des:der Ärzt:in", "des Arztes"],
    ["des:der Nutzer:in", "des Nutzers"],
    ["des/der Student/in", "des Studenten"],
    ["eines:einer Autor:in", "eines Autors"],
    ["keines:keiner Kund:in", "keines Kunden"],
    ["jedes.jeder Bürger.in", "jedes Bürgers"],
    ["welches’welcher Tierärzt’in", "welches Tierarztes"],
    ["ein:e Student:in", "ein Student"],
    ["eine:n Student:in", "einen Studenten"],
    ["einem:einer Student:in", "einem Studenten"],
    ["keine:m Kund:in", "keinem Kunden"],
    ["welche:r Kolleg:in", "welcher Kollege"],
    ["diese:n Pilot:in", "diesen Piloten"],
    ["der:die NutzerIn", "der Nutzer"],
    ["jede:r Tierärzt:in", "jeder Tierarzt"],
    ["eine:n KoautorIn", "einen Koautor"],
    ["JEDE:R NUTZER:IN", "JEDER NUTZER"],
    ["DES:DER NUTZER:IN", "DES NUTZERS"]
  ])("wandelt %s in %s um", (input, expected) => {
    expect(singularContextRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it("verarbeitet mehrere Fälle innerhalb eines Satzes", () => {
    expect(
      singularContextRule.apply(
        "Jede:r Nutzer:in kennt den Namen eines:einer Student:in."
      )
    ).toEqual({
      text: "Jeder Nutzer kennt den Namen eines Studenten.",
      replacements: 2
    });
  });

  it.each([
    "eine NutzerIn",
    "NutzerIn",
    "jede:r Innenstadt",
    "ein:e Ausgabe",
    "eine:n Kundin",
    "jede:r Hebamme:in",
    "jede:r NutzerInnen",
    "jede:r Nutzer:innen",
    "des:der Messebauer:in"
  ])("lässt den mehrdeutigen oder unbekannten Fall %s unverändert", (input) => {
    expect(singularContextRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
