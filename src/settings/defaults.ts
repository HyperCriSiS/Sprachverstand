import {
  defaultEnabledRuleGroupIds,
  enabledGroupsFromLegacyDisabledRuleIds,
  normalizeEnabledRuleGroupIds
} from "../rules/catalog";

export const maximumProtectedTerms = 100;
export const maximumProtectedTermLength = 80;
export const currentSettingsRevision = 2;

const introducedDefaultGroups = [
  { revision: 1, groupId: "salutation-participles" },
  { revision: 2, groupId: "title-abbreviations" }
] as const;

export interface Settings {
  readonly settingsRevision: number;
  readonly enabled: boolean;
  readonly excludedDomains: readonly string[];
  readonly enabledRuleGroupIds: readonly string[];
  readonly protectedTerms: readonly string[];
  readonly processAccessibleAttributes: boolean;
}

export const defaultSettings: Settings = {
  settingsRevision: currentSettingsRevision,
  enabled: true,
  excludedDomains: [],
  enabledRuleGroupIds: defaultEnabledRuleGroupIds,
  protectedTerms: [],
  processAccessibleAttributes: true
};

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter(Boolean)
    )
  ];
}

function protectedTermArray(value: unknown): string[] {
  return stringArray(value)
    .filter((entry) => entry.length <= maximumProtectedTermLength)
    .slice(0, maximumProtectedTerms);
}

function storedRevision(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : 0;
}

function migrateEnabledRuleGroups(
  enabledRuleGroupIds: readonly string[],
  fromRevision: number
): string[] {
  const migrated = new Set(enabledRuleGroupIds);

  for (const introduced of introducedDefaultGroups) {
    if (introduced.revision > fromRevision) {
      migrated.add(introduced.groupId);
    }
  }

  return normalizeEnabledRuleGroupIds([...migrated]);
}

export function normalizeSettings(value: unknown): Settings {
  if (!value || typeof value !== "object") {
    return defaultSettings;
  }

  const input = value as Record<string, unknown>;
  const legacyDisabledRuleIds = stringArray(input.disabledRuleIds);
  const revision = storedRevision(input.settingsRevision);
  const hasEnabledGroupList = Array.isArray(input.enabledRuleGroupIds);
  const normalizedGroups = hasEnabledGroupList
    ? normalizeEnabledRuleGroupIds(input.enabledRuleGroupIds)
    : enabledGroupsFromLegacyDisabledRuleIds(legacyDisabledRuleIds);
  const enabledRuleGroupIds = hasEnabledGroupList
    ? migrateEnabledRuleGroups(normalizedGroups, revision)
    : normalizedGroups;

  return {
    settingsRevision: currentSettingsRevision,
    enabled:
      typeof input.enabled === "boolean"
        ? input.enabled
        : defaultSettings.enabled,
    excludedDomains: stringArray(input.excludedDomains),
    enabledRuleGroupIds,
    protectedTerms: protectedTermArray(input.protectedTerms),
    processAccessibleAttributes:
      typeof input.processAccessibleAttributes === "boolean"
        ? input.processAccessibleAttributes
        : defaultSettings.processAccessibleAttributes
  };
}
