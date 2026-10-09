import { describe, expect, it } from "vitest";
import { markedDativePluralRule } from "../../src/rules/marked-dative-plural";
import { transformText } from "../../src/core/transform-text";
import { defaultRules } from "../../src/rules";

describe("Markierter Dativplural mit eindeutigem Kontext", () => {
  it.each([
    ["mit erfahrenen Forscher*innen","mit erfahrenen Forschern"],
    ["den Forscher*innen und Expert*innen des Instituts","den Forschern und Experten des Instituts"],
    ["mit den Betreuer*innen","mit den Betreuern"],
    ["Wir sprechen mit persönlichen Betreuer:innen.", "Wir sprechen mit persönlichen Betreuern."],
    ["Nach den persönlichen Betreuer:innen wurde gefragt.", "Nach den persönlichen Betreuern wurde gefragt."],
    ["bei den Ärzt:innen","bei den Ärzten"],
    ["von den Gäst:innen","von den Gästen"],
    ["zu den Mitarbeiter*innen","zu den Mitarbeitern"],
    ["mit Autor:innen","mit Autoren"],
    ["den Student*innen","den Studenten"],
    ["MIT FORSCHER*INNEN","MIT FORSCHERN"]
  ])("normalisiert %s zu %s", (eingabe, ziel) => {
    expect(transformText(eingabe, defaultRules, { profile: "aggressive" }).text)
      .toBe(ziel);
    expect(markedDativePluralRule.apply(eingabe).replacements)
      .toBeGreaterThan(0);
  });

  it.each([
    ["die Forscher*innen","die Forscher"],
    ["für die Betreuer:innen","für die Betreuer"],
    ["Die persönlichen Betreuer:innen sprechen.", "Die persönlichen Betreuer sprechen."],
    ["Wir begrüßen die persönlichen Betreuer:innen.", "Wir begrüßen die persönlichen Betreuer."],
    ["persönlichen Betreuer:innen", "persönlichen Betreuer"],
    ["Forscher*innen arbeiten","Forscher arbeiten"],
    ["mit General:innen","mit General:innen"],
    ["den Stallknecht:innen","den Stallknecht:innen"],
    ["mit den Forscher*innenräumen","mit den Forscherräumen"]
  ])("vermeidet eigenständige Dativ-Flexion in %s", (eingabe, ziel) => {
    expect(markedDativePluralRule.apply(eingabe)).toEqual({
      text: eingabe,
      replacements: 0
    });
    expect(transformText(eingabe, defaultRules, { profile: "aggressive" }).text)
      .toBe(ziel);
  });

  it("lässt unmarkierte Wörter unabhängig vom Kontext unverändert", () => {
    const eingabe = "mit den Forschern und Experten";
    expect(markedDativePluralRule.apply(eingabe)).toEqual({
      text: eingabe, replacements: 0
    });
  });
});