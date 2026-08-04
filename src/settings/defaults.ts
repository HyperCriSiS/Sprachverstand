import {
  defaultEnabledRuleGroupIds,
  enabledGroupsFromLegacyDisabledRuleIds,
  normalizeEnabledRuleGroupIds
} from "../rules/catalog";
import { normalizeDomainPattern } from "./domain";

export const maximumProtectedTerms = 100;
export const maximumProtectedTermLength = 80;
export const maximumCustomReplacements = 100;
export const maximumCustomReplacementSourceLength = 120;
export const maximumCustomReplacementTargetLength = 200;
export const maximumExcludedDomains = 100;
export const maximumExcludedDomainLength = 253;
export const currentSettingsRevision = 7;

export const syncCategoryIds = [
  "activation",
  "rule-groups",
  "excluded-domains",
  "text-options",
  "protected-terms",
  "custom-replacements"
] as const;

export type SyncCategoryId = (typeof syncCategoryIds)[number];

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
  readonly processSubtitles: boolean;
  readonly syncCategoryIds: readonly SyncCategoryId[];
}

export const defaultSettings: Settings = {
  settingsRevision: currentSettingsRevision,
  enabled: true,
  excludedDomains: [],
  enabledRuleGroupIds: defaultEnabledRuleGroupIds,
  protectedTerms: [],
  customReplacements: [],
  processAccessibleAttributes: true,
  processQuotedText: true,
  processSubtitles: false,
  syncCategoryIds: []
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

export function isValidDomainPattern(value: string): boolean {
  if (!value || value.length > maximumExcludedDomainLength) {
    return false;
  }

  if (value === "localhost") {
    return true;
  }

  if (/^\[[0-9a-f:.]+\]$/iu.test(value)) {
    return true;
  }

  if (/^(?:\d{1,3}\.){3}\d{1,3}$/u.test(value)) {
    return value.split(".").every((part) => Number(part) <= 255);
  }

  const labels = value.split(".");
  return (
    labels.length >= 2 &&
    labels.every(
      (label) =>
        label.length >= 1 &&
        label.length <= 63 &&
        /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/iu.test(label)
    )
  );
}

export function normalizeExcludedDomain(input: string): string {
  const normalized = normalizeDomainPattern(input);
  return isValidDomainPattern(normalized) ? normalized : "";
}

function excludedDomainArray(value: unknown): string[] {
  const domains: string[] = [];
  const seen = new Set<string>();

  for (const entry of stringArray(value)) {
    const normalized = normalizeExcludedDomain(entry);
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    domains.push(normalized);
    if (domains.length >= maximumExcludedDomains) {
      break;
    }
  }

  return domains;
}

function protectedTermArray(value: unknown): string[] {
  const normalized = new Map<string, string>();

  for (const entry of stringArray(value)) {
    if (entry.length > maximumProtectedTermLength) {
      continue;
    }

    const key = entry.toLocaleLowerCase("de-DE");
    if (!normalized.has(key)) {
      normalized.set(key, entry);
    }
    if (normalized.size >= maximumProtectedTerms) {
      break;
    }
  }

  return [...normalized.values()];
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

function syncCategoryArray(value: unknown): SyncCategoryId[] {
  const valid = new Set<SyncCategoryId>(syncCategoryIds);
  return stringArray(value).filter((entry): entry is SyncCategoryId =>
    valid.has(entry as SyncCategoryId)
  );
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
    excludedDomains: excludedDomainArray(input.excludedDomains),
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
        : defaultSettings.processQuotedText,
    processSubtitles:
      typeof input.processSubtitles === "boolean"
        ? input.processSubtitles
        : defaultSettings.processSubtitles,
    syncCategoryIds: syncCategoryArray(input.syncCategoryIds)
  };
}
