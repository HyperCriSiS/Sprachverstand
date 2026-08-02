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
    ["jene:r Nutzer:in", "jener Nutzer"],
    ["jene:n Student:in", "jenen Studenten"],
    ["jene:m Kund:in", "jenem Kunden"],
    ["jenes:jener Bürger:in", "jenes Bürgers"],
    ["der:die NutzerIn", "der Nutzer"],
    ["jede:r Tierärzt:in", "jeder Tierarzt"],
    ["eine:n KoautorIn", "einen Koautor"],
    ["mein:e Nutzer:in", "mein Nutzer"],
    ["meine:n Student:in", "meinen Studenten"],
    ["meine:m Kund:in", "meinem Kunden"],
    ["meines:meiner Ärzt:in", "meines Arztes"],
    ["dein:e Kolleg:in", "dein Kollege"],
    ["unser:e Tierärzt:in", "unser Tierarzt"],
    ["eure:n Pilot:in", "euren Piloten"],
    ["eure:m Nutzer:in", "eurem Nutzer"],
    ["eures:eurer Bürger:in", "eures Bürgers"],
    ["Ihr:e Nutzer:in", "Ihr Nutzer"],
    ["ein NutzerIn", "ein Nutzer"],
    ["einen StudentIn", "einen Studenten"],
    ["mit einer NutzerIn", "mit einem Nutzer"],
    ["für eine ÄrztIn", "für einen Arzt"],
    ["wegen einer StudentIn", "wegen eines Studenten"],
    ["Eine NutzerIn arbeitet heute.", "Ein Nutzer arbeitet heute."],
    ["Jene NutzerIn arbeitet heute.", "Jener Nutzer arbeitet heute."],
    ["eine NutzerIn", "ein Nutzer"],
    ["Ich sehe eine NutzerIn.", "Ich sehe einen Nutzer."],
    ["Wir suchen eine StudentIn.", "Wir suchen einen Studenten."],
    ["Es gibt eine ÄrztIn.", "Es gibt einen Arzt."],
    ["Das ist eine NutzerIn.", "Das ist ein Nutzer."],
    ["sein:ihr Nutzer:in", "sein Nutzer"],
    ["ihrem:seinem Student:in", "seinem Studenten"],
    ["der:die neue Lehrer:in", "der neue Lehrer"],
    ["den:die fleißige:n Schüler:in", "den fleißigen Schüler"],
    ["ein*e gut ausgebildete*r Jurist*in", "ein gut ausgebildeter Jurist"],
    ["eine:n neue:n Student:in", "einen neuen Studenten"],
    ["dem:der neuen LehrerIn", "dem neuen Lehrer"],
    ["des:der neuen Nutzer:in", "des neuen Nutzers"],
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
    "NutzerIn",
    "Vielleicht eine NutzerIn im Team",
    "Vielleicht jene NutzerIn im Team",
    "jede:r Innenstadt",
    "ein:e Ausgabe",
    "eine:n Kundin",
    "jede:r Hebamme:in",
    "mein:e Hebamme:in",
    "jede:r NutzerInnen",
    "jede:r Nutzer:innen",
    "des:der Messebauer:in",
    "eine:n neue Lehrer:in",
    "der:die neuen Lehrer:in",
    "den:die fleißige:r Schüler:in",
    "der:die neue Hebamme:in",
    "der:die neue Lehrerin"
  ])("lässt den mehrdeutigen oder unbekannten Fall %s unverändert", (input) => {
    expect(singularContextRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
