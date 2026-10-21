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

const cases = [
  ["automatenstricker", "automatenstricker", "automatenstrickerin", "automatenstricker", "automatenstrickers"],
  ["chemieproduktemischer", "chemieproduktemischer", "chemieproduktemischerin", "chemieproduktemischer", "chemieproduktemischers"],
  ["farbmischer", "farbmischer", "farbmischerin", "farbmischer", "farbmischers"],
  ["feuerwehrpumpenwart", "feuerwehrpumpenwarte", "feuerwehrpumpenwartin", "feuerwehrpumpenwart", "feuerwehrpumpenwarts"],
  ["haussitter", "haussitter", "haussitterin", "haussitter", "haussitters"],
  ["holzwerkstoffplattenklassierer", "holzwerkstoffplattenklassierer", "holzwerkstoffplattenklassiererin", "holzwerkstoffplattenklassierer", "holzwerkstoffplattenklassierers"],
  ["instruktor", "instruktoren", "instruktorin", "instruktor", "instruktors"],
  ["kalanderbügler", "kalanderbügler", "kalanderbüglerin", "kalanderbügler", "kalanderbüglers"],
  ["kostenanalyst", "kostenanalysten", "kostenanalystin", "kostenanalysten", "kostenanalysten"],
  ["maschinenstricker", "maschinenstricker", "maschinenstrickerin", "maschinenstricker", "maschinenstrickers"],
  ["metallnieter", "metallnieter", "metallnieterin", "metallnieter", "metallnieters"],
  ["pestizidmischer", "pestizidmischer", "pestizidmischerin", "pestizidmischer", "pestizidmischers"],
  ["pumpenwart", "pumpenwarte", "pumpenwartin", "pumpenwart", "pumpenwarts"],
  ["rigger", "rigger", "riggerin", "rigger", "riggers"],
  ["tufter", "tufter", "tufterin", "tufter", "tufters"],
  ["veranstaltungs-rigger", "veranstaltungs-rigger", "veranstaltungs-riggerin", "veranstaltungs-rigger", "veranstaltungs-riggers"],
  ["veranstaltungsrigger", "veranstaltungsrigger", "veranstaltungsriggerin", "veranstaltungsrigger", "veranstaltungsriggers"]
] as const;

describe("siebenundsiebzigste Lexikon-Ausbauwelle", () => {
  it("enthält alle 17 geprüften Exaktmappings vollständig", () => {
    expect(reviewedPersonFormCountWave77).toBe(17);

    for (const [base, plural, feminine, oblique, genitive] of cases) {
      expect(getReviewedPersonFormsWave77(base), base).toEqual({
        plural,
        singular: base,
        feminineSingular: feminine,
        obliqueSingular: oblique,
        genitiveSingular: genitive
      });
    }
  });

  it.each(cases)("ersetzt den geprüften Plural %s", (base, plural, feminine) => {
    const feminineStem = feminine.slice(0, -2);
    const separatorForm = `${feminineStem}:innen`;
    expect(mappedPluralSeparatorsRule.apply(separatorForm)).toEqual({
      text: plural,
      replacements: 1
    });
  });

  it.each(cases)("erkennt das geprüfte Paar %s", (base, _plural, feminine) => {
    expect(mapMappedSingularPair(base, feminine)).toBe(base);
  });

  it.each(cases)("bildet die Kasusformen für %s korrekt ab", (base, _plural, _feminine, oblique, genitive) => {
    expect(mapMappedSingular(base, "nominative")).toBe(base);
    expect(mapMappedSingular(base, "accusative")).toBe(oblique);
    expect(mapMappedSingular(base, "genitive")).toBe(genitive);
  });
});
