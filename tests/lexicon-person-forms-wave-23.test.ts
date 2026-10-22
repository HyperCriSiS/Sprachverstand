import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import { mapMappedSingular } from "../src/rules/person-lexicon";

describe("dreiundzwanzigste konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Aserbaidschaner:innen", "Aserbaidschaner"],
    ["Mazedonier:innen", "Mazedonier"],
    ["Moldauer:innen", "Moldauer"],
    ["Bahamaer:innen", "Bahamaer"],
    ["Bahrainer:innen", "Bahrainer"],
    ["Bangladescher:innen", "Bangladescher"],
    ["Barbadier:innen", "Barbadier"],
    ["Aserbaidschaner*innen", "Aserbaidschaner"],
    ["Bangladescher_innen", "Bangladescher"]
  ])("deckt eine belegte Personenform ab: %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["aserbaidschaner", "genitive", "aserbaidschaners"],
    ["mazedonier", "genitive", "mazedoniers"],
    ["moldauer", "genitive", "moldauers"],
    ["bahamaer", "genitive", "bahamaers"],
    ["bahrainer", "genitive", "bahrainers"],
    ["bangladescher", "genitive", "bangladeschers"],
    ["barbadier", "genitive", "barbadiers"]
  ] as const)(
    "stellt die passende Singularflexion bereit: %s/%s",
    (base, grammaticalCase, expected) => {
      expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
    }
  );
});
