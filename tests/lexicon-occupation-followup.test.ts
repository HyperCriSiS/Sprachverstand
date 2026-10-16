import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";
import { defaultEnabledRuleGroupIds, disabledRuleIdsForGroups } from "../src/rules/catalog";
import { mapMappedSingular, mapMappedSingularPair } from "../src/rules/person-lexicon";
const options = { profile: "aggressive" as const, disabledRuleIds: disabledRuleIdsForGroups(defaultEnabledRuleGroupIds) };

describe("Marketer: exakt geprüfte Personenform", () => {
  it.each([":", "*", "_"])("erkennt den markierten Plural mit %s", marker => {
    expect(transformText(`Die Marketer${marker}innen planen die Kampagne.`, defaultRules, options).text)
      .toBe("Die Marketer planen die Kampagne.");
  });
  it("bewahrt Singularpaar, Großschreibung und Kasus", () => {
    expect(mapMappedSingularPair("Marketer", "Marketerin")).toBe("Marketer");
    expect(mapMappedSingularPair("Marketerin", "Marketer")).toBe("Marketer");
    for (const grammaticalCase of ["nominative", "accusative", "dative"] as const) {
      expect(mapMappedSingular("Marketer", grammaticalCase)).toBe("Marketer");
    }
    expect(mapMappedSingular("Marketer", "genitive")).toBe("Marketers");
  });
  it.each([
    "Der Marketer plant die Kampagne der Marketerin.",
    "Das Marketing betrifft die Marketerie.",
    "Die Fantasiemarketer:innen planen.",
    "Die Marketerteam:innen planen."
  ])("verändert keinen unmarkierten Text und erweitert keine Wortstämme: %s", text => {
    expect(transformText(text, defaultRules, options).text).toBe(text);
  });
});
// Eigenständig geprüftes Kompositum; keine allgemeine Modelleur-Suffixregel.
describe("Fertigungsmodelleur: exaktes Grundwort einer Berufsbezeichnung", () => {
  it("erkennt Plural und Singularpaar", () => {
    expect(transformText("Die Fertigungsmodelleur:innen erstellen Modelle.", defaultRules, options).text)
      .toBe("Die Fertigungsmodelleure erstellen Modelle.");
    expect(mapMappedSingularPair("Fertigungsmodelleur", "Fertigungsmodelleurin")).toBe("Fertigungsmodelleur");
    expect(mapMappedSingularPair("Fertigungsmodelleurin", "Fertigungsmodelleur")).toBe("Fertigungsmodelleur");
    expect(mapMappedSingular("Fertigungsmodelleur", "dative")).toBe("Fertigungsmodelleur");
    expect(mapMappedSingular("Fertigungsmodelleur", "genitive")).toBe("Fertigungsmodelleurs");
  });
  it.each(["Der Fertigungsmodelleur erstellt Modelle.", "Die Fantasiefertigungsmodelleur:innen arbeiten."])(
    "bewahrt unmarkierte und nicht freigegebene Formen: %s", text => {
      expect(transformText(text, defaultRules, options).text).toBe(text);
    }
  );
});
