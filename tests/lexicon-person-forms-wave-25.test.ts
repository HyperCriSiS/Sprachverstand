import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import { mapMappedSingular } from "../src/rules/person-lexicon";

describe("fünfundzwanzigste konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Andorraner:innen", "Andorraner"],
    ["Angolaner:innen", "Angolaner"],
    ["Antiguaner:innen", "Antiguaner"],
    ["Äquatorialguineer:innen", "Äquatorialguineer"],
    ["Äthiopier:innen", "Äthiopier"],
    ["Caboverdier:innen", "Caboverdier"],
    ["Costa-Ricaner:innen", "Costa-Ricaner"],
    ["Ivorer:innen", "Ivorer"],
    ["Dominicaner:innen", "Dominicaner"],
    ["Dominikaner:innen", "Dominikaner"],
    ["Dschibutier:innen", "Dschibutier"],
    ["Ecuadorianer:innen", "Ecuadorianer"],
    ["Salvadorianer:innen", "Salvadorianer"],
    ["Eritreer:innen", "Eritreer"],
    ["Eswatiner:innen", "Eswatiner"],
    ["Fidschianer:innen", "Fidschianer"],
    ["Angolaner*innen", "Angolaner"],
    ["Äthiopier_innen", "Äthiopier"]
  ])("deckt eine amtlich bestimmte Personenform ab: %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["andorraner", "andorraners"],
    ["angolaner", "angolaners"],
    ["antiguaner", "antiguaners"],
    ["äquatorialguineer", "äquatorialguineers"],
    ["äthiopier", "äthiopiers"],
    ["caboverdier", "caboverdiers"],
    ["costa-ricaner", "costa-ricaners"],
    ["ivorer", "ivorers"],
    ["dominicaner", "dominicaners"],
    ["dominikaner", "dominikaners"],
    ["dschibutier", "dschibutiers"],
    ["ecuadorianer", "ecuadorianers"],
    ["salvadorianer", "salvadorianers"],
    ["eritreer", "eritreers"],
    ["eswatiner", "eswatiners"],
    ["fidschianer", "fidschianers"]
  ] as const)("stellt den Genitiv bereit: %s", (base, expected) => {
    expect(mapMappedSingular(base, "genitive")).toBe(expected);
  });
});
