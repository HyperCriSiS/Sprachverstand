import { getExtensionApi, type StorageChange } from "../browser/api";
import {
  defaultSettings,
  normalizeSettings,
  type Settings
} from "./defaults";

const settingsKey = "settings";
const protectedTermsKey = "protectedTerms";

function syncedSettings(settings: Settings): Omit<Settings, "protectedTerms"> {
  return {
    settingsRevision: settings.settingsRevision,
    enabled: settings.enabled,
    excludedDomains: settings.excludedDomains,
    enabledRuleGroupIds: settings.enabledRuleGroupIds,
    processAccessibleAttributes: settings.processAccessibleAttributes
  };
}

export async function loadSettings(): Promise<Settings> {
  const api = getExtensionApi();
  const [syncedResult, localResult] = await Promise.all([
    api.storage.sync.get(settingsKey),
    api.storage.local.get(protectedTermsKey)
  ]);

  const syncedValue = syncedResult[settingsKey];
  const localProtectedTerms = localResult[protectedTermsKey];
  const combinedValue =
    syncedValue && typeof syncedValue === "object"
      ? {
          ...(syncedValue as Record<string, unknown>),
          protectedTerms:
            localProtectedTerms ??
            (syncedValue as Record<string, unknown>).protectedTerms
        }
      : {
          ...defaultSettings,
          protectedTerms: localProtectedTerms ?? defaultSettings.protectedTerms
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
      [protectedTermsKey]: normalized.protectedTerms
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

    if (!synchronizedSettingsChanged && !protectedTermsChanged) {
      return;
    }

    void loadSettings().then(listener);
  };

  api.storage.onChanged.addListener(handleChange);
  return () => api.storage.onChanged.removeListener(handleChange);
}
