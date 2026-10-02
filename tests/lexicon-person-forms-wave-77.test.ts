import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";
import {
  getReviewedPersonFormsWave77,
  reviewedPersonFormCountWave77
} from "../src/rules/reviewed-person-forms-wave-77";

describe("siebenundsiebzigste Lexikon-Ausbauwelle", () => {
  it("enthält alle 17 vollständig geprüften ESCO-Exaktmappings", () => {
    expect(reviewedPersonFormCountWave77).toBe(17);

    for (const [base, plural, singular, feminine, oblique, genitive] of [
    ["automatenstricker", "automatenstricker", "automatenstricker", "automatenstrickerin", "automatenstricker", "automatenstrickers"],
    ["chemieproduktemischer", "chemieproduktemischer", "chemieproduktemischer", "chemieproduktemischerin", "chemieproduktemischer", "chemieproduktemischers"],
    ["farbmischer", "farbmischer", "farbmischer", "farbmischerin", "farbmischer", "farbmischers"],
    ["feuerwehrpumpenwart", "feuerwehrpumpenwarte", "feuerwehrpumpenwart", "feuerwehrpumpenwartin", "feuerwehrpumpenwart", "feuerwehrpumpenwarts"],
    ["haussitter", "haussitter", "haussitter", "haussitterin", "haussitter", "haussitters"],
    ["holzwerkstoffplattenklassierer", "holzwerkstoffplattenklassierer", "holzwerkstoffplattenklassierer", "holzwerkstoffplattenklassiererin", "holzwerkstoffplattenklassierer", "holzwerkstoffplattenklassierers"],
    ["instruktor", "instruktoren", "instruktor", "instruktorin", "instruktor", "instruktors"],
    ["kalanderbügler", "kalanderbügler", "kalanderbügler", "kalanderbüglerin", "kalanderbügler", "kalanderbüglers"],
    ["kostenanalyst", "kostenanalysten", "kostenanalyst", "kostenanalystin", "kostenanalysten", "kostenanalysten"],
    ["maschinenstricker", "maschinenstricker", "maschinenstricker", "maschinenstrickerin", "maschinenstricker", "maschinenstrickers"],
    ["metallnieter", "metallnieter", "metallnieter", "metallnieterin", "metallnieter", "metallnieters"],
    ["pestizidmischer", "pestizidmischer", "pestizidmischer", "pestizidmischerin", "pestizidmischer", "pestizidmischers"],
    ["pumpenwart", "pumpenwarte", "pumpenwart", "pumpenwartin", "pumpenwart", "pumpenwarts"],
    ["rigger", "rigger", "rigger", "riggerin", "rigger", "riggers"],
    ["tufter", "tufter", "tufter", "tufterin", "tufter", "tufters"],
    ["veranstaltungs-rigger", "veranstaltungs-rigger", "veranstaltungs-rigger", "veranstaltungs-riggerin", "veranstaltungs-rigger", "veranstaltungs-riggers"],
    ["veranstaltungsrigger", "veranstaltungsrigger", "veranstaltungsrigger", "veranstaltungsriggerin", "veranstaltungsrigger", "veranstaltungsriggers"]
    ] as const) {
      expect(getReviewedPersonFormsWave77(base), base).toEqual({
        plural,
        singular,
        feminineSingular: feminine,
        obliqueSingular: oblique,
        genitiveSingular: genitive
      });
    }
  });

  it.each([
    ["Automatenstricker:innen", "Automatenstricker"],
    ["Chemieproduktemischer:innen", "Chemieproduktemischer"],
    ["Farbmischer:innen", "Farbmischer"],
    ["Feuerwehrpumpenwart:innen", "Feuerwehrpumpenwarte"],
    ["Haussitter:innen", "Haussitter"],
    ["Holzwerkstoffplattenklassierer:innen", "Holzwerkstoffplattenklassierer"],
    ["Instruktor:innen", "Instruktoren"],
    ["Kalanderbügler:innen", "Kalanderbügler"],
    ["Kostenanalyst:innen", "Kostenanalysten"],
    ["Maschinenstricker:innen", "Maschinenstricker"],
    ["Metallnieter:innen", "Metallnieter"],
    ["Pestizidmischer:innen", "Pestizidmischer"],
    ["Pumpenwart:innen", "Pumpenwarte"],
    ["Rigger:innen", "Rigger"],
    ["Tufter:innen", "Tufter"],
    ["Veranstaltungs-rigger:innen", "Veranstaltungs-rigger"],
    ["Veranstaltungsrigger:innen", "Veranstaltungsrigger"]
  ])("ersetzt den geprüften ESCO-Plural %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["Automatenstricker", "Automatenstrickerin", "Automatenstricker"],
    ["Feuerwehrpumpenwart", "Feuerwehrpumpenwartin", "Feuerwehrpumpenwart"],
    ["Instruktor", "Instruktorin", "Instruktor"],
    ["Kostenanalyst", "Kostenanalystin", "Kostenanalyst"],
    ["Pumpenwart", "Pumpenwartin", "Pumpenwart"],
    ["Rigger", "Riggerin", "Rigger"],
    ["Tufter", "Tufterin", "Tufter"]
  ])("erkennt das geprüfte ESCO-Paar %s/%s", (masculine, feminine, expected) => {
    expect(mapMappedSingularPair(masculine, feminine)).toBe(expected);
  });

  it.each([
    ["feuerwehrpumpenwart", "nominative", "feuerwehrpumpenwart"],
    ["feuerwehrpumpenwart", "genitive", "feuerwehrpumpenwarts"],
    ["instruktor", "nominative", "instruktor"],
    ["instruktor", "genitive", "instruktors"],
    ["kostenanalyst", "nominative", "kostenanalyst"],
    ["kostenanalyst", "accusative", "kostenanalysten"],
    ["kostenanalyst", "genitive", "kostenanalysten"],
    ["pumpenwart", "nominative", "pumpenwart"],
    ["pumpenwart", "genitive", "pumpenwarts"],
    ["rigger", "nominative", "rigger"],
    ["rigger", "genitive", "riggers"]
  ] as const)(
    "bildet die ESCO-Basis %s im Kasus %s korrekt ab",
    (base, grammaticalCase, expected) => {
      expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
    }
  );
});
