import { getExtensionApi, type StorageChange } from "../browser/api";
import {
  defaultSettings,
  normalizeSettings,
  type Settings
} from "./defaults";

const settingsKey = "settings";

export async function loadSettings(): Promise<Settings> {
  const result = await getExtensionApi().storage.sync.get(settingsKey);
  return normalizeSettings(result[settingsKey] ?? defaultSettings);
}

export async function saveSettings(settings: Settings): Promise<void> {
  await getExtensionApi().storage.sync.set({
    [settingsKey]: normalizeSettings(settings)
  });
}

export function subscribeToSettings(
  listener: (settings: Settings) => void
): () => void {
  const api = getExtensionApi();

  const handleChange = (
    changes: Record<string, StorageChange>,
    areaName: string
  ): void => {
    if (areaName !== "sync" || !changes[settingsKey]) {
      return;
    }

    listener(normalizeSettings(changes[settingsKey].newValue));
  };

  api.storage.onChanged.addListener(handleChange);
  return () => api.storage.onChanged.removeListener(handleChange);
}
