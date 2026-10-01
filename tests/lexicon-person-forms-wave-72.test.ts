import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";
import {
  getReviewedPersonFormsWave72,
  reviewedPersonFormCountWave72
} from "../src/rules/reviewed-person-forms-wave-72";

describe("zweiundsiebzigste Lexikon-Ausbauwelle", () => {
  it("enthält genau den intern geprüften Exaktbestand", () => {
    expect(reviewedPersonFormCountWave72).toBe(24);

    for (const base of [
      "presser",
      "stanzer",
      "walzer",
      "wickler",
      "zieher",
      "spritzer",
      "bohrer",
      "sortierer",
      "mischer",
      "kopierer",
      "monitor",
      "printer",
      "computervisualist",
      "eri-wart",
      "eutonist",
      "fennist",
      "mindermaschinenstricker",
      "modellist",
      "tapisserist",
      "verschmelzer",
      "wäscher"
    ]) {
      expect(getReviewedPersonFormsWave72(base), base).toBeUndefined();
    }
  });

  it.each([
    ["Aluminiumspritzer:innen", "Aluminiumspritzer"],
    ["Bandstanzer:innen", "Bandstanzer"],
    ["Bandwalzer:innen", "Bandwalzer"],
    ["Blechlocher:innen", "Blechlocher"],
    ["Blechpresser:innen", "Blechpresser"],
    ["Blechstanzer:innen", "Blechstanzer"],
    ["Blechwalzer:innen", "Blechwalzer"],
    ["Blechzieher:innen", "Blechzieher"],
    ["Bodenlederstanzer:innen", "Bodenlederstanzer"],
    ["Bolzenpresser:innen", "Bolzenpresser"],
    ["Drahtwalzer:innen", "Drahtwalzer"],
    ["Drahtwickler:innen", "Drahtwickler"],
    ["Drahtzieher:innen", "Drahtzieher"],
    ["Einlagenstanzer:innen", "Einlagenstanzer"],
    ["Eisenblechstanzer:innen", "Eisenblechstanzer"],
    ["Eisendrahtzieher:innen", "Eisendrahtzieher"],
    ["Federpresser:innen", "Federpresser"],
    ["Federwalzer:innen", "Federwalzer"],
    ["Federwickler:innen", "Federwickler"],
    ["Feinblechwalzer:innen", "Feinblechwalzer"],
    ["Feindrahtzieher:innen", "Feindrahtzieher"],
    ["Feinstanzer:innen", "Feinstanzer"],
    ["Fertigwalzer:innen", "Fertigwalzer"],
    ["Fleckstanzer:innen", "Fleckstanzer"]
  ])("ersetzt den geprüften Plural %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["Aluminiumspritzer", "Aluminiumspritzerin", "Aluminiumspritzer"],
    ["Bandstanzer", "Bandstanzerin", "Bandstanzer"],
    ["Bandwalzer", "Bandwalzerin", "Bandwalzer"],
    ["Blechlocher", "Blechlocherin", "Blechlocher"],
    ["Blechpresser", "Blechpresserin", "Blechpresser"],
    ["Blechstanzer", "Blechstanzerin", "Blechstanzer"],
    ["Blechwalzer", "Blechwalzerin", "Blechwalzer"],
    ["Blechzieher", "Blechzieherin", "Blechzieher"],
    ["Bodenlederstanzer", "Bodenlederstanzerin", "Bodenlederstanzer"],
    ["Bolzenpresser", "Bolzenpresserin", "Bolzenpresser"],
    ["Drahtwalzer", "Drahtwalzerin", "Drahtwalzer"],
    ["Drahtwickler", "Drahtwicklerin", "Drahtwickler"],
    ["Drahtzieher", "Drahtzieherin", "Drahtzieher"],
    ["Einlagenstanzer", "Einlagenstanzerin", "Einlagenstanzer"],
    ["Eisenblechstanzer", "Eisenblechstanzerin", "Eisenblechstanzer"],
    ["Eisendrahtzieher", "Eisendrahtzieherin", "Eisendrahtzieher"],
    ["Federpresser", "Federpresserin", "Federpresser"],
    ["Federwalzer", "Federwalzerin", "Federwalzer"],
    ["Federwickler", "Federwicklerin", "Federwickler"],
    ["Feinblechwalzer", "Feinblechwalzerin", "Feinblechwalzer"],
    ["Feindrahtzieher", "Feindrahtzieherin", "Feindrahtzieher"],
    ["Feinstanzer", "Feinstanzerin", "Feinstanzer"],
    ["Fertigwalzer", "Fertigwalzerin", "Fertigwalzer"],
    ["Fleckstanzer", "Fleckstanzerin", "Fleckstanzer"]
  ])("erkennt das intern geprüfte Paar %s/%s", (masculine, feminine, expected) => {
    expect(mapMappedSingularPair(masculine, feminine)).toBe(expected);
  });

  it.each([
    ["aluminiumspritzer", "nominative", "aluminiumspritzer"],
    ["aluminiumspritzer", "genitive", "aluminiumspritzers"],
    ["bandstanzer", "nominative", "bandstanzer"],
    ["bandstanzer", "genitive", "bandstanzers"],
    ["bandwalzer", "nominative", "bandwalzer"],
    ["bandwalzer", "genitive", "bandwalzers"],
    ["blechlocher", "nominative", "blechlocher"],
    ["blechlocher", "genitive", "blechlochers"],
    ["blechpresser", "nominative", "blechpresser"],
    ["blechpresser", "genitive", "blechpressers"],
    ["blechstanzer", "nominative", "blechstanzer"],
    ["blechstanzer", "genitive", "blechstanzers"],
    ["blechwalzer", "nominative", "blechwalzer"],
    ["blechwalzer", "genitive", "blechwalzers"],
    ["blechzieher", "nominative", "blechzieher"],
    ["blechzieher", "genitive", "blechziehers"],
    ["bodenlederstanzer", "nominative", "bodenlederstanzer"],
    ["bodenlederstanzer", "genitive", "bodenlederstanzers"],
    ["bolzenpresser", "nominative", "bolzenpresser"],
    ["bolzenpresser", "genitive", "bolzenpressers"],
    ["drahtwalzer", "nominative", "drahtwalzer"],
    ["drahtwalzer", "genitive", "drahtwalzers"],
    ["drahtwickler", "nominative", "drahtwickler"],
    ["drahtwickler", "genitive", "drahtwicklers"],
    ["drahtzieher", "nominative", "drahtzieher"],
    ["drahtzieher", "genitive", "drahtziehers"],
    ["einlagenstanzer", "nominative", "einlagenstanzer"],
    ["einlagenstanzer", "genitive", "einlagenstanzers"],
    ["eisenblechstanzer", "nominative", "eisenblechstanzer"],
    ["eisenblechstanzer", "genitive", "eisenblechstanzers"],
    ["eisendrahtzieher", "nominative", "eisendrahtzieher"],
    ["eisendrahtzieher", "genitive", "eisendrahtziehers"],
    ["federpresser", "nominative", "federpresser"],
    ["federpresser", "genitive", "federpressers"],
    ["federwalzer", "nominative", "federwalzer"],
    ["federwalzer", "genitive", "federwalzers"],
    ["federwickler", "nominative", "federwickler"],
    ["federwickler", "genitive", "federwicklers"],
    ["feinblechwalzer", "nominative", "feinblechwalzer"],
    ["feinblechwalzer", "genitive", "feinblechwalzers"],
    ["feindrahtzieher", "nominative", "feindrahtzieher"],
    ["feindrahtzieher", "genitive", "feindrahtziehers"],
    ["feinstanzer", "nominative", "feinstanzer"],
    ["feinstanzer", "genitive", "feinstanzers"],
    ["fertigwalzer", "nominative", "fertigwalzer"],
    ["fertigwalzer", "genitive", "fertigwalzers"],
    ["fleckstanzer", "nominative", "fleckstanzer"],
    ["fleckstanzer", "genitive", "fleckstanzers"]
  ] as const)(
    "bildet die Basis %s im Kasus %s korrekt ab",
    (base, grammaticalCase, expected) => {
      expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
    }
  );
});
