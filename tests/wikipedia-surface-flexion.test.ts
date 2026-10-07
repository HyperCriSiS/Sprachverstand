import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";
import {
  defaultEnabledRuleGroupIds,
  disabledRuleIdsForGroups
} from "../src/rules/catalog";

const disabledRuleIds = disabledRuleIdsForGroups(defaultEnabledRuleGroupIds);

const cases = [
  ["Bürgermeisters/in", "Bürgermeisters"],
  ["Athleten*innen", "Athleten"],
  ["Physikingenieure/innen", "Physikingenieure"],
  ["Ortsvorsteher(in)", "Ortsvorsteher"],
  ["Benediktiner(innen)", "Benediktiner"],
  ["Nachwuchssportler(in)", "Nachwuchssportler"],
  ["Tennisspieler(in)", "Tennisspieler"]
] as const;

describe("enge Wikipedia-Oberflächenflexionen", () => {
  it.each(cases)("normalisiert %s exakt", (input, expected) => {
    expect(
      transformText(input, defaultRules, {
        profile: "aggressive",
        disabledRuleIds
      }).text
    ).toBe(expected);
  });

  it.each(["Gewerkschaftern/innen", "Check-In"])(
    "lässt die bewusst nicht freigegebene Form %s unverändert",
    (input) => {
      expect(
        transformText(input, defaultRules, {
          profile: "aggressive",
          disabledRuleIds
        }).text
      ).toBe(input);
    }
  );
});
