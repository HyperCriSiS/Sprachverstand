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
    ["FRISÖR/-IN", "FRISÖR"]
  ])("wandelt %s in %s um", (input, expected) => {
    expect(unmarkedSingularRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    "Politikerinnen",
    "Hebamme:in",
    "Mutter:in",
    "Prof.in",
    "Dr.in",
    "zehn Zuhörer*inne"
  ])("lässt den unbekannten oder nicht passenden Fall %s unverändert", (input) => {
    expect(unmarkedSingularRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
