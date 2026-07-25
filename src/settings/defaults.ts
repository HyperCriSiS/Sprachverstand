import type { RuleProfile } from "../core/rule";

export interface Settings {
  readonly enabled: boolean;
  readonly profile: RuleProfile;
  readonly excludedDomains: readonly string[];
  readonly disabledRuleIds: readonly string[];
}

export const defaultSettings: Settings = {
  enabled: true,
  profile: "conservative",
  excludedDomains: [],
  disabledRuleIds: []
};

const validProfiles = new Set<RuleProfile>([
  "conservative",
  "standard",
  "aggressive"
]);

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

export function normalizeSettings(value: unknown): Settings {
  if (!value || typeof value !== "object") {
    return defaultSettings;
  }

  const input = value as Partial<Record<keyof Settings, unknown>>;
  const profile = validProfiles.has(input.profile as RuleProfile)
    ? (input.profile as RuleProfile)
    : defaultSettings.profile;

  return {
    enabled:
      typeof input.enabled === "boolean"
        ? input.enabled
        : defaultSettings.enabled,
    profile,
    excludedDomains: stringArray(input.excludedDomains),
    disabledRuleIds: stringArray(input.disabledRuleIds)
  };
}
