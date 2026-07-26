import {
  defaultEnabledRuleGroupIds,
  enabledGroupsFromLegacyDisabledRuleIds,
  normalizeEnabledRuleGroupIds
} from "../rules/catalog";

export const maximumProtectedTerms = 100;
export const maximumProtectedTermLength = 80;

export interface Settings {
  readonly enabled: boolean;
  readonly excludedDomains: readonly string[];
  readonly enabledRuleGroupIds: readonly string[];
  readonly protectedTerms: readonly string[];
  readonly processAccessibleAttributes: boolean;
}

export const defaultSettings: Settings = {
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

export function normalizeSettings(value: unknown): Settings {
  if (!value || typeof value !== "object") {
    return defaultSettings;
  }

  const input = value as Record<string, unknown>;
  const legacyDisabledRuleIds = stringArray(input.disabledRuleIds);
  const enabledRuleGroupIds = Array.isArray(input.enabledRuleGroupIds)
    ? normalizeEnabledRuleGroupIds(input.enabledRuleGroupIds)
    : enabledGroupsFromLegacyDisabledRuleIds(legacyDisabledRuleIds);

  return {
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
