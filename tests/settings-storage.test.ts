import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ExtensionApi, StorageChange } from "../src/browser/api";
import { defaultSettings, type Settings } from "../src/settings/defaults";
import {
  loadSettings,
  loadSettingsWithRetry,
  saveSettings,
  subscribeToSettings
} from "../src/settings/storage";

class MemoryStorageArea {
  readonly values = new Map<string, unknown>();
  failReads = false;
  remainingReadFailures = 0;
  failWrites = false;

  async get(
    keys?: string | readonly string[] | Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    if (this.failReads || this.remainingReadFailures > 0) {
      if (this.remainingReadFailures > 0) {
        this.remainingReadFailures -= 1;
      }
      throw new Error("Speicher nicht verfügbar");
    }

    const selected =
      typeof keys === "string"
        ? [keys]
        : Array.isArray(keys)
          ? [...keys]
          : keys && typeof keys === "object"
            ? Object.keys(keys)
            : [...this.values.keys()];
    return Object.fromEntries(
      selected
        .filter((key) => this.values.has(key))
        .map((key) => [key, this.values.get(key)])
    );
  }

  async set(items: Record<string, unknown>): Promise<void> {
    if (this.failWrites) {
      throw new Error("Speicher nicht verfügbar");
    }
    for (const [key, value] of Object.entries(items)) {
      this.values.set(key, value);
    }
  }

  async remove(keys: string | readonly string[]): Promise<void> {
    if (this.failWrites) {
      throw new Error("Speicher nicht verfügbar");
    }
    for (const key of typeof keys === "string" ? [keys] : keys) {
      this.values.delete(key);
    }
  }
}

function settings(overrides: Partial<Settings> = {}): Settings {
  return { ...defaultSettings, ...overrides };
}

type StorageListener = (
  changes: Record<string, StorageChange>,
  areaName: string
) => void;

let local: MemoryStorageArea;
let sync: MemoryStorageArea;
let storageListeners: Set<StorageListener>;

beforeEach(() => {
  local = new MemoryStorageArea();
  sync = new MemoryStorageArea();
  storageListeners = new Set<StorageListener>();
  const api = {
    storage: {
      local,
      sync,
      onChanged: {
        addListener: (
          listener: StorageListener
        ) => {
          storageListeners.add(listener);
        },
        removeListener: (
          listener: StorageListener
        ) => {
          storageListeners.delete(listener);
        }
      }
    }
  } as unknown as ExtensionApi;
  (globalThis as typeof globalThis & { browser?: ExtensionApi }).browser = api;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Einstellungsspeicher", () => {
  it("speichert standardmäßig den vollständigen Stand lokal und keine Nutzdaten synchron", async () => {
    const value = settings({
      protectedTerms: ["Privat"],
      customReplacements: [{ source: "A", replacement: "B" }]
    });

    await saveSettings(value);

    expect(local.values.get("settings")).toEqual(value);
    expect(sync.values.size).toBe(0);
    expect(await loadSettings()).toEqual(value);
  });

  it("synchronisiert nur ausdrücklich ausgewählte Kategorien", async () => {
    const value = settings({
      enabled: false,
      excludedDomains: ["private.example"],
      protectedTerms: ["Privat"],
      syncCategoryIds: ["activation", "protected-terms"]
    });

    await saveSettings(value);

    expect(sync.values.get("sync.selection")).toEqual([
      "activation",
      "protected-terms"
    ]);
    expect(sync.values.get("sync.activation")).toBe(false);
    expect(sync.values.get("sync.protected-terms")).toEqual(["Privat"]);
    expect(sync.values.has("sync.excluded-domains")).toBe(false);
  });

  it("synchronisiert die Untertiteloption zusammen mit den Textoptionen", async () => {
    await saveSettings(
      settings({
        processAccessibleAttributes: false,
        processQuotedText: false,
        processSubtitles: true,
        syncCategoryIds: ["text-options"]
      })
    );

    expect(sync.values.get("sync.text-options")).toEqual({
      processAccessibleAttributes: false,
      processQuotedText: false,
      processSubtitles: true
    });

    await local.set({ settings: defaultSettings });
    const loaded = await loadSettings();
    expect(loaded.processSubtitles).toBe(true);
  });

  it("übernimmt die synchronisierte Auswahl und nur deren Werte auf einem weiteren Gerät", async () => {
    await local.set({
      settings: settings({
        enabled: true,
        protectedTerms: ["Lokal"],
        excludedDomains: ["local.example"]
      })
    });
    await sync.set({
      "sync.selection": ["activation", "protected-terms"],
      "sync.activation": false,
      "sync.protected-terms": ["Synchron"],
      "sync.excluded-domains": ["sync.example"]
    });

    const loaded = await loadSettings();
    expect(loaded.syncCategoryIds).toEqual([
      "activation",
      "protected-terms"
    ]);
    expect(loaded.enabled).toBe(false);
    expect(loaded.protectedTerms).toEqual(["Synchron"]);
    expect(loaded.excludedDomains).toEqual(["local.example"]);
  });

  it("bleibt bei nicht verfügbarer Browser-Synchronisierung lokal funktionsfähig", async () => {
    const localSettings = settings({
      enabled: false,
      protectedTerms: ["Lokal"],
      syncCategoryIds: ["activation"]
    });
    await local.set({ settings: localSettings });
    sync.failReads = true;

    expect(await loadSettings()).toEqual(localSettings);
  });

  it("entfernt abgewählte Kategorien aus dem Synchronisierungsspeicher", async () => {
    await sync.set({
      "sync.selection": ["activation", "protected-terms"],
      "sync.activation": false,
      "sync.protected-terms": ["Alt"]
    });

    await saveSettings(settings({ syncCategoryIds: ["activation"] }));

    expect(sync.values.get("sync.selection")).toEqual(["activation"]);
    expect(sync.values.has("sync.activation")).toBe(true);
    expect(sync.values.has("sync.protected-terms")).toBe(false);
  });

  it("meldet einen Synchronisierungsfehler, nachdem lokal gespeichert wurde", async () => {
    sync.failWrites = true;
    const value = settings({ syncCategoryIds: ["activation"] });

    await expect(saveSettings(value)).rejects.toThrow(/lokal gespeichert/u);
    expect(local.values.get("settings")).toEqual(value);
  });

  it("weist zu große Synchronisierungskategorien vor dem Speichern zurück", async () => {
    const replacements = Array.from({ length: 100 }, (_, index) => ({
      source: `Quelle ${index} ${"x".repeat(90)}`,
      replacement: `Ziel ${index} ${"y".repeat(180)}`
    }));

    await expect(
      saveSettings(
        settings({
          customReplacements: replacements,
          syncCategoryIds: ["custom-replacements"]
        })
      )
    ).rejects.toThrow(/sichere Limit/u);
    expect(local.values.size).toBe(0);
  });

  it("erholt sich beim Laden von transienten lokalen Speicherfehlern", async () => {
    vi.useFakeTimers();
    const value = settings({
      enabled: false,
      protectedTerms: ["Nach Retry"]
    });
    local.values.set("settings", value);
    local.remainingReadFailures = 2;

    const loading = loadSettingsWithRetry();
    await vi.runAllTimersAsync();

    await expect(loading).resolves.toEqual(value);
    expect(local.remainingReadFailures).toBe(0);
  });

  it("lädt nach einer Speicheränderung auch nach einem transienten Fehler neu", async () => {
    vi.useFakeTimers();
    const listener = vi.fn();
    const unsubscribe = subscribeToSettings(listener);
    const value = settings({
      enabled: false,
      protectedTerms: ["Aktualisiert"]
    });
    local.values.set("settings", value);
    local.remainingReadFailures = 1;

    for (const storageListener of storageListeners) {
      storageListener(
        { settings: { newValue: value } },
        "local"
      );
    }

    await vi.runAllTimersAsync();

    expect(listener).toHaveBeenCalledWith(value);
    unsubscribe();
    expect(storageListeners.size).toBe(0);
  });
});
