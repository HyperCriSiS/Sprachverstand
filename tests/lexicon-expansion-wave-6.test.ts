import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import { mapMappedSingular } from "../src/rules/person-lexicon";

describe("sechste konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Datentypist:innen", "Datentypisten"],
    ["Stenotypist:innen", "Stenotypisten"],
    ["Telefonist:innen", "Telefonisten"],
    ["Privatdozent:innen", "Privatdozenten"],
    ["Pharmakant:innen", "Pharmakanten"],
    ["Expedient:innen", "Expedienten"],
    ["Drogist:innen", "Drogisten"],
    ["Pharmazeut:innen", "Pharmazeuten"],
    ["Fördermaschinist:innen", "Fördermaschinisten"]
  ])("deckt eine geprüfte schwache Personenform ab: %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it("stellt die schwache Singularflexion auch für Komposita bereit", () => {
    expect(mapMappedSingular("Datentypist", "accusative")).toBe("Datentypisten");
    expect(mapMappedSingular("Stenotypist", "dative")).toBe("Stenotypisten");
    expect(mapMappedSingular("Privatdozent", "genitive")).toBe("Privatdozenten");
    expect(mapMappedSingular("Pharmakant", "dative")).toBe("Pharmakanten");
    expect(mapMappedSingular("Expedient", "genitive")).toBe("Expedienten");
    expect(mapMappedSingular("Drogist", "accusative")).toBe("Drogisten");
    expect(mapMappedSingular("Pharmazeut", "genitive")).toBe("Pharmazeuten");
    expect(mapMappedSingular("Fördermaschinist", "dative")).toBe("Fördermaschinisten");
  });

  it.each([
    "Datentyp:innen",
    "Telefon:innen",
    "Dose:innen",
    "Pharma:innen",
    "Expedition:innen",
    "Droge:innen",
    "Pharmazie:innen",
    "Maschine:innen"
  ])("lässt ähnlich aussehende Nicht-Personenformen unverändert: %s", (input) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
