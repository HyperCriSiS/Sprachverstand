import {
  defaultEnabledRuleGroupIds,
  enabledGroupsFromLegacyDisabledRuleIds,
  normalizeEnabledRuleGroupIds
} from "../rules/catalog";

export const maximumProtectedTerms = 100;
export const maximumProtectedTermLength = 80;
export const maximumCustomReplacements = 100;
export const maximumCustomReplacementSourceLength = 120;
export const maximumCustomReplacementTargetLength = 200;
export const currentSettingsRevision = 5;

const introducedDefaultGroups = [
  { revision: 1, groupId: "salutation-participles" },
  { revision: 2, groupId: "title-abbreviations" },
  { revision: 3, groupId: "unmarked-singular" },
  { revision: 4, groupId: "substantivized-adjectives" },
  { revision: 5, groupId: "special-gender-forms" }
] as const;

export interface CustomReplacement {
  readonly source: string;
  readonly replacement: string;
}

export interface Settings {
  readonly settingsRevision: number;
  readonly enabled: boolean;
  readonly excludedDomains: readonly string[];
  readonly enabledRuleGroupIds: readonly string[];
  readonly protectedTerms: readonly string[];
  readonly customReplacements: readonly CustomReplacement[];
  readonly processAccessibleAttributes: boolean;
  readonly processQuotedText: boolean;
}

export const defaultSettings: Settings = {
  settingsRevision: currentSettingsRevision,
  enabled: true,
  excludedDomains: [],
  enabledRuleGroupIds: defaultEnabledRuleGroupIds,
  protectedTerms: [],
  customReplacements: [],
  processAccessibleAttributes: true,
  processQuotedText: true
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

function customReplacementArray(value: unknown): CustomReplacement[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const replacements = new Map<string, string>();

  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const candidate = entry as Record<string, unknown>;
    if (
      typeof candidate.source !== "string" ||
      typeof candidate.replacement !== "string"
    ) {
      continue;
    }

    const source = candidate.source.trim();
    const replacement = candidate.replacement.trim();
    if (
      !source ||
      source.length > maximumCustomReplacementSourceLength ||
      replacement.length > maximumCustomReplacementTargetLength
    ) {
      continue;
    }

    replacements.set(source, replacement);
    if (replacements.size >= maximumCustomReplacements) {
      break;
    }
  }

  return [...replacements].map(([source, replacement]) => ({
    source,
    replacement
  }));
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
    customReplacements: customReplacementArray(input.customReplacements),
    processAccessibleAttributes:
      typeof input.processAccessibleAttributes === "boolean"
        ? input.processAccessibleAttributes
        : defaultSettings.processAccessibleAttributes,
    processQuotedText:
      typeof input.processQuotedText === "boolean"
        ? input.processQuotedText
        : defaultSettings.processQuotedText
  };
}
