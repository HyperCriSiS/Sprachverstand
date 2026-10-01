import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";
import {
  getReviewedPersonFormsWave71,
  reviewedPersonFormCountWave71
} from "../src/rules/reviewed-person-forms-wave-71";

describe("einundsiebzigste Lexikon-Ausbauwelle", () => {
  it("enthält genau den intern geprüften Exaktbestand", () => {
    expect(reviewedPersonFormCountWave71).toBe(20);

    for (const base of [
      "bohrer",
      "presser",
      "stanzer",
      "walzer",
      "wickler",
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
      expect(getReviewedPersonFormsWave71(base), base).toBeUndefined();
    }
  });

  it.each([
    ["Branntsteinbrenner:innen", "Branntsteinbrenner"],
    ["Destillatbrenner:innen", "Destillatbrenner"],
    ["Einzieher:innen", "Einzieher"],
    ["Hammerdrücker:innen", "Hammerdrücker"],
    ["Handflämmer:innen", "Handflämmer"],
    ["Kakaomahler:innen", "Kakaomahler"],
    ["Kernschwärzer:innen", "Kernschwärzer"],
    ["Kondensmilchsieder:innen", "Kondensmilchsieder"],
    ["Maschinendrücker:innen", "Maschinendrücker"],
    ["Metalldrücker:innen", "Metalldrücker"],
    ["Metallschläger:innen", "Metallschläger"],
    ["Metallätzer:innen", "Metallätzer"],
    ["Senger:innen", "Senger"],
    ["Universaldrücker:innen", "Universaldrücker"],
    ["Webgeschirreinzieher:innen", "Webgeschirreinzieher"],
    ["Weißbeizer:innen", "Weißbeizer"],
    ["Zapfer:innen", "Zapfer"],
    ["Zinkdrücker:innen", "Zinkdrücker"],
    ["Zinndrücker:innen", "Zinndrücker"],
    ["Ätzer:innen", "Ätzer"]
  ])("ersetzt den geprüften Plural %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["Branntsteinbrenner", "Branntsteinbrennerin", "Branntsteinbrenner"],
    ["Destillatbrenner", "Destillatbrennerin", "Destillatbrenner"],
    ["Einzieher", "Einzieherin", "Einzieher"],
    ["Hammerdrücker", "Hammerdrückerin", "Hammerdrücker"],
    ["Handflämmer", "Handflämmerin", "Handflämmer"],
    ["Kakaomahler", "Kakaomahlerin", "Kakaomahler"],
    ["Kernschwärzer", "Kernschwärzerin", "Kernschwärzer"],
    ["Kondensmilchsieder", "Kondensmilchsiederin", "Kondensmilchsieder"],
    ["Maschinendrücker", "Maschinendrückerin", "Maschinendrücker"],
    ["Metalldrücker", "Metalldrückerin", "Metalldrücker"],
    ["Metallschläger", "Metallschlägerin", "Metallschläger"],
    ["Metallätzer", "Metallätzerin", "Metallätzer"],
    ["Senger", "Sengerin", "Senger"],
    ["Universaldrücker", "Universaldrückerin", "Universaldrücker"],
    ["Webgeschirreinzieher", "Webgeschirreinzieherin", "Webgeschirreinzieher"],
    ["Weißbeizer", "Weißbeizerin", "Weißbeizer"],
    ["Zapfer", "Zapferin", "Zapfer"],
    ["Zinkdrücker", "Zinkdrückerin", "Zinkdrücker"],
    ["Zinndrücker", "Zinndrückerin", "Zinndrücker"],
    ["Ätzer", "Ätzerin", "Ätzer"]
  ])("erkennt das intern geprüfte Paar %s/%s", (masculine, feminine, expected) => {
    expect(mapMappedSingularPair(masculine, feminine)).toBe(expected);
  });

  it.each([
    ["branntsteinbrenner", "nominative", "branntsteinbrenner"],
    ["branntsteinbrenner", "genitive", "branntsteinbrenners"],
    ["destillatbrenner", "nominative", "destillatbrenner"],
    ["destillatbrenner", "genitive", "destillatbrenners"],
    ["einzieher", "nominative", "einzieher"],
    ["einzieher", "genitive", "einziehers"],
    ["hammerdrücker", "nominative", "hammerdrücker"],
    ["hammerdrücker", "genitive", "hammerdrückers"],
    ["handflämmer", "nominative", "handflämmer"],
    ["handflämmer", "genitive", "handflämmers"],
    ["kakaomahler", "nominative", "kakaomahler"],
    ["kakaomahler", "genitive", "kakaomahlers"],
    ["kernschwärzer", "nominative", "kernschwärzer"],
    ["kernschwärzer", "genitive", "kernschwärzers"],
    ["kondensmilchsieder", "nominative", "kondensmilchsieder"],
    ["kondensmilchsieder", "genitive", "kondensmilchsieders"],
    ["maschinendrücker", "nominative", "maschinendrücker"],
    ["maschinendrücker", "genitive", "maschinendrückers"],
    ["metalldrücker", "nominative", "metalldrücker"],
    ["metalldrücker", "genitive", "metalldrückers"],
    ["metallschläger", "nominative", "metallschläger"],
    ["metallschläger", "genitive", "metallschlägers"],
    ["metallätzer", "nominative", "metallätzer"],
    ["metallätzer", "genitive", "metallätzers"],
    ["senger", "nominative", "senger"],
    ["senger", "genitive", "sengers"],
    ["universaldrücker", "nominative", "universaldrücker"],
    ["universaldrücker", "genitive", "universaldrückers"],
    ["webgeschirreinzieher", "nominative", "webgeschirreinzieher"],
    ["webgeschirreinzieher", "genitive", "webgeschirreinziehers"],
    ["weißbeizer", "nominative", "weißbeizer"],
    ["weißbeizer", "genitive", "weißbeizers"],
    ["zapfer", "nominative", "zapfer"],
    ["zapfer", "genitive", "zapfers"],
    ["zinkdrücker", "nominative", "zinkdrücker"],
    ["zinkdrücker", "genitive", "zinkdrückers"],
    ["zinndrücker", "nominative", "zinndrücker"],
    ["zinndrücker", "genitive", "zinndrückers"],
    ["ätzer", "nominative", "ätzer"],
    ["ätzer", "genitive", "ätzers"]
  ] as const)(
    "bildet die Basis %s im Kasus %s korrekt ab",
    (base, grammaticalCase, expected) => {
      expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
    }
  );
});
