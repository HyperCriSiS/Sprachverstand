import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultSettings } from "../src/settings/defaults";
import { loadSettings, subscribeToSettings } from "../src/settings/storage";
import type { StorageChange } from "../src/browser/api";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

type StorageListener = (changes: Record<string, StorageChange>, area: string) => void;
let local: Record<string, unknown>;
let syncRead: ReturnType<typeof vi.fn>;
let listeners: Set<StorageListener>;
const flush = async () => { for (let i = 0; i < 12; i += 1) await Promise.resolve(); };
const change = () => { for (const listener of listeners) listener({ settings: { newValue: local.settings } }, "local"); };

beforeEach(() => {
  local = { settings: { ...defaultSettings } };
  syncRead = vi.fn().mockResolvedValue({});
  listeners = new Set();
  vi.stubGlobal("browser", { storage: {
    local: { get: vi.fn(async () => local) },
    sync: { get: syncRead },
    onChanged: {
      addListener: (listener: StorageListener) => listeners.add(listener),
      removeListener: (listener: StorageListener) => listeners.delete(listener)
    }
  } });
});
afterEach(() => vi.unstubAllGlobals());

describe("settings read latency and ordering", () => {
  it("returns authoritative local settings while sync is still pending", async () => {
    const sync = deferred<Record<string, unknown>>();
    syncRead.mockReturnValue(sync.promise);
    local = { settings: { ...defaultSettings, enabled: false }, "settings.sync-local-override": true };
    const applied = vi.fn();
    const loading = loadSettings().then(applied);
    await flush();
    const completedBeforeSync = applied.mock.calls.length;
    sync.resolve({ "sync.selection": ["activation"], "sync.activation": true });
    await loading;
    expect(completedBeforeSync).toBe(1);
    expect(applied).toHaveBeenCalledWith(local.settings);
  });

  it("still waits for selected synchronized values without a local override", async () => {
    const sync = deferred<Record<string, unknown>>();
    syncRead.mockReturnValue(sync.promise);
    const applied = vi.fn();
    const loading = loadSettings().then(applied);
    await flush();
    expect(syncRead).toHaveBeenCalledOnce();
    expect(applied).not.toHaveBeenCalled();
    sync.resolve({ "sync.selection": ["activation"], "sync.activation": false });
    await loading;
    expect(applied.mock.calls[0]?.[0].enabled).toBe(false);
  });

  it("does not deliver an older read after a newer storage change", async () => {
    const older = deferred<Record<string, unknown>>();
    syncRead.mockReturnValueOnce(older.promise);
    const applied = vi.fn();
    const unsubscribe = subscribeToSettings(applied);
    change();
    await flush();
    local = { settings: { ...defaultSettings, enabled: false }, "settings.sync-local-override": true };
    change();
    await flush();
    older.resolve({ "sync.selection": ["activation"], "sync.activation": true });
    await flush();
    unsubscribe();
    expect(applied).toHaveBeenCalledTimes(1);
    expect(applied.mock.calls[0]?.[0].enabled).toBe(false);
  });

  it("does not deliver pending reads after unsubscribing", async () => {
    const sync = deferred<Record<string, unknown>>();
    syncRead.mockReturnValue(sync.promise);
    const applied = vi.fn();
    const unsubscribe = subscribeToSettings(applied);
    change();
    await flush();
    unsubscribe();
    sync.resolve({});
    await flush();
    expect(applied).not.toHaveBeenCalled();
  });

  it("registers before the initial read and preserves changes during startup", async () => {
    const initial = deferred<Record<string, unknown>>();
    syncRead.mockImplementationOnce(() => {
      expect(listeners.size).toBe(1);
      return initial.promise;
    });
    const applied = vi.fn();
    const unsubscribe = subscribeToSettings(applied, { initial: true });
    await flush();
    local = { settings: { ...defaultSettings, enabled: false }, "settings.sync-local-override": true };
    change();
    await flush();
    initial.resolve({ "sync.selection": ["activation"], "sync.activation": true });
    await flush();
    unsubscribe();
    expect(applied).toHaveBeenCalledTimes(1);
    expect(applied.mock.calls[0]?.[0].enabled).toBe(false);
  });

  it("handles a late sync rejection after returning local settings", async () => {
    const sync = deferred<Record<string, unknown>>();
    syncRead.mockReturnValue(sync.promise);
    local["settings.sync-local-override"] = true;
    const loading = loadSettings();
    await flush();
    sync.reject(new Error("sync unavailable"));
    await expect(loading).resolves.toEqual(local.settings);
    await flush();
  });
});
