import {
  currentSettingsRevision,
  normalizeSettings,
  type Settings
} from "./defaults";
import {
  maximumPersonalRulesImportBytes,
  mergePersonalRules,
  type PersonalRulesImportMode
} from "./personal-rules";

export const settingsBackupFormat = "sprachverstand.settings-backup";
export const settingsBackupFormatVersion = 1;
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

function assertBoolean(
  value: unknown,
  label: string
): asserts value is boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${label} muss ein Wahrheitswert sein.`);
  }
}

function assertStringArray(
  value: unknown,
  label: string
): asserts value is string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    throw new Error(`${label} muss eine Liste von Textwerten sein.`);
  }
}

function validateSettingsObject(value: unknown): Settings {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Die Datei enthält kein gültiges Einstellungsobjekt.");
  }

  const input = value as Record<string, unknown>;
  if (
    typeof input.settingsRevision !== "number" ||
    !Number.isInteger(input.settingsRevision) ||
    input.settingsRevision < 0
  ) {
    throw new Error("Die Einstellungsrevision ist ungültig.");
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
  assertStringArray(input.excludedDomains, "Die Domain-Ausschlüsse");
  assertStringArray(input.enabledRuleGroupIds, "Die Regelgruppen");
  assertStringArray(input.protectedTerms, "Die persönlichen Ausnahmen");

  if (!Array.isArray(input.customReplacements)) {
    throw new Error("Die eigenen Ersetzungen müssen eine Liste sein.");
  }

  const normalized = normalizeSettings(input);
  return {
    ...normalized,
    settingsRevision: currentSettingsRevision
  };
}

export function createSettingsBackupDocument(
  settings: Settings,
  exportedAt = new Date().toISOString()
): SettingsBackupDocument {
  return {
    format: settingsBackupFormat,
    version: settingsBackupFormatVersion,
    exportedAt,
    settings: {
      ...settings,
      excludedDomains: [...settings.excludedDomains],
      enabledRuleGroupIds: [...settings.enabledRuleGroupIds],
      protectedTerms: [...settings.protectedTerms],
      customReplacements: settings.customReplacements.map((entry) => ({
        ...entry
      }))
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

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Die ausgewählte Datei enthält kein gültiges Sprachverstand-Format.");
  }

  const input = value as Record<string, unknown>;
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
