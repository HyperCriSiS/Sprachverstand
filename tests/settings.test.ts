import { describe, expect, it } from "vitest";
import { defaultRules } from "../src/rules";
import {
  defaultEnabledRuleGroupIds,
  disabledRuleIdsForGroups,
  ruleGroupDefinitions
} from "../src/rules/catalog";
import {
  defaultSettings,
  maximumProtectedTermLength,
  maximumProtectedTerms,
  normalizeSettings
} from "../src/settings/defaults";

describe("Einstellungen", () => {
  it("aktiviert standardmäßig alle aktuellen sicheren Regelgruppen", () => {
    expect(defaultSettings.enabledRuleGroupIds).toEqual(
      defaultEnabledRuleGroupIds
    );
    expect(disabledRuleIdsForGroups(defaultEnabledRuleGroupIds).size).toBe(0);
  });

  it("migriert alte deaktivierte Regel-IDs auf verständliche Gruppen", () => {
    const settings = normalizeSettings({
      enabled: true,
      profile: "conservative",
      excludedDomains: ["example.org"],
      disabledRuleIds: ["plural.binnen-i"]
    });

    expect(settings.enabledRuleGroupIds).not.toContain("plural-binnen-i");
    expect(settings.enabledRuleGroupIds).toContain("plural-separators");
    expect(settings.excludedDomains).toEqual(["example.org"]);
  });

  it("verwirft unbekannte Gruppen und begrenzt persönliche Ausnahmen", () => {
    const longTerm = "x".repeat(maximumProtectedTermLength + 1);
    const protectedTerms = [
      "Nutzer:innen",
      "Nutzer:innen",
      longTerm,
      ...Array.from(
        { length: maximumProtectedTerms + 20 },
        (_, index) => `Phrase ${index}`
      )
    ];

    const settings = normalizeSettings({
      enabledRuleGroupIds: ["plural-separators", "unbekannt"],
      protectedTerms,
      processAccessibleAttributes: false
    });

    expect(settings.enabledRuleGroupIds).toEqual(["plural-separators"]);
    expect(settings.protectedTerms).toHaveLength(maximumProtectedTerms);
    expect(settings.protectedTerms).not.toContain(longTerm);
    expect(settings.processAccessibleAttributes).toBe(false);
  });

  it("ordnet jede produktive Regel genau einer sichtbaren Gruppe zu", () => {
    const catalogRuleIds = ruleGroupDefinitions.flatMap(
      (group) => group.ruleIds
    );
    const productiveRuleIds = defaultRules.map((rule) => rule.id);

    expect(new Set(catalogRuleIds).size).toBe(catalogRuleIds.length);
    expect([...catalogRuleIds].sort()).toEqual([...productiveRuleIds].sort());
  });
});
