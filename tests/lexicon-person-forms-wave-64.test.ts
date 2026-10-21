import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";
import {
  getReviewedPersonFormsWave64,
  reviewedPersonFormCountWave64
} from "../src/rules/reviewed-person-forms-wave-64";

describe("vierundsechzigste Lexikon-Ausbauwelle", () => {
  it("enthält genau den intern geprüften Exaktbestand", () => {
    expect(reviewedPersonFormCountWave64).toBe(20);
    for (const base of [
      "computervisualist",
      "eri-wart",
      "eutonist",
      "fennist",
      "mindermaschinenstricker",
      "modellist",
      "tapisserist",
      "verschmelzer",
      "wäscher",
      "bildmischer",
      "bohrer",
      "blechpresser",
      "bandstanzer",
      "bandwalzer",
      "drahtwickler",
      "branntweinbrenner",
      "briefsortierer",
      "offsetplattenkopierer",
      "devisenrechner",
      "geldzähler",
      "aluminiumspritzer",
      "vorroller",
      "tiefzieher",
      "fantasieabrechner",
      "fantasieauffüller",
      "fantasienachseher"
    ]) {
      expect(getReviewedPersonFormsWave64(base), base).toBeUndefined();
    }
  });

  it.each([
    ["Ankerschließer:innen", "Ankerschließer"],
    ["Bauabrechner:innen", "Bauabrechner"],
    ["Betriebsabrechner:innen", "Betriebsabrechner"],
    ["Gehaltsabrechner:innen", "Gehaltsabrechner"],
    ["Kostenabrechner:innen", "Kostenabrechner"],
    ["Landkartenaufzieher:innen", "Landkartenaufzieher"],
    ["Lohnabrechner:innen", "Lohnabrechner"],
    ["Minibar-Checker:innen", "Minibar-Checker"],
    ["Museumsregistrar:innen", "Museumsregistrare"],
    ["Stanzmaschineneinsteller:innen", "Stanzmaschineneinsteller"],
    ["Tierkörperverwerter:innen", "Tierkörperverwerter"],
    ["Tuftingwarennachseher:innen", "Tuftingwarennachseher"],
    ["Verpflegungsautomatenauffüller:innen", "Verpflegungsautomatenauffüller"],
    ["Verpflegungsautomatenbefüller:innen", "Verpflegungsautomatenbefüller"],
    ["Viehtreiber:innen", "Viehtreiber"],
    ["Warenbereitsteller:innen", "Warenbereitsteller"],
    ["Warenhandelssubstitut:innen", "Warenhandelssubstitute"],
    ["Webgutnachseher:innen", "Webgutnachseher"],
    ["Zigarettenautomatenauffüller:innen", "Zigarettenautomatenauffüller"],
    ["Zigarettenautomatenbefüller:innen", "Zigarettenautomatenbefüller"]
  ])("ersetzt den geprüften Plural %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["Ankerschließer", "Ankerschließerin", "Ankerschließer"],
    ["Bauabrechner", "Bauabrechnerin", "Bauabrechner"],
    ["Betriebsabrechner", "Betriebsabrechnerin", "Betriebsabrechner"],
    ["Gehaltsabrechner", "Gehaltsabrechnerin", "Gehaltsabrechner"],
    ["Kostenabrechner", "Kostenabrechnerin", "Kostenabrechner"],
    ["Landkartenaufzieher", "Landkartenaufzieherin", "Landkartenaufzieher"],
    ["Lohnabrechner", "Lohnabrechnerin", "Lohnabrechner"],
    ["Minibar-Checker", "Minibar-Checkerin", "Minibar-Checker"],
    ["Museumsregistrar", "Museumsregistrarin", "Museumsregistrar"],
    ["Stanzmaschineneinsteller", "Stanzmaschineneinstellerin", "Stanzmaschineneinsteller"],
    ["Tierkörperverwerter", "Tierkörperverwerterin", "Tierkörperverwerter"],
    ["Tuftingwarennachseher", "Tuftingwarennachseherin", "Tuftingwarennachseher"],
    ["Verpflegungsautomatenauffüller", "Verpflegungsautomatenauffüllerin", "Verpflegungsautomatenauffüller"],
    ["Verpflegungsautomatenbefüller", "Verpflegungsautomatenbefüllerin", "Verpflegungsautomatenbefüller"],
    ["Viehtreiber", "Viehtreiberin", "Viehtreiber"],
    ["Warenbereitsteller", "Warenbereitstellerin", "Warenbereitsteller"],
    ["Warenhandelssubstitut", "Warenhandelssubstitutin", "Warenhandelssubstitut"],
    ["Webgutnachseher", "Webgutnachseherin", "Webgutnachseher"],
    ["Zigarettenautomatenauffüller", "Zigarettenautomatenauffüllerin", "Zigarettenautomatenauffüller"],
    ["Zigarettenautomatenbefüller", "Zigarettenautomatenbefüllerin", "Zigarettenautomatenbefüller"]
  ])("erkennt das intern geprüfte Paar %s/%s", (masculine, feminine, expected) => {
    expect(mapMappedSingularPair(masculine, feminine)).toBe(expected);
  });

  it.each([
    ["ankerschließer", "genitive", "ankerschließers"],
    ["museumsregistrar", "genitive", "museumsregistrars"],
    ["warenhandelssubstitut", "genitive", "warenhandelssubstituts"]
  ] as const)(
    "bildet die repräsentative Basis %s im Kasus %s korrekt ab",
    (base, grammaticalCase, expected) => {
      expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
    }
  );

  it("erhält die Segmentgroßschreibung bei der Bindestrichform", () => {
    expect(mappedPluralSeparatorsRule.apply("Minibar-Checker:innen")).toEqual({
      text: "Minibar-Checker",
      replacements: 1
    });
  });
});
