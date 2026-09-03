import { beforeEach, describe, expect, it } from "vitest";
import type { ExtensionApi, StorageChange } from "../src/browser/api";
import { defaultSettings, type Settings } from "../src/settings/defaults";
import { loadSettings, saveSettings } from "../src/settings/storage";

class MemoryStorageArea {
  readonly values = new Map<string, unknown>();
  failReads = false;
  failWrites = false;

  async get(
    keys?: string | readonly string[] | Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    if (this.failReads) {
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

let local: MemoryStorageArea;
let sync: MemoryStorageArea;

beforeEach(() => {
  local = new MemoryStorageArea();
  sync = new MemoryStorageArea();
  const listeners = new Set<(
    changes: Record<string, StorageChange>,
    areaName: string
  ) => void>();
  const api = {
    storage: {
      local,
      sync,
      onChanged: {
        addListener: (
          listener: typeof listeners extends Set<infer T> ? T : never
        ) => {
          listeners.add(listener);
        },
        removeListener: (
          listener: typeof listeners extends Set<infer T> ? T : never
        ) => {
          listeners.delete(listener);
        }
      }
    }
  } as unknown as ExtensionApi;
  (globalThis as typeof globalThis & { browser?: ExtensionApi }).browser = api;
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

  it("synchronisiert Arbeitsmodus und Domainliste gemeinsam", async () => {
    await saveSettings(
      settings({
        excludedDomains: ["allowed.example"],
        domainListMode: "include",
        syncCategoryIds: ["excluded-domains"]
      })
    );

    expect(sync.values.get("sync.excluded-domains")).toEqual({
      mode: "include",
      domains: ["allowed.example"]
    });

    await local.set({ settings: defaultSettings });
    const loaded = await loadSettings();
    expect(loaded.domainListMode).toBe("include");
    expect(loaded.excludedDomains).toEqual(["allowed.example"]);
  });

  it("liest ältere synchronisierte Domain-Arrays weiterhin als Ausschlussliste", async () => {
    await local.set({ settings: defaultSettings });
    await sync.set({
      "sync.selection": ["excluded-domains"],
      "sync.excluded-domains": ["legacy.example"]
    });

    const loaded = await loadSettings();
    expect(loaded.domainListMode).toBe("exclude");
    expect(loaded.excludedDomains).toEqual(["legacy.example"]);
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
});
