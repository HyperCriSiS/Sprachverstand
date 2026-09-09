import { describe, expect, it } from "vitest";
import {
  knownPluralSeparatorsRule,
  mapKnownSingular
} from "../src/rules/known-plural-separators";

describe("zehnte konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Beschließer:innen", "Beschließer"],
    ["Steinbehauer:innen", "Steinbehauer"],
    ["Listbroker:innen", "Listbroker"],
    ["Schuh- und Lederwarenstepper:innen", "Schuh- und Lederwarenstepper"],
    ["Schausteller:innen", "Schausteller"],
    ["Kaffeeröster:innen", "Kaffeeröster"],
    ["Scherer:innen", "Scherer"],
    ["Biersieder:innen", "Biersieder"],
    ["Kanalsteurer:innen", "Kanalsteurer"],
    ["Hafenschiffer:innen", "Hafenschiffer"],
    ["Goldschläger:innen", "Goldschläger"],
    ["Edelsteinfasser:innen", "Edelsteinfasser"],
    ["Skipper:innen", "Skipper"],
    ["Sattler:innen", "Sattler"],
    ["Feinoptiker:innen", "Feinoptiker"],
    ["Müller:innen", "Müller"],
    ["Feldwebel:innen", "Feldwebel"],
    ["Geomatiker:innen", "Geomatiker"],
    ["Holz- und Bautenschützer:innen", "Holz- und Bautenschützer"],
    ["Klavierstimmer:innen", "Klavierstimmer"],
    ["Wachszieher:innen", "Wachszieher"],
    ["Tätowierer:innen", "Tätowierer"],
    ["Drechsler:innen", "Drechsler"],
    ["Gürtler:innen", "Gürtler"],
    ["Wildheger:innen", "Wildheger"],
    ["Funker:innen", "Funker"],
    ["Kutscher:innen", "Kutscher"],
    ["Steinbildhauer:innen", "Steinbildhauer"],
    ["Kürschner:innen", "Kürschner"]
  ])("deckt eine bestätigte unveränderte Personenform ab: %s", (input, expected) => {
    expect(knownPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["Beschließer", "Beschließers"],
    ["Listbroker", "Listbrokers"],
    ["Stepper", "Steppers"],
    ["Schausteller", "Schaustellers"],
    ["Edelsteinfasser", "Edelsteinfassers"],
    ["Skipper", "Skippers"],
    ["Feldwebel", "Feldwebels"],
    ["Geomatiker", "Geomatikers"],
    ["Klavierstimmer", "Klavierstimmers"],
    ["Tätowierer", "Tätowierers"],
    ["Gürtler", "Gürtlers"],
    ["Kürschner", "Kürschners"]
  ])("stellt die sichere Genitivform bereit: %s", (base, expected) => {
    expect(mapKnownSingular(base, "genitive")).toBe(expected);
  });

  it.each([
    "Gardemanger:innen",
    "Portier:innen",
    "Nachtportier:innen",
    "Poissonnier:innen",
    "Prior:innen",
    "Diakon:innen",
    "Fass:innen",
    "Schutz:innen"
  ])("lässt abweichende oder nicht freigegebene Formen unverändert: %s", (input) => {
    expect(knownPluralSeparatorsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
