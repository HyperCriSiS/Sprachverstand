import { ruleGroupDefinitions } from "../rules/catalog";
import {
  currentSettingsRevision,
  defaultSettings,
  isValidDomainPattern,
  maximumCustomReplacementSourceLength,
  maximumCustomReplacementTargetLength,
  maximumCustomReplacements,
  maximumExcludedDomainLength,
  maximumProtectedTermLength,
  maximumProtectedTerms,
  normalizeExcludedDomain,
  normalizeSettings,
  popupSectionIds,
  syncCategoryIds,
  type CustomReplacement,
  type PopupSectionId,
  type Settings,
  type SyncCategoryId
} from "./defaults";
import {
  maximumPersonalRulesImportBytes,
  mergePersonalRules,
  type PersonalRulesImportMode
} from "./personal-rules";

export const settingsBackupFormat = "sprachverstand.settings-backup";
export const settingsBackupFormatVersion = 2;
export const maximumSettingsBackupImportBytes =
  maximumPersonalRulesImportBytes;

export type SettingsBackupImportMode = PersonalRulesImportMode;

export interface SettingsBackupDocument {
  readonly format: typeof settingsBackupFormat;
  readonly version: typeof settingsBackupFormatVersion;
  readonly exportedAt: string;
  readonly settings: Settings;
}

export interface SettingsImportResult {
  readonly settings: Settings;
  readonly addedProtectedTerms: number;
  readonly addedCustomReplacements: number;
  readonly replacedCustomReplacements: number;
  readonly skippedDuplicates: number;
  readonly conflicts: readonly string[];
}

function assertObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} muss ein Objekt sein.`);
  }
  return value as Record<string, unknown>;
}

function assertOnlyKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  label: string
): void {
  const allowedKeys = new Set(allowed);
  const unknown = Object.keys(value).filter((key) => !allowedKeys.has(key));
  if (unknown.length > 0) {
    throw new Error(`${label} enthält unbekannte Felder: ${unknown.join(", ")}.`);
  }
}

function assertBoolean(
  value: unknown,
  label: string
): asserts value is boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${label} muss ein Wahrheitswert sein.`);
  }
}

function strictStringArray(
  value: unknown,
  label: string,
  maximumEntries: number | undefined,
  maximumLength: number
): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} muss eine Liste sein.`);
  }
  if (maximumEntries !== undefined && value.length > maximumEntries) {
    throw new Error(`${label} enthält mehr als ${maximumEntries} Einträge.`);
  }

  const result: string[] = [];
  const seen = new Set<string>();
  for (const entry of value) {
    if (typeof entry !== "string") {
      throw new Error(`${label} darf nur Textwerte enthalten.`);
    }
    const normalized = entry.trim();
    if (!normalized) {
      throw new Error(`${label} enthält einen leeren Eintrag.`);
    }
    if (normalized.length > maximumLength) {
      throw new Error(
        `${label} enthält einen Eintrag mit mehr als ${maximumLength} Zeichen.`
      );
    }
    if (seen.has(normalized)) {
      throw new Error(`${label} enthält den doppelten Eintrag „${normalized}“.`);
    }
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

function validateDomains(value: unknown): string[] {
  const input = strictStringArray(
    value,
    "Die Domainliste",
    undefined,
    maximumExcludedDomainLength
  );
  const result: string[] = [];
  const seen = new Set<string>();

  for (const entry of input) {
    const normalized = normalizeExcludedDomain(entry);
    if (!normalized || !isValidDomainPattern(normalized)) {
      throw new Error(`Der Domaineintrag „${entry}“ ist ungültig.`);
    }
    if (seen.has(normalized)) {
      throw new Error(
        `Die Domainliste enthält „${entry}“ mehrfach beziehungsweise in gleichwertiger Schreibweise.`
      );
    }
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

function validateDomainListMode(value: unknown): "exclude" | "include" {
  if (value === undefined || value === "exclude") {
    return "exclude";
  }
  if (value === "include") {
    return "include";
  }
  throw new Error("Der Arbeitsmodus der Domainliste ist ungültig.");
}

function validateRuleGroupIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new Error("Die Regelgruppen müssen eine Liste sein.");
  }
  const known = new Set(ruleGroupDefinitions.map((group) => group.id));
  const result: string[] = [];
  const seen = new Set<string>();
  for (const entry of value) {
    if (typeof entry !== "string" || !known.has(entry)) {
      throw new Error(`Die Regelgruppe „${String(entry)}“ ist unbekannt.`);
    }
    if (seen.has(entry)) {
      throw new Error(`Die Regelgruppe „${entry}“ ist doppelt enthalten.`);
    }
    seen.add(entry);
    result.push(entry);
  }
  return result;
}

function validateSyncCategoryIds(value: unknown): SyncCategoryId[] {
  if (!Array.isArray(value)) {
    throw new Error("Die Synchronisierungsauswahl muss eine Liste sein.");
  }
  const known = new Set<string>(syncCategoryIds);
  const result: SyncCategoryId[] = [];
  const seen = new Set<string>();
  for (const entry of value) {
    if (typeof entry !== "string" || !known.has(entry)) {
      throw new Error(`Die Synchronisierungskategorie „${String(entry)}“ ist unbekannt.`);
    }
    if (seen.has(entry)) {
      throw new Error(`Die Synchronisierungskategorie „${entry}“ ist doppelt enthalten.`);
    }
    seen.add(entry);
    result.push(entry as SyncCategoryId);
  }
  return result;
}

function validatePopupSectionIds(value: unknown): PopupSectionId[] {
  if (!Array.isArray(value)) {
    throw new Error("Die Popup-Anzeige muss eine Liste sein.");
  }
  const known = new Set<string>(popupSectionIds);
  const result: PopupSectionId[] = [];
  const seen = new Set<string>();
  for (const entry of value) {
    if (typeof entry !== "string" || !known.has(entry)) {
      throw new Error(`Der Popup-Bereich „${String(entry)}“ ist unbekannt.`);
    }
    if (seen.has(entry)) {
      throw new Error(`Der Popup-Bereich „${entry}“ ist doppelt enthalten.`);
    }
    seen.add(entry);
    result.push(entry as PopupSectionId);
  }
  return result;
}

function validateProtectedTerms(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new Error("Die persönlichen Ausnahmen müssen eine Liste sein.");
  }
  if (value.length > maximumProtectedTerms) {
    throw new Error(
      `Die persönlichen Ausnahmen enthalten mehr als ${maximumProtectedTerms} Einträge.`
    );
  }

  const result: string[] = [];
  const seen = new Set<string>();
  for (const entry of value) {
    if (typeof entry !== "string") {
      throw new Error("Die persönlichen Ausnahmen dürfen nur Textwerte enthalten.");
    }
    const normalized = entry.trim();
    if (!normalized) {
      throw new Error("Die persönlichen Ausnahmen enthalten einen leeren Eintrag.");
    }
    if (normalized.length > maximumProtectedTermLength) {
      throw new Error(
        `Eine persönliche Ausnahme überschreitet ${maximumProtectedTermLength} Zeichen.`
      );
    }
    const key = normalized.toLocaleLowerCase("de-DE");
    if (seen.has(key)) {
      throw new Error(
        `Die persönliche Ausnahme „${normalized}“ ist doppelt enthalten.`
      );
    }
    seen.add(key);
    result.push(normalized);
  }
  return result;
}

function validateCustomReplacements(value: unknown): CustomReplacement[] {
  if (!Array.isArray(value)) {
    throw new Error("Die eigenen Ersetzungen müssen eine Liste sein.");
  }
  if (value.length > maximumCustomReplacements) {
    throw new Error(
      `Die eigenen Ersetzungen enthalten mehr als ${maximumCustomReplacements} Einträge.`
    );
  }

  const result: CustomReplacement[] = [];
  const sources = new Set<string>();
  for (const entry of value) {
    const input = assertObject(entry, "Jede eigene Ersetzung");
    assertOnlyKeys(input, ["source", "replacement"], "Eine eigene Ersetzung");
    if (
      typeof input.source !== "string" ||
      typeof input.replacement !== "string"
    ) {
      throw new Error("Eigene Ersetzungen benötigen Textwerte für Ausgang und Ziel.");
    }

    const source = input.source.trim();
    const replacement = input.replacement.trim();
    if (!source) {
      throw new Error("Eine eigene Ersetzung besitzt einen leeren Ausgangstext.");
    }
    if (source.length > maximumCustomReplacementSourceLength) {
      throw new Error(
        `Ein Ausgangstext überschreitet ${maximumCustomReplacementSourceLength} Zeichen.`
      );
    }
    if (replacement.length > maximumCustomReplacementTargetLength) {
      throw new Error(
        `Ein Ersetzungsziel überschreitet ${maximumCustomReplacementTargetLength} Zeichen.`
      );
    }
    if (sources.has(source)) {
      throw new Error(`Der Ausgangstext „${source}“ ist mehrfach enthalten.`);
    }
    sources.add(source);
    result.push({ source, replacement });
  }
  return result;
}

function validateSettingsObject(value: unknown): Settings {
  const input = assertObject(value, "Die Einstellungssicherung");
  assertOnlyKeys(
    input,
    [
      "settingsRevision",
      "enabled",
      "excludedDomains",
      "domainListMode",
      "enabledRuleGroupIds",
      "protectedTerms",
      "customReplacements",
      "processAccessibleAttributes",
      "processQuotedText",
      "processSubtitles",
      "syncCategoryIds",
      "visiblePopupSectionIds"
    ],
    "Die Einstellungssicherung"
  );

  if (
    typeof input.settingsRevision !== "number" ||
    !Number.isInteger(input.settingsRevision) ||
    input.settingsRevision < 0
  ) {
    throw new Error("Die Einstellungsrevision ist ungültig.");
  }
  if (input.settingsRevision > currentSettingsRevision) {
    throw new Error(
      `Die Einstellungsrevision ${input.settingsRevision} ist neuer als die unterstützte Revision ${currentSettingsRevision}.`
    );
  }

  assertBoolean(input.enabled, "Der Aktivierungsstatus");
  assertBoolean(
    input.processAccessibleAttributes,
    "Die Einstellung für zugängliche Attribute"
  );
  assertBoolean(
    input.processQuotedText,
    "Die Einstellung für Anführungszeichen"
  );
  if (input.processSubtitles !== undefined) {
    assertBoolean(
      input.processSubtitles,
      "Die Einstellung für Untertitel"
    );
  }

  return normalizeSettings({
    settingsRevision: input.settingsRevision,
    enabled: input.enabled,
    excludedDomains: validateDomains(input.excludedDomains),
    domainListMode: validateDomainListMode(input.domainListMode),
    enabledRuleGroupIds: validateRuleGroupIds(input.enabledRuleGroupIds),
    protectedTerms: validateProtectedTerms(input.protectedTerms),
    customReplacements: validateCustomReplacements(input.customReplacements),
    processAccessibleAttributes: input.processAccessibleAttributes,
    processQuotedText: input.processQuotedText,
    processSubtitles:
      input.processSubtitles ?? defaultSettings.processSubtitles,
    syncCategoryIds: validateSyncCategoryIds(input.syncCategoryIds),
    visiblePopupSectionIds:
      input.visiblePopupSectionIds === undefined
        ? defaultSettings.visiblePopupSectionIds
        : validatePopupSectionIds(input.visiblePopupSectionIds)
  });
}

export function createSettingsBackupDocument(
  settings: Settings,
  exportedAt = new Date().toISOString()
): SettingsBackupDocument {
  const normalized = normalizeSettings(settings);
  return {
    format: settingsBackupFormat,
    version: settingsBackupFormatVersion,
    exportedAt,
    settings: {
      ...normalized,
      excludedDomains: [...normalized.excludedDomains],
      enabledRuleGroupIds: [...normalized.enabledRuleGroupIds],
      protectedTerms: [...normalized.protectedTerms],
      customReplacements: normalized.customReplacements.map((entry) => ({
        ...entry
      })),
      syncCategoryIds: [...normalized.syncCategoryIds],
      visiblePopupSectionIds: [...(normalized.visiblePopupSectionIds ?? [])]
    }
  };
}

export function stringifySettingsBackupDocument(
  document: SettingsBackupDocument
): string {
  return `${JSON.stringify(document, null, 2)}\n`;
}

export function parseSettingsBackupDocument(
  contents: string
): SettingsBackupDocument {
  let value: unknown;
  try {
    value = JSON.parse(contents) as unknown;
  } catch {
    throw new Error("Die ausgewählte Datei enthält kein gültiges JSON.");
  }

  const input = assertObject(
    value,
    "Die ausgewählte Datei"
  );
  assertOnlyKeys(
    input,
    ["format", "version", "exportedAt", "settings"],
    "Die ausgewählte Datei"
  );
  if (input.format !== settingsBackupFormat) {
    throw new Error("Die Datei ist keine Sprachverstand-Einstellungssicherung.");
  }
  if (input.version !== settingsBackupFormatVersion) {
    throw new Error(
      `Die Sicherungsversion ${String(input.version)} wird nicht unterstützt.`
    );
  }
  if (
    typeof input.exportedAt !== "string" ||
    Number.isNaN(Date.parse(input.exportedAt))
  ) {
    throw new Error("Der Exportzeitpunkt der Datei ist ungültig.");
  }

  return {
    format: settingsBackupFormat,
    version: settingsBackupFormatVersion,
    exportedAt: input.exportedAt,
    settings: validateSettingsObject(input.settings)
  };
}

export function mergeImportedSettings(
  existing: Settings,
  imported: Settings,
  mode: SettingsBackupImportMode
): SettingsImportResult {
  const personalRules = mergePersonalRules(
    {
      protectedTerms: existing.protectedTerms,
      customReplacements: existing.customReplacements
    },
    {
      protectedTerms: imported.protectedTerms,
      customReplacements: imported.customReplacements
    },
    mode
  );

  return {
    settings: {
      ...imported,
      settingsRevision: currentSettingsRevision,
      protectedTerms: personalRules.protectedTerms,
      customReplacements: personalRules.customReplacements
    },
    addedProtectedTerms: personalRules.addedProtectedTerms,
    addedCustomReplacements: personalRules.addedCustomReplacements,
    replacedCustomReplacements: personalRules.replacedCustomReplacements,
    skippedDuplicates: personalRules.skippedDuplicates,
    conflicts: personalRules.conflicts
  };
}
