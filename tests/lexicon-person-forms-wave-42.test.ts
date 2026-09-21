import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";

describe("zweiundvierzigste konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Scharlatan:innen", "Scharlatane"],
    ["Schelm*innen", "Schelme"],
    ["Sexist_innen", "Sexisten"],
    ["Sparringspartner:innen", "Sparringspartner"],
    ["Speaker:innen", "Speaker"],
    ["Südostasiat:innen", "Südostasiaten"]
  ])("normalisiert die neue Personenform %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["scharlatan", "genitive", "scharlatans"],
    ["schelm", "genitive", "schelms"],
    ["sexist", "accusative", "sexisten"],
    ["sparringspartner", "genitive", "sparringspartners"],
    ["speaker", "genitive", "speakers"],
    ["südostasiat", "dative", "südostasiaten"]
  ] as const)("bildet %s im Kasus %s korrekt ab", (base, grammaticalCase, expected) => {
    expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
  });

  it.each([
    ["Scharlatan", "Scharlatanin", "Scharlatan"],
    ["Schelm", "Schelmin", "Schelm"],
    ["Sexist", "Sexistin", "Sexist"],
    ["Sparringspartner", "Sparringspartnerin", "Sparringspartner"],
    ["Speaker", "Speakerin", "Speaker"],
    ["Südostasiat", "Südostasiatin", "Südostasiat"]
  ])("erkennt das Paar %s/%s", (masculine, feminine, expected) => {
    expect(mapMappedSingularPair(masculine, feminine)).toBe(expected);
  });

  it.each([
    ["Schützenkönig:innen", "Schützenkönige"],
    ["Stellvertreter:innen", "Stellvertreter"]
  ])("bestätigt die bereits vorhandene Abdeckung für %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    "Schneemann:innen",
    "Steward:innen"
  ])("lässt unregelmäßige Paarbildungen unverändert: %s", (input) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
