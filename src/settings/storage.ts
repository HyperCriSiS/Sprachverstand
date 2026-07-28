import { getExtensionApi, type StorageChange } from "../browser/api";
import {
  defaultSettings,
  normalizeSettings,
  type Settings
} from "./defaults";

const settingsKey = "settings";
const protectedTermsKey = "protectedTerms";
const customReplacementsKey = "customReplacements";

function syncedSettings(
  settings: Settings
): Omit<Settings, "protectedTerms" | "customReplacements"> {
  return {
    settingsRevision: settings.settingsRevision,
    enabled: settings.enabled,
    excludedDomains: settings.excludedDomains,
    enabledRuleGroupIds: settings.enabledRuleGroupIds,
    processAccessibleAttributes: settings.processAccessibleAttributes,
    processQuotedText: settings.processQuotedText
  };
}

export async function loadSettings(): Promise<Settings> {
  const api = getExtensionApi();
  const [syncedResult, localResult] = await Promise.all([
    api.storage.sync.get(settingsKey),
    api.storage.local.get([protectedTermsKey, customReplacementsKey])
  ]);

  const syncedValue = syncedResult[settingsKey];
  const localProtectedTerms = localResult[protectedTermsKey];
  const localCustomReplacements = localResult[customReplacementsKey];
  const combinedValue =
    syncedValue && typeof syncedValue === "object"
      ? {
          ...(syncedValue as Record<string, unknown>),
          protectedTerms:
            localProtectedTerms ??
            (syncedValue as Record<string, unknown>).protectedTerms,
          customReplacements:
            localCustomReplacements ??
            (syncedValue as Record<string, unknown>).customReplacements
        }
      : {
          ...defaultSettings,
          protectedTerms: localProtectedTerms ?? defaultSettings.protectedTerms,
          customReplacements:
            localCustomReplacements ?? defaultSettings.customReplacements
        };

  return normalizeSettings(combinedValue);
}

export async function saveSettings(settings: Settings): Promise<void> {
  const api = getExtensionApi();
  const normalized = normalizeSettings(settings);

  await Promise.all([
    api.storage.sync.set({
      [settingsKey]: syncedSettings(normalized)
    }),
    api.storage.local.set({
      [protectedTermsKey]: normalized.protectedTerms,
      [customReplacementsKey]: normalized.customReplacements
    })
  ]);
}

export function subscribeToSettings(
  listener: (settings: Settings) => void
): () => void {
  const api = getExtensionApi();

  const handleChange = (
    changes: Record<string, StorageChange>,
    areaName: string
  ): void => {
    const synchronizedSettingsChanged =
      areaName === "sync" && Boolean(changes[settingsKey]);
    const protectedTermsChanged =
      areaName === "local" && Boolean(changes[protectedTermsKey]);
    const customReplacementsChanged =
      areaName === "local" && Boolean(changes[customReplacementsKey]);

    if (
      !synchronizedSettingsChanged &&
      !protectedTermsChanged &&
      !customReplacementsChanged
    ) {
      return;
    }

    void loadSettings().then(listener);
  };

  api.storage.onChanged.addListener(handleChange);
  return () => api.storage.onChanged.removeListener(handleChange);
}
