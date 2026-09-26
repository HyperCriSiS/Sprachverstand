import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";

describe("einundfünfzigste konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Ausbesserer:innen", "Ausbesserer"],
    ["Badegehilf*innen", "Badegehilfen"],
    ["Beiköch_innen", "Beiköche"],
    ["Bürobot:innen", "Büroboten"],
    ["Geragog:innen", "Geragogen"],
    ["Hispanolog:innen", "Hispanologen"],
    ["Infektolog:innen", "Infektologen"],
    ["Malaiolog:innen", "Malaiologen"],
    ["Motolog:innen", "Motologen"],
    ["Ökotoxikolog:innen", "Ökotoxikologen"]
  ])("normalisiert den abgesicherten Personenstamm %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["ausbesserer", "genitive", "ausbesserers"],
    ["badegehilf", "dative", "badegehilfen"],
    ["beiköch", "genitive", "beikochs"],
    ["bürobot", "accusative", "büroboten"],
    ["geragog", "genitive", "geragogen"],
    ["hispanolog", "dative", "hispanologen"],
    ["infektolog", "accusative", "infektologen"],
    ["malaiolog", "genitive", "malaiologen"],
    ["motolog", "dative", "motologen"],
    ["ökotoxikolog", "accusative", "ökotoxikologen"]
  ] as const)("bildet %s im Kasus %s korrekt ab", (base, grammaticalCase, expected) => {
    expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
  });

  it.each([
    ["Ausbesserer", "Ausbessererin", "Ausbesserer"],
    ["Badegehilfe", "Badegehilfin", "Badegehilfe"],
    ["Beikoch", "Beiköchin", "Beikoch"],
    ["Bürobote", "Bürobotin", "Bürobote"],
    ["Geragoge", "Geragogin", "Geragoge"],
    ["Hispanologe", "Hispanologin", "Hispanologe"],
    ["Infektologe", "Infektologin", "Infektologe"],
    ["Malaiologe", "Malaiologin", "Malaiologe"],
    ["Motologe", "Motologin", "Motologe"],
    ["Ökotoxikologe", "Ökotoxikologin", "Ökotoxikologe"]
  ])("erkennt das abgesicherte Paar %s/%s", (masculine, feminine, expected) => {
    expect(mapMappedSingularPair(masculine, feminine)).toBe(expected);
  });
});
