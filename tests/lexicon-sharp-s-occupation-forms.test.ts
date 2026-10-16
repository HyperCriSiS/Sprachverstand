import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";
import { defaultEnabledRuleGroupIds, disabledRuleIdsForGroups } from "../src/rules/catalog";
import { mapMappedSingular, mapMappedSingularPair } from "../src/rules/person-lexicon";

const cases = [
  ["Berufsfußballer", "Berufsfußballer", "Berufsfußballer"],
  ["Fußjongleur", "Fußjongleure", "Fußjongleur"],
  ["Greißler", "Greißler", "Greißler"],
  ["Heißfoliendrucker", "Heißfoliendrucker", "Heißfoliendrucker"],
  ["Profifußballer", "Profifußballer", "Profifußballer"],
  ["Straßenartist", "Straßenartisten", "Straßenartisten"],
  ["Straßenfeger", "Straßenfeger", "Straßenfeger"],
  ["Verschleißer", "Verschleißer", "Verschleißer"]
] as const;
const options = { profile: "aggressive" as const, disabledRuleIds: disabledRuleIdsForGroups(defaultEnabledRuleGroupIds) };

describe("Exakte ß-Schreibweisen bereits geprüfter Berufsbezeichnungen", () => {
  it.each(cases)("%s: Marker, Singularpaar und Kasus bleiben schreibtreu", (base, plural, oblique) => {
    for (const marker of [":", "*", "_"]) {
      expect(transformText(`Die ${base}${marker}innen arbeiten.`, defaultRules, options).text).toBe(`Die ${plural} arbeiten.`);
    }
    expect(mapMappedSingularPair(base, `${base}in`)).toBe(base);
    expect(mapMappedSingular(base, "dative")).toBe(oblique);
    const swissBase = base.replaceAll("ß", "ss");
    expect(transformText(`Die ${swissBase}:innen arbeiten.`, defaultRules, options).text).toBe(`Die ${plural.replaceAll("ß", "ss")} arbeiten.`);
    const unmarked = `Der ${base} arbeitet mit dem ${oblique}.`;
    expect(transformText(unmarked, defaultRules, options).text).toBe(unmarked);
  });

  it.each(["General", "Stallknecht", "Fantasiefußjongleur", "Fantasiestraßenartist"])(
    "erweitert nicht pauschal auf %s", (base) => {
      const text = `Die ${base}:innen arbeiten.`;
      expect(transformText(text, defaultRules, options).text).toBe(text);
    }
  );
});