import { describe, expect, it } from "vitest";
import { unmarkedSingularRule } from "../../src/rules/unmarked-singular";

describe("unmarkedSingularRule", () => {
  it.each([
    ["Makler*in", "Makler"],
    ["Expert*in", "Experte"],
    ["Ärzt_in", "Arzt"],
    ["Professor/in", "Professor"],
    ["Professor/-in", "Professor"],
    ["Direktor_in", "Direktor"],
    ["Lehrer/-in", "Lehrer"],
    ["Verkäufer/-in", "Verkäufer"],
    ["Mitarbeiter/-in", "Mitarbeiter"],
    ["NutzerIn", "Nutzer"],
    ["StudentIn", "Student"],
    ["ÄrztIn", "Arzt"],
    ["Verbündete_r", "Verbündeter"],
    ["Verbündete*r", "Verbündeter"],
    ["Pat*in", "Pate"],
    ["Dozent*in", "Dozent"],
    ["Jüd*in", "Jude"],
    ["FRISÖR/-IN", "FRISÖR"]
  ])("wandelt %s in %s um", (input, expected) => {
    expect(unmarkedSingularRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    "Politikerinnen",
    "Vielleicht eine NutzerIn im Team",
    "Vielleicht jene NutzerIn im Team",
    "eine:n neue Lehrer:in",
    "die neue Lehrer:in",
    "Hebamme:in",
    "Mutter:in",
    "Prof.in",
    "Dr.in",
    "zehn Zuhörer*inne",
    "trans* Personen",
    "inter* Personen",
    "Inter*feindlichkeit",
    "Inter*diskriminierung"
  ])("lässt den unbekannten oder nicht passenden Fall %s unverändert", (input) => {
    expect(unmarkedSingularRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
