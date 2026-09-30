import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedInflectedSingularPair,
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";

describe("fünfundfünfzigste konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Adremadrucker:innen", "Adremadrucker"],
    ["Adressendrucker*innen", "Adressendrucker"],
    ["Akquisiteur_innen", "Akquisiteure"],
    ["Akustikschreiner:innen", "Akustikschreiner"],
    ["Aluminiumdrucker:innen", "Aluminiumdrucker"],
    ["Anilindrucker:innen", "Anilindrucker"],
    ["Antikschreiner:innen", "Antikschreiner"],
    ["Anzeigenakquisiteur:innen", "Anzeigenakquisiteure"],
    ["Aquarelldrucker:innen", "Aquarelldrucker"],
    ["Ackerbäuer:innen", "Ackerbauern"],
    ["Ackergehilf:innen", "Ackergehilfen"],
    ["Alleinköch:innen", "Alleinköche"],
    ["Almbäuer:innen", "Almbauern"],
    ["Anwaltsgehilf:innen", "Anwaltsgehilfen"]
  ])("normalisiert den abgesicherten Personenstamm %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["adremadrucker", "genitive", "adremadruckers"],
    ["adressendrucker", "genitive", "adressendruckers"],
    ["akquisiteur", "genitive", "akquisiteurs"],
    ["akustikschreiner", "genitive", "akustikschreiners"],
    ["aluminiumdrucker", "genitive", "aluminiumdruckers"],
    ["anilindrucker", "genitive", "anilindruckers"],
    ["antikschreiner", "genitive", "antikschreiners"],
    ["anzeigenakquisiteur", "genitive", "anzeigenakquisiteurs"],
    ["aquarelldrucker", "genitive", "aquarelldruckers"],
    ["ackerbäuer", "dative", "ackerbauern"],
    ["ackergehilf", "accusative", "ackergehilfen"],
    ["alleinköch", "genitive", "alleinkochs"],
    ["almbäuer", "genitive", "almbauern"],
    ["anwaltsgehilf", "dative", "anwaltsgehilfen"]
  ] as const)("bildet %s im Kasus %s korrekt ab", (base, grammaticalCase, expected) => {
    expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
  });

  it.each([
    ["Adremadrucker", "Adremadruckerin", "Adremadrucker"],
    ["Adressendrucker", "Adressendruckerin", "Adressendrucker"],
    ["Akquisiteur", "Akquisiteurin", "Akquisiteur"],
    ["Akustikschreiner", "Akustikschreinerin", "Akustikschreiner"],
    ["Aluminiumdrucker", "Aluminiumdruckerin", "Aluminiumdrucker"],
    ["Anilindrucker", "Anilindruckerin", "Anilindrucker"],
    ["Antikschreiner", "Antikschreinerin", "Antikschreiner"],
    ["Anzeigenakquisiteur", "Anzeigenakquisiteurin", "Anzeigenakquisiteur"],
    ["Aquarelldrucker", "Aquarelldruckerin", "Aquarelldrucker"],
    ["Ackerbauer", "Ackerbäuerin", "Ackerbauer"],
    ["Ackergehilfe", "Ackergehilfin", "Ackergehilfe"],
    ["Alleinkoch", "Alleinköchin", "Alleinkoch"],
    ["Almbauer", "Almbäuerin", "Almbauer"],
    ["Anwaltsgehilfe", "Anwaltsgehilfin", "Anwaltsgehilfe"]
  ])("erkennt das abgesicherte Paar %s/%s", (masculine, feminine, expected) => {
    expect(mapMappedSingularPair(masculine, feminine)).toBe(expected);
  });

  it.each([
    ["Ackerbäuerin", "Ackerbauern", "dative", "Ackerbauern"],
    ["Ackergehilfin", "Ackergehilfen", "dative", "Ackergehilfen"],
    ["Alleinköchin", "Alleinkochs", "genitive", "Alleinkochs"],
    ["Almbäuerin", "Almbauern", "genitive", "Almbauern"],
    ["Anwaltsgehilfin", "Anwaltsgehilfen", "accusative", "Anwaltsgehilfen"]
  ] as const)(
    "erkennt das flektierte Paar %s/%s im Kasus %s",
    (feminine, masculine, grammaticalCase, expected) => {
      expect(
        mapMappedInflectedSingularPair(feminine, masculine, grammaticalCase)
      ).toBe(expected);
    }
  );
});