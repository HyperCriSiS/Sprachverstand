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
        addListener: (listener: StorageListener) => {
          storageListeners.add(listener);
        },
        removeListener: (listener: StorageListener) => {
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

  it("behält lokale Werte bei expliziter Synchronisierungsabwahl", async () => {
    await local.set({
      settings: settings({
        protectedTerms: ["Alter Wert"],
        syncCategoryIds: ["protected-terms"]
      })
    });
    await sync.set({
      "sync.selection": ["protected-terms"],
      "sync.protected-terms": ["Veralteter Sync-Wert"]
    });

    const neu = settings({
      protectedTerms: ["Nur lokal"],
      syncCategoryIds: []
    });
    await saveSettings(neu);

    expect(await loadSettings()).toEqual(neu);
    expect(local.values.get("settings.sync-local-override")).toBe(true);
    expect(sync.values.get("sync.selection")).toEqual([]);
  });

  it("behält lokale Änderungen trotz fehlgeschlagener Sync-Schreiboperation", async () => {
    await local.set({
      settings: settings({
        protectedTerms: ["Alt"],
        syncCategoryIds: ["protected-terms"]
      })
    });
    await sync.set({
      "sync.selection": ["protected-terms"],
      "sync.protected-terms": ["Veraltet"]
    });

    sync.failWrites = true;
    const neu = settings({
      protectedTerms: ["Neu und lokal"],
      syncCategoryIds: []
    });
    await expect(saveSettings(neu)).rejects.toThrow(/lokal gespeichert/u);

    expect(await loadSettings()).toEqual(neu);
    expect(local.values.get("settings.sync-local-override")).toBe(true);
  });

  it("übernimmt nach bestätigtem Sync-Abschluss wieder entfernte Änderungen", async () => {
    const neu = settings({
      protectedTerms: ["Synchronisiert"],
      syncCategoryIds: ["protected-terms"]
    });
    await saveSettings(neu);
    expect(local.values.has("settings.sync-local-override")).toBe(false);

    await sync.set({ "sync.protected-terms": ["Von anderem Gerät"] });
    const loaded = await loadSettings();
    expect(loaded.protectedTerms).toEqual(["Von anderem Gerät"]);
  });

  it("speichert eine zu große Synchronisierungskategorie lokal und lässt ihren Sync-Stand unverändert", async () => {
    const replacements = Array.from({ length: 100 }, (_, index) => ({
      source: `Quelle ${index} ${"x".repeat(90)}`,
      replacement: `Ziel ${index} ${"y".repeat(180)}`
    }));
    await sync.set({
      "sync.selection": ["custom-replacements"],
      "sync.custom-replacements": [{ source: "Alt", replacement: "Neu" }]
    });
    const value = settings({
      customReplacements: replacements,
      syncCategoryIds: ["custom-replacements"]
    });

    await expect(saveSettings(value)).rejects.toThrow(/lokal gespeichert.*sichere Limit/u);
    expect(local.values.get("settings")).toEqual(value);
    expect(local.values.get("settings.sync-local-override")).toBe(true);
    expect(sync.values.get("sync.custom-replacements")).toEqual([{ source: "Alt", replacement: "Neu" }]);
    expect(await loadSettings()).toEqual(value);
  });

  it("wendet die Migration auf die Regelgruppenliste eines älteren Geräts an", async () => {
    const olderGroups = defaultSettings.enabledRuleGroupIds.filter((id) => id !== "loanword-person-terms");
    await local.set({ settings: settings({ syncCategoryIds: ["rule-groups"] }) });
    await sync.set({
      "sync.selection": ["rule-groups"],
      // Pre-revision format: a plain array without the writing revision.
      "sync.rule-groups": olderGroups
    });

    const loaded = await loadSettings();
    expect(loaded.enabledRuleGroupIds).toContain("loanword-person-terms");

    await sync.set({ "sync.rule-groups.revision": 10 });
    expect((await loadSettings()).enabledRuleGroupIds).toContain("loanword-person-terms");

    // A current device that deliberately disabled the group is respected.
    await sync.set({ "sync.rule-groups.revision": 11 });
    expect((await loadSettings()).enabledRuleGroupIds).not.toContain("loanword-person-terms");

    await saveSettings({ ...loaded, enabled: false });
    expect(sync.values.get("sync.rule-groups")).toEqual(loaded.enabledRuleGroupIds);
    expect(sync.values.get("sync.rule-groups.revision")).toBe(11);

    await saveSettings({ ...loaded, syncCategoryIds: ["activation"] });
    expect(sync.values.has("sync.rule-groups.revision")).toBe(false);
  });

  it("behält lokale Textoptionen, die ein älteres Gerät nicht kennt", async () => {
    await local.set({ settings: settings({ processSubtitles: true, syncCategoryIds: ["text-options"] }) });
    await sync.set({
      "sync.selection": ["text-options"],
      "sync.text-options": { processAccessibleAttributes: false, processQuotedText: true }
    });

    const loaded = await loadSettings();
    expect(loaded.processSubtitles).toBe(true);
    expect(loaded.processAccessibleAttributes).toBe(false);
  });

  it("schreibt nur geänderte Synchronisierungsschlüssel", async () => {
    const value = settings({
      enabled: false,
      protectedTerms: ["Privat"],
      syncCategoryIds: ["activation", "protected-terms", "rule-groups"]
    });
    await saveSettings(value);
    const setSpy = vi.spyOn(sync, "set");
    const removeSpy = vi.spyOn(sync, "remove");

    await saveSettings({ ...value, enabled: true });
    expect(setSpy).toHaveBeenCalledTimes(1);
    expect(setSpy.mock.calls[0]?.[0]).toEqual({ "sync.activation": true });
    expect(removeSpy).not.toHaveBeenCalled();

    await saveSettings({ ...value, enabled: true });
    expect(setSpy).toHaveBeenCalledTimes(1);
  });

  it("bietet den lokalen Stand nach einer fehlgeschlagenen Synchronisierung beim Laden erneut an", async () => {
    const value = settings({ protectedTerms: ["Lokal"], syncCategoryIds: ["protected-terms"] });
    sync.failWrites = true;
    await expect(saveSettings(value)).rejects.toThrow(/lokal gespeichert/u);
    expect(local.values.get("settings.sync-local-override")).toBe(true);

    sync.failWrites = false;
    expect(await loadSettings()).toEqual(value);
    for (let index = 0; index < 20 && local.values.has("settings.sync-local-override"); index++) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    expect(sync.values.get("sync.protected-terms")).toEqual(["Lokal"]);
    expect(local.values.has("settings.sync-local-override")).toBe(false);
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