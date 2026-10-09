import { afterEach, describe, expect, it, vi } from "vitest";
import type { ExtensionApi, StorageChange } from "../src/browser/api";
import { defaultSettings, type Settings } from "../src/settings/defaults";
import { loadSettings, saveSettings, subscribeToSettings } from "../src/settings/storage";

type Listener = (
  changes: Record<string, StorageChange>,
  areaName: string
) => void;

class EventStorage {
  readonly values = new Map<string, unknown>();
  delayMs = 0;
  failWrites = false;

  constructor(
    private readonly areaName: string,
    private readonly emit: (changes: Record<string, StorageChange>, area: string) => void
  ) {}

  async get(keys?: string | readonly string[] | Record<string, unknown>): Promise<Record<string, unknown>> {
    const selected = typeof keys === "string" ? [keys]
      : Array.isArray(keys) ? [...keys]
        : keys && typeof keys === "object" ? Object.keys(keys) : [...this.values.keys()];
    return Object.fromEntries(
      selected.filter((key) => this.values.has(key)).map((key) => [key, this.values.get(key)])
    );
  }

  async set(entries: Record<string, unknown>): Promise<void> {
    if (this.delayMs) {
      await new Promise<void>((resolve) => setTimeout(resolve, this.delayMs));
    }
    if (this.failWrites) {
      throw new Error("Sync nicht erreichbar");
    }
    const changes: Record<string, StorageChange> = {};
    for (const [key, value] of Object.entries(entries)) {
      changes[key] = { oldValue: this.values.get(key), newValue: value };
      this.values.set(key, value);
    }
    queueMicrotask(() => this.emit(changes, this.areaName));
  }

  async remove(keys: string | readonly string[]): Promise<void> {
    if (this.delayMs) {
      await new Promise<void>((resolve) => setTimeout(resolve, this.delayMs));
    }
    if (this.failWrites) {
      throw new Error("Sync nicht erreichbar");
    }
    const changes: Record<string, StorageChange> = {};
    for (const key of typeof keys === "string" ? [keys] : keys) {
      changes[key] = { oldValue: this.values.get(key), newValue: undefined };
      this.values.delete(key);
    }
    queueMicrotask(() => this.emit(changes, this.areaName));
  }
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Audit S1: lokale Settings bleiben bei Sync-Ereignissen autoritativ", () => {
  it("verliert lokale Änderungen nicht während verzögerter Sync-Schreibvorgänge", async () => {
    const listeners = new Set<Listener>();
    const emit = (changes: Record<string, StorageChange>, area: string) => {
      for (const listener of listeners) {
        listener(changes, area);
      }
    };
    const local = new EventStorage("local", emit);
    const sync = new EventStorage("sync", emit);
    const api = {
      storage: {
        local,
        sync,
        onChanged: {
          addListener: (listener: Listener) => listeners.add(listener),
          removeListener: (listener: Listener) => listeners.delete(listener)
        }
      }
    } as unknown as ExtensionApi;
    (globalThis as typeof globalThis & { browser?: ExtensionApi }).browser = api;

    await local.set({
      settings: {
        ...defaultSettings,
        protectedTerms: ["Alter Wert"],
        syncCategoryIds: ["protected-terms"]
      }
    });
    await sync.set({
      "sync.selection": ["protected-terms"],
      "sync.protected-terms": ["Alt synchronisiert"]
    });

    const empfangen: Settings[] = [];
    const unsubscribe = subscribeToSettings((settings) => empfangen.push(settings));
    sync.delayMs = 30;

    const neu: Settings = {
      ...defaultSettings,
      protectedTerms: ["Neu nur lokal"],
      syncCategoryIds: []
    };
    try {
      await saveSettings(neu);
      await new Promise<void>((resolve) => setTimeout(resolve, 5));
      expect(await loadSettings()).toEqual(neu);
      expect(empfangen.length).toBeGreaterThan(0);
      expect(empfangen.every((settings) =>
        settings.protectedTerms.includes("Neu nur lokal")
      )).toBe(true);
    } finally {
      unsubscribe();
    }
  });
});
