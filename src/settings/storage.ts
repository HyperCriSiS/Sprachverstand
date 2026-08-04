import { getExtensionApi, type StorageChange } from "../browser/api";
import {
  normalizeSettings,
  syncCategoryIds,
  type Settings,
  type SyncCategoryId
} from "./defaults";

const localSettingsKey = "settings";
const syncSelectionKey = "sync.selection";
const maximumSyncItemBytes = 7500;

const syncStorageKeys: Record<SyncCategoryId, string> = {
  activation: "sync.activation",
  "rule-groups": "sync.rule-groups",
  "excluded-domains": "sync.excluded-domains",
  "text-options": "sync.text-options",
  "protected-terms": "sync.protected-terms",
  "custom-replacements": "sync.custom-replacements"
};

const allSyncKeys = [
  syncSelectionKey,
  ...Object.values(syncStorageKeys)
] as const;

function synchronizedValue(
  settings: Settings,
  category: SyncCategoryId
): unknown {
  switch (category) {
    case "activation":
      return settings.enabled;
    case "rule-groups":
      return [...settings.enabledRuleGroupIds];
    case "excluded-domains":
      return [...settings.excludedDomains];
    case "text-options":
      return {
        processAccessibleAttributes: settings.processAccessibleAttributes,
        processQuotedText: settings.processQuotedText,
        processSubtitles: settings.processSubtitles
      };
    case "protected-terms":
      return [...settings.protectedTerms];
    case "custom-replacements":
      return settings.customReplacements.map((entry) => ({ ...entry }));
  }
}

function withSynchronizedValue(
  settings: Settings,
  category: SyncCategoryId,
  value: unknown
): Settings {
  switch (category) {
    case "activation":
      return typeof value === "boolean"
        ? { ...settings, enabled: value }
        : settings;
    case "rule-groups":
      return Array.isArray(value)
        ? normalizeSettings({ ...settings, enabledRuleGroupIds: value })
        : settings;
    case "excluded-domains":
      return Array.isArray(value)
        ? normalizeSettings({ ...settings, excludedDomains: value })
        : settings;
    case "text-options": {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return settings;
      }
      const input = value as Record<string, unknown>;
      return normalizeSettings({
        ...settings,
        processAccessibleAttributes: input.processAccessibleAttributes,
        processQuotedText: input.processQuotedText,
        processSubtitles: input.processSubtitles
      });
    }
    case "protected-terms":
      return Array.isArray(value)
        ? normalizeSettings({ ...settings, protectedTerms: value })
        : settings;
    case "custom-replacements":
      return Array.isArray(value)
        ? normalizeSettings({ ...settings, customReplacements: value })
        : settings;
  }
}

function encodedBytes(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

function assertSyncItemFits(key: string, value: unknown): void {
  const bytes = encodedBytes({ [key]: value });
  if (bytes > maximumSyncItemBytes) {
    throw new Error(
      `Die ausgewählte Browser-Synchronisierung überschreitet mit ${bytes} Byte das sichere Limit von ${maximumSyncItemBytes} Byte pro Kategorie. Bitte weniger Einträge synchronisieren oder diese Kategorie lokal belassen.`
    );
  }
}

function synchronizedSelection(value: unknown): SyncCategoryId[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const known = new Set<string>(syncCategoryIds);
  const selected: SyncCategoryId[] = [];
  const seen = new Set<string>();

  for (const entry of value) {
    if (typeof entry !== "string" || !known.has(entry) || seen.has(entry)) {
      return undefined;
    }
    seen.add(entry);
    selected.push(entry as SyncCategoryId);
  }

  return selected;
}

async function loadSynchronizedValues(): Promise<Record<string, unknown>> {
  try {
    return await getExtensionApi().storage.sync.get(allSyncKeys);
  } catch {
    return {};
  }
}

export async function loadSettings(): Promise<Settings> {
  const api = getExtensionApi();
  const [localResult, syncedResult] = await Promise.all([
    api.storage.local.get(localSettingsKey),
    loadSynchronizedValues()
  ]);

  const localSettings = normalizeSettings(localResult[localSettingsKey]);
  let settings = localSettings;
  const remoteSelection = synchronizedSelection(syncedResult[syncSelectionKey]);
  const selectedCategories = remoteSelection ?? settings.syncCategoryIds;
  settings = normalizeSettings({
    ...settings,
    syncCategoryIds: selectedCategories
  });

  for (const category of settings.syncCategoryIds) {
    const key = syncStorageKeys[category];
    if (Object.prototype.hasOwnProperty.call(syncedResult, key)) {
      settings = withSynchronizedValue(settings, category, syncedResult[key]);
    }
  }

  if (JSON.stringify(settings) !== JSON.stringify(localSettings)) {
    await api.storage.local.set({ [localSettingsKey]: settings });
  }

  return settings;
}

export async function saveSettings(settings: Settings): Promise<void> {
  const api = getExtensionApi();
  const normalized = normalizeSettings(settings);
  const currentLocal = normalizeSettings(
    (await api.storage.local.get(localSettingsKey))[localSettingsKey]
  );
  const selected = new Set(normalized.syncCategoryIds);
  const synchronizationWasOrIsEnabled =
    currentLocal.syncCategoryIds.length > 0 || normalized.syncCategoryIds.length > 0;
  const syncItems: Record<string, unknown> = synchronizationWasOrIsEnabled
    ? { [syncSelectionKey]: [...normalized.syncCategoryIds] }
    : {};
  const keysToRemove: string[] = [];

  if (synchronizationWasOrIsEnabled) {
    assertSyncItemFits(syncSelectionKey, syncItems[syncSelectionKey]);
  }

  for (const category of syncCategoryIds) {
    const key = syncStorageKeys[category];
    if (!selected.has(category)) {
      keysToRemove.push(key);
      continue;
    }

    const value = synchronizedValue(normalized, category);
    assertSyncItemFits(key, value);
    syncItems[key] = value;
  }

  await api.storage.local.set({ [localSettingsKey]: normalized });

  if (!synchronizationWasOrIsEnabled) {
    return;
  }

  try {
    await Promise.all([
      api.storage.sync.set(syncItems),
      keysToRemove.length > 0
        ? api.storage.sync.remove(keysToRemove)
        : Promise.resolve()
    ]);
  } catch (error) {
    throw new Error(
      "Die Einstellungen wurden lokal gespeichert, konnten aber nicht vollständig über den Browser synchronisiert werden. Bitte die Synchronisierung prüfen oder betroffene Kategorien lokal belassen.",
      { cause: error }
    );
  }
}

export function subscribeToSettings(
  listener: (settings: Settings) => void
): () => void {
  const api = getExtensionApi();
  const synchronizedKeys = new Set<string>(allSyncKeys);

  const handleChange = (
    changes: Record<string, StorageChange>,
    areaName: string
  ): void => {
    const localSettingsChanged =
      areaName === "local" && Boolean(changes[localSettingsKey]);
    const synchronizedSettingsChanged =
      areaName === "sync" &&
      Object.keys(changes).some((key) => synchronizedKeys.has(key));

    if (!localSettingsChanged && !synchronizedSettingsChanged) {
      return;
    }

    void loadSettings().then(listener);
  };

  api.storage.onChanged.addListener(handleChange);
  return () => api.storage.onChanged.removeListener(handleChange);
}
