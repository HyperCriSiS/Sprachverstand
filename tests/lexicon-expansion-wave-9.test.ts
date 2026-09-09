import { describe, expect, it } from "vitest";
import {
  knownPluralSeparatorsRule,
  mapKnownSingular
} from "../src/rules/known-plural-separators";

describe("neunte konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Lagerhalter:innen", "Lagerhalter"],
    ["Haushälter:innen", "Haushälter"],
    ["Treuhänder:innen", "Treuhänder"],
    ["Fahrbahnmarkierer:innen", "Fahrbahnmarkierer"],
    ["Klempner:innen", "Klempner"],
    ["Holzfäller:innen", "Holzfäller"],
    ["Färber:innen", "Färber"],
    ["Küper:innen", "Küper"],
    ["Küster:innen", "Küster"],
    ["Schlafwagenschaffner:innen", "Schlafwagenschaffner"],
    ["Weber:innen", "Weber"],
    ["Buchbinder:innen", "Buchbinder"],
    ["Glaser:innen", "Glaser"],
    ["Hörgeräteakustiker:innen", "Hörgeräteakustiker"],
    ["Schornsteinfeger:innen", "Schornsteinfeger"],
    ["Sprachmittler:innen", "Sprachmittler"]
  ])("deckt eine weitere morphologisch stabile Personenform ab: %s", (input, expected) => {
    expect(knownPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["Lagerhalter", "Lagerhalters"],
    ["Haushälter", "Haushälters"],
    ["Treuhänder", "Treuhänders"],
    ["Fahrbahnmarkierer", "Fahrbahnmarkierers"],
    ["Schlafwagenschaffner", "Schlafwagenschaffners"],
    ["Hörgeräteakustiker", "Hörgeräteakustikers"],
    ["Schornsteinfeger", "Schornsteinfegers"],
    ["Sprachmittler", "Sprachmittlers"]
  ])("stellt auch den sicheren Genitiv bereit: %s", (base, expected) => {
    expect(mapKnownSingular(base, "genitive")).toBe(expected);
  });

  it.each([
    "Schalter:innen",
    "Hälter:innen",
    "Akustik:innen",
    "Glas:innen",
    "Web:innen",
    "Markierung:innen"
  ])("öffnet ähnlich aussehende Nicht-Personenformen nicht: %s", (input) => {
    expect(knownPluralSeparatorsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
