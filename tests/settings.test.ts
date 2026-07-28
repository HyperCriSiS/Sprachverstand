import { describe, expect, it } from "vitest";
import { defaultRules } from "../src/rules";
import {
  defaultEnabledRuleGroupIds,
  disabledRuleIdsForGroups,
  ruleGroupDefinitions
} from "../src/rules/catalog";
import {
  currentSettingsRevision,
  defaultSettings,
  maximumCustomReplacementSourceLength,
  maximumCustomReplacements,
  maximumProtectedTermLength,
  maximumProtectedTerms,
  normalizeSettings
} from "../src/settings/defaults";

describe("Einstellungen", () => {
  it("aktiviert standardmäßig alle aktuellen sicheren Regelgruppen", () => {
    expect(defaultSettings.enabledRuleGroupIds).toEqual(
      defaultEnabledRuleGroupIds
    );
    expect(defaultSettings.enabledRuleGroupIds).not.toContain("neutral-person-terms");
    expect(defaultSettings.enabledRuleGroupIds).not.toContain("job-ad-suffixes");
    expect(disabledRuleIdsForGroups(defaultEnabledRuleGroupIds)).toEqual(
      new Set(["neutral.person-terms", "job-ad.gender-suffixes"])
    );
    expect(defaultSettings.enabledRuleGroupIds).toContain(
      "substantivized-adjectives"
    );
    expect(defaultSettings.enabledRuleGroupIds).toContain("special-gender-forms");
    expect(defaultSettings.settingsRevision).toBe(currentSettingsRevision);
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
    expect(settings.enabledRuleGroupIds).not.toContain("neutral-person-terms");
    expect(settings.enabledRuleGroupIds).not.toContain("job-ad-suffixes");
    expect(settings.excludedDomains).toEqual(["example.org"]);
  });

  it("aktiviert neu eingeführte Standardgruppen bei alten Gruppenlisten", () => {
    const settings = normalizeSettings({
      enabledRuleGroupIds: ["plural-separators"],
      settingsRevision: 0
    });

    expect(settings.enabledRuleGroupIds).toEqual([
      "plural-separators",
      "salutation-participles",
      "title-abbreviations",
      "unmarked-singular",
      "substantivized-adjectives",
      "special-gender-forms"
    ]);
    expect(settings.settingsRevision).toBe(currentSettingsRevision);
  });

  it("respektiert deaktivierte Gruppen nach aktueller Migration", () => {
    const settings = normalizeSettings({
      settingsRevision: currentSettingsRevision,
      enabledRuleGroupIds: ["plural-separators", "unbekannt"]
    });

    expect(settings.enabledRuleGroupIds).toEqual(["plural-separators"]);
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
      settingsRevision: currentSettingsRevision,
      enabledRuleGroupIds: ["plural-separators", "unbekannt"],
      protectedTerms,
      customReplacements: [
        { source: "Sonderform", replacement: "Ziel" },
        { source: "Sonderform", replacement: "Neues Ziel" },
        {
          source: "x".repeat(maximumCustomReplacementSourceLength + 1),
          replacement: "ignorieren"
        },
        ...Array.from(
          { length: maximumCustomReplacements + 20 },
          (_, index) => ({ source: `Quelle ${index}`, replacement: `Ziel ${index}` })
        )
      ],
      processAccessibleAttributes: false,
      processQuotedText: false
    });

    expect(settings.enabledRuleGroupIds).toEqual(["plural-separators"]);
    expect(settings.protectedTerms).toHaveLength(maximumProtectedTerms);
    expect(settings.protectedTerms).not.toContain(longTerm);
    expect(settings.customReplacements).toHaveLength(maximumCustomReplacements);
    expect(settings.customReplacements[0]).toEqual({
      source: "Sonderform",
      replacement: "Neues Ziel"
    });
    expect(settings.customReplacements.some((entry) => entry.source.startsWith("xxx"))).toBe(false);
    expect(settings.processAccessibleAttributes).toBe(false);
    expect(settings.processQuotedText).toBe(false);
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
