import { getExtensionApi, type StorageChange } from "../browser/api";
import {
  currentSettingsRevision,
  enabledRuleGroupIdsFromRevision,
  normalizeSettings,
  syncCategoryIds,
  type Settings,
  type SyncCategoryId
} from "./defaults";

const localSettingsKey = "settings";
const localSyncOverrideKey = "settings.sync-local-override";
const syncSelectionKey = "sync.selection";
// The revision that wrote the rule group list, next to the list itself so
// that older versions keep reading the plain array.
const syncRuleGroupRevisionKey = "sync.rule-groups.revision";
const maximumSyncItemBytes = 7500;
const settingsRetryDelaysMs = [100, 500, 1500] as const;
// A rule group list without its revision came from a version that did not
// write one yet. Revision 11 introduced one group and the revision key; the
// list is read as revision 10, so that group is enabled once rather than
// disabled on every device.
const legacyRuleGroupSyncRevision = 10;

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
  syncRuleGroupRevisionKey,
  ...Object.values(syncStorageKeys)
] as const;

// Thrown after the settings were saved locally: the browser synchronization
// did not take over every selected category.
export class SettingsSyncError extends Error {
  readonly localSaved = true;
}

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
      return {
        mode: settings.domainListMode,
        domains: [...settings.excludedDomains]
      };
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

function booleanOr(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function withSynchronizedValue(
  settings: Settings,
  category: SyncCategoryId,
  value: unknown,
  ruleGroupRevision: unknown
): Settings {
  switch (category) {
    case "activation":
      return typeof value === "boolean"
        ? { ...settings, enabled: value }
        : settings;
    case "rule-groups":
      // The writing device's revision lets this device apply its migrations
      // to the list, instead of the list disabling new default groups
      // everywhere.
      return Array.isArray(value)
        ? normalizeSettings({
            ...settings,
            enabledRuleGroupIds: enabledRuleGroupIdsFromRevision(
              value,
              ruleGroupRevision ?? legacyRuleGroupSyncRevision
            )
          })
        : settings;
    case "excluded-domains": {
      if (Array.isArray(value)) {
        return normalizeSettings({
          ...settings,
          excludedDomains: value,
          domainListMode: "exclude"
        });
      }
      if (!value || typeof value !== "object") {
        return settings;
      }
      const input = value as Record<string, unknown>;
      return normalizeSettings({
        ...settings,
        excludedDomains: input.domains,
        domainListMode: input.mode
      });
    }
    case "text-options": {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return settings;
      }
      // A field an older device does not know keeps its local value instead
      // of falling back to the default.
      const input = value as Record<string, unknown>;
      return normalizeSettings({
        ...settings,
        processAccessibleAttributes: booleanOr(input.processAccessibleAttributes, settings.processAccessibleAttributes),
        processQuotedText: booleanOr(input.processQuotedText, settings.processQuotedText),
        processSubtitles: booleanOr(input.processSubtitles, settings.processSubtitles)
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

// A device whose last synchronization failed offers its local state again
// when it loads, instead of ignoring the synchronization until the next
// manual save; the same state is offered once per process.
let resyncedSignature: string | undefined;
let savesInFlight = 0;

export async function loadSettings(): Promise<Settings> {
  const api = getExtensionApi();
  // Beide Speicher starten parallel; ein verbindlicher lokaler Stand muss
  // jedoch nicht auf eine dafür unerhebliche Sync-Antwort warten.
  const localRead = api.storage.local.get([localSettingsKey, localSyncOverrideKey]);
  const syncedRead = loadSynchronizedValues();
  const localResult = await localRead;

  const localSettings = normalizeSettings(localResult[localSettingsKey]);

  // Bei einem lokalen Speichervorgang oder ausdrücklich abgeschalteter
  // Synchronisierung darf ein älterer Sync-Stand nicht zurückschreiben.
  if (localResult[localSyncOverrideKey] === true) {
    const signature = JSON.stringify(localSettings);
    if (localSettings.syncCategoryIds.length > 0 && resyncedSignature !== signature && savesInFlight === 0) {
      resyncedSignature = signature;
      void resynchronizeLocalSettings(localSettings);
    }
    return localSettings;
  }

  const syncedResult = await syncedRead;
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
      settings = withSynchronizedValue(settings, category, syncedResult[key],
        syncedResult[syncRuleGroupRevisionKey]);
    }
  }

  // Ein Lesevorgang darf nicht neben einem Speichervorgang alte
  // Sync-Daten in den lokalen Speicher zurückschreiben.
  return settings;
}

// The failed synchronization of an earlier save is repeated with the local
// state it left behind. Failures stay silent here; the next save reports.
async function resynchronizeLocalSettings(localSettings: Settings): Promise<void> {
  const api = getExtensionApi();
  try {
    const current = normalizeSettings(
      (await api.storage.local.get(localSettingsKey))[localSettingsKey]
    );
    if (savesInFlight > 0 || JSON.stringify(current) !== JSON.stringify(localSettings)) return;
    await pushSynchronizedSettings(current);
  } catch {
    // The synchronization is still unavailable; local settings stay authoritative.
  }
}

function waitForRetry(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, delayMs);
  });
}

export async function loadSettingsWithRetry(): Promise<Settings> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= settingsRetryDelaysMs.length; attempt += 1) {
    try {
      return await loadSettings();
    } catch (error) {
      lastError = error;
      const delayMs = settingsRetryDelaysMs[attempt];
      if (delayMs === undefined) {
        break;
      }
      await waitForRetry(delayMs);
    }
  }

  throw lastError;
}

interface SynchronizationPlan {
  readonly items: Record<string, unknown>;
  readonly keysToRemove: readonly string[];
  readonly oversized: readonly { readonly category: SyncCategoryId; readonly bytes: number }[];
}

function planSynchronization(normalized: Settings): SynchronizationPlan {
  const selected = new Set(normalized.syncCategoryIds);
  const items: Record<string, unknown> = {
    [syncSelectionKey]: [...normalized.syncCategoryIds]
  };
  const keysToRemove: string[] = [];
  const oversized: { category: SyncCategoryId; bytes: number }[] = [];

  if (selected.has("rule-groups")) {
    items[syncRuleGroupRevisionKey] = currentSettingsRevision;
  } else {
    keysToRemove.push(syncRuleGroupRevisionKey);
  }
  for (const category of syncCategoryIds) {
    const key = syncStorageKeys[category];
    if (!selected.has(category)) {
      keysToRemove.push(key);
      continue;
    }
    const value = synchronizedValue(normalized, category);
    const bytes = encodedBytes({ [key]: value });
    if (bytes > maximumSyncItemBytes) {
      // The category stays selected and keeps its previous synchronized
      // value; other devices are not pushed a truncated list.
      oversized.push({ category, bytes });
      continue;
    }
    items[key] = value;
  }

  return { items, keysToRemove, oversized };
}

// Writes only what differs from the synchronized state: browsers limit the
// number of synchronization writes per minute, and a popup toggle used to
// rewrite every selected category.
async function pushSynchronizedSettings(normalized: Settings): Promise<void> {
  const api = getExtensionApi();
  const plan = planSynchronization(normalized);
  const remote = await loadSynchronizedValues();
  const changed = Object.fromEntries(
    Object.entries(plan.items).filter(
      ([key, value]) => JSON.stringify(remote[key]) !== JSON.stringify(value)
    )
  );
  const removals = plan.keysToRemove.filter((key) =>
    Object.prototype.hasOwnProperty.call(remote, key)
  );

  try {
    await Promise.all([
      Object.keys(changed).length > 0 ? api.storage.sync.set(changed) : Promise.resolve(),
      removals.length > 0 ? api.storage.sync.remove(removals) : Promise.resolve()
    ]);
  } catch (error) {
    throw new SettingsSyncError(
      "Die Einstellungen wurden lokal gespeichert, konnten aber nicht vollständig über den Browser synchronisiert werden. Bitte die Synchronisierung prüfen oder betroffene Kategorien lokal belassen.",
      { cause: error }
    );
  }

  if (plan.oversized.length > 0) {
    const details = plan.oversized
      .map((entry) => `„${entry.category}“ (${entry.bytes} Byte)`)
      .join(", ");
    throw new SettingsSyncError(
      `Die Einstellungen wurden lokal gespeichert. Die Browser-Synchronisierung überschreitet mit ${details} das sichere Limit von ${maximumSyncItemBytes} Byte pro Kategorie; diese Kategorie behält auf anderen Geräten ihren bisherigen Stand. Bitte weniger Einträge synchronisieren oder die Kategorie lokal belassen.`
    );
  }

  // Eine explizite Sync-Abwahl bleibt auf diesem Gerät dauerhaft lokal
  // autoritativ. Bei aktiver Synchronisierung wird die Sperre dagegen
  // erst nach bestätigtem Abschluss aufgehoben.
  if (normalized.syncCategoryIds.length > 0) {
    const current = await api.storage.local.get(localSettingsKey);
    if (
      JSON.stringify(normalizeSettings(current[localSettingsKey])) ===
      JSON.stringify(normalized)
    ) {
      await api.storage.local.remove(localSyncOverrideKey);
    }
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  const api = getExtensionApi();
  savesInFlight += 1;
  try {
    const currentLocal = normalizeSettings(
      (await api.storage.local.get(localSettingsKey))[localSettingsKey]
    );
    const normalizedInput = normalizeSettings(settings);
    const normalized =
      settings.visiblePopupSectionIds === undefined
        ? {
            ...normalizedInput,
            visiblePopupSectionIds: currentLocal.visiblePopupSectionIds
          }
        : normalizedInput;
    const synchronizationWasOrIsEnabled =
      currentLocal.syncCategoryIds.length > 0 || normalized.syncCategoryIds.length > 0;

    // Beide Werte werden in einem lokalen Storage-Set geschrieben. Solange
    // die Sync-Schreiboperation nicht vollständig bestätigt wurde, bleiben
    // lokale Änderungen und der lokale Widerruf verbindlich.
    await api.storage.local.set({
      [localSettingsKey]: normalized,
      [localSyncOverrideKey]: true
    });

    if (!synchronizationWasOrIsEnabled) {
      return;
    }

    await pushSynchronizedSettings(normalized);
  } finally {
    savesInFlight -= 1;
  }
}

export function subscribeToSettings(
  listener: (settings: Settings) => void,
  options: { readonly initial?: boolean } = {}
): () => void {
  const api = getExtensionApi();
  const synchronizedKeys = new Set<string>(allSyncKeys);
  let active = true;
  let generation = 0;

  const loadLatest = (): void => {
    const readingGeneration = ++generation;
    void loadSettingsWithRetry()
      .then((settings) => {
        if (active && readingGeneration === generation) return listener(settings);
      })
      .catch((error: unknown) => {
        if (!active || readingGeneration !== generation) return;
        console.error("Einstellungen konnten nicht geladen oder angewendet werden.", error);
      });
  };

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

    loadLatest();
  };

  api.storage.onChanged.addListener(handleChange);
  if (options.initial) loadLatest();
  return () => {
    active = false;
    generation += 1;
    api.storage.onChanged.removeListener(handleChange);
  };
}
