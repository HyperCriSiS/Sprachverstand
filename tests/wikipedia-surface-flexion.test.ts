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
  ["Physikingenieure/innen", "Physikingenieure"]
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

  it("lässt die fehlerhafte Oberflächenform Gewerkschaftern/innen unverändert", () => {
    expect(
      transformText("Gewerkschaftern/innen", defaultRules, {
        profile: "aggressive",
        disabledRuleIds
      }).text
    ).toBe("Gewerkschaftern/innen");
  });
});
