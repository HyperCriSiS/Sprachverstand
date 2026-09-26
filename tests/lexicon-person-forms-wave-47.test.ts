import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";

describe("siebenundvierzigste konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Turkolog:innen", "Turkologen"],
    ["Toxikolog*innen", "Toxikologen"],
    ["Radiolog_innen", "Radiologen"],
    ["Pneumolog:innen", "Pneumologen"],
    ["Philolog:innen", "Philologen"],
    ["Parasitolog:innen", "Parasitologen"],
    ["Paläontolog:innen", "Paläontologen"],
    ["Glaziolog:innen", "Glaziologen"],
    ["Lichenolog:innen", "Lichenologen"],
    ["Hungarolog:innen", "Hungarologen"]
  ])("normalisiert den abgesicherten Personenstamm %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["turkolog", "genitive", "turkologen"],
    ["toxikolog", "dative", "toxikologen"],
    ["radiolog", "accusative", "radiologen"],
    ["pneumolog", "genitive", "pneumologen"],
    ["philolog", "dative", "philologen"],
    ["parasitolog", "accusative", "parasitologen"],
    ["paläontolog", "genitive", "paläontologen"],
    ["glaziolog", "dative", "glaziologen"],
    ["lichenolog", "accusative", "lichenologen"],
    ["hungarolog", "genitive", "hungarologen"]
  ] as const)("bildet %s im Kasus %s korrekt ab", (base, grammaticalCase, expected) => {
    expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
  });

  it.each([
    ["Turkologe", "Turkologin", "Turkologe"],
    ["Toxikologe", "Toxikologin", "Toxikologe"],
    ["Radiologe", "Radiologin", "Radiologe"],
    ["Pneumologe", "Pneumologin", "Pneumologe"],
    ["Philologe", "Philologin", "Philologe"],
    ["Parasitologe", "Parasitologin", "Parasitologe"],
    ["Paläontologe", "Paläontologin", "Paläontologe"],
    ["Glaziologe", "Glaziologin", "Glaziologe"],
    ["Lichenologe", "Lichenologin", "Lichenologe"],
    ["Hungarologe", "Hungarologin", "Hungarologe"]
  ])("erkennt das abgesicherte Paar %s/%s", (masculine, feminine, expected) => {
    expect(mapMappedSingularPair(masculine, feminine)).toBe(expected);
  });
});
