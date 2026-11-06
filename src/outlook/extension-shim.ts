import type {ExtensionApi, MessageListener, StorageArea, StorageChange} from "../browser/api";
import {call, type RoamingSettings} from "./office";
import locales from "../../config/locales.json";

type Messages = Record<string, {readonly message: string; readonly placeholders?: Record<string, {readonly content: string}>}>;
type ChangeListener = (changes: Record<string, StorageChange>, area: string) => void;

export const inspectedTabId = 1;

const availableLocales = new Set(locales.map(locale => locale.code));

// Wählt vorhandene Ordner unter _locales: exakt (pt_BR), sonst Grundsprache (fr).
export function localeCandidates(language: string): string[] {
  const [base = "de", region] = language.replace(/-/g, "_").split("_");
  return [...new Set([region ? `${base.toLowerCase()}_${region.toUpperCase()}` : "", base.toLowerCase(), "de"])]
    .filter(locale => availableLocales.has(locale));
}

export function formatMessage(entry: Messages[string] | undefined, substitutions?: string | readonly string[]): string {
  if (!entry) return "";
  const values = substitutions === undefined ? [] : typeof substitutions === "string" ? [substitutions] : substitutions;
  return entry.message
    .replace(/\$([A-Za-z0-9_@]+)\$/g, (_, name: string) => entry.placeholders?.[name.toLowerCase()]?.content ?? "")
    .replace(/\$(\$|\d)/g, (_, token: string) => token === "$" ? "$" : values[Number(token) - 1] ?? "");
}

export interface RawStore {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
  remove(key: string): void;
  save(): Promise<void>;
}

// storage.sync: Roaming-Einstellungen des Postfachs (gemeinsam rund 32 KB).
export function roamingStore(settings: RoamingSettings): RawStore {
  return {
    get: key => {
      const value = settings.get(`sync:${key}`);
      return value === undefined || value === null ? undefined : String(value);
    },
    set: (key, value) => settings.set(`sync:${key}`, value),
    remove: key => settings.remove(`sync:${key}`),
    save: () => call<void>(callback => settings.saveAsync(callback))
  };
}

export const localPrefix = "sprachverstand:";

// storage.local bleibt auf dem Gerät. Ohne localStorage (Ereignislaufzeit des
// klassischen Outlook) gibt es nur einen leeren Speicher für diesen Lauf.
export function deviceStore(storage: Storage | null = globalThis.localStorage ?? null): RawStore {
  const memory = new Map<string, string>();
  return {
    get: key => (storage ? storage.getItem(localPrefix + key) : memory.get(key)) ?? undefined,
    set: (key, value) => storage ? storage.setItem(localPrefix + key, value) : memory.set(key, value),
    remove: key => storage ? storage.removeItem(localPrefix + key) : memory.delete(key),
    save: async () => undefined
  };
}

const parse = (value: string | undefined) => value === undefined ? undefined : JSON.parse(value) as unknown;

function storageArea(store: RawStore, area: string, notify: ChangeListener): StorageArea {
  const read = (name: string) => parse(store.get(name));
  // Schlägt das Speichern fehl (etwa über 32 KB), gilt wieder der alte Stand.
  async function write(update: (changes: Record<string, StorageChange>) => void): Promise<void> {
    const changes: Record<string, StorageChange> = {};
    update(changes);
    try {
      await store.save();
    } catch (error) {
      for (const [name, change] of Object.entries(changes)) {
        if (change.oldValue === undefined) store.remove(name);
        else store.set(name, JSON.stringify(change.oldValue));
      }
      throw error;
    }
    if (Object.keys(changes).length) notify(changes, area);
  }
  return {
    async get(keys) {
      const names = keys === undefined || keys === null ? [] : typeof keys === "string" ? [keys]
        : Array.isArray(keys) ? keys : Object.keys(keys);
      const defaults = keys && typeof keys === "object" && !Array.isArray(keys) ? keys as Record<string, unknown> : {};
      const result: Record<string, unknown> = {};
      for (const name of names) {
        const value = read(name);
        if (value !== undefined) result[name] = value;
        else if (name in defaults) result[name] = defaults[name];
      }
      return result;
    },
    set: items => write(changes => {
      for (const [name, newValue] of Object.entries(items)) {
        changes[name] = {oldValue: changes[name]?.oldValue ?? read(name), newValue};
        store.set(name, JSON.stringify(newValue));
      }
    }),
    remove: keys => write(changes => {
      for (const name of typeof keys === "string" ? [keys] : keys) {
        const oldValue = read(name);
        if (oldValue === undefined) continue;
        changes[name] = {oldValue};
        store.remove(name);
      }
    })
  };
}

export interface OutlookApi extends ExtensionApi {
  readonly permissions: {
    contains(details: unknown): Promise<boolean>;
    request(details: unknown): Promise<boolean>;
    readonly onAdded: {addListener(listener: () => void): void};
    readonly onRemoved: {addListener(listener: () => void): void};
  };
}

// Stellt die von Popup, Einstellungen und Thunderbird-Option genutzte
// WebExtension-API im Seitenbereich bereit. Nachrichten bleiben in der Seite:
// der Seitenbereich ist zugleich Hintergrund, Popup und Nachrichtenansicht.
export function createOutlookApi(roaming: RoamingSettings, language: string, catalogs: readonly Messages[],
  navigate: (url: string) => void, local: RawStore = deviceStore()): OutlookApi {
  const storageListeners = new Set<ChangeListener>();
  const messageListeners = new Set<MessageListener>();
  const notify: ChangeListener = (changes, area) => {
    for (const listener of [...storageListeners]) listener(changes, area);
  };
  // Änderungen aus einem anderen Outlook-Fenster derselben Herkunft.
  globalThis.addEventListener?.("storage", event => {
    const {key, oldValue, newValue} = event as StorageEvent;
    if (!key?.startsWith(localPrefix)) return;
    notify({[key.slice(localPrefix.length)]: {oldValue: parse(oldValue ?? undefined), newValue: parse(newValue ?? undefined)}},
      "local");
  });
  // Die Ereignislaufzeit des klassischen Outlook kennt location und URL nicht.
  const root = () => new URL("../", globalThis.location.href);
  async function dispatch(message: unknown): Promise<unknown> {
    let response: unknown;
    for (const listener of [...messageListeners]) {
      const result = await listener(message, {tab: {id: inspectedTabId}, url: globalThis.location?.href});
      if (response === undefined && result !== undefined) response = result;
    }
    return response;
  }
  const noopEvent = {addListener() {}, removeListener() {}};
  const tab = {id: inspectedTabId};
  return {
    i18n: {
      getMessage: (name, substitutions) =>
        formatMessage(catalogs.map(catalog => catalog[name]).find(Boolean), substitutions),
      getUILanguage: () => language
    },
    storage: {
      sync: storageArea(roamingStore(roaming), "sync", notify),
      local: storageArea(local, "local", notify),
      onChanged: {addListener: listener => storageListeners.add(listener),
        removeListener: listener => storageListeners.delete(listener)}
    },
    runtime: {
      id: "outlook",
      openOptionsPage: () => navigate(new URL("options/options.html", root()).toString()),
      getURL: path => new URL(path.replace(/^\//, ""), root()).toString(),
      sendMessage: message => Promise.resolve().then(() => dispatch(message)),
      onMessage: {addListener: listener => messageListeners.add(listener),
        removeListener: listener => messageListeners.delete(listener)}
    },
    action: {setBadgeText() {}, getBadgeText: async () => "", setBadgeBackgroundColor() {}},
    tabs: {
      get: async () => tab,
      create: async ({url}) => {navigate(url); return tab;},
      query: async () => [tab],
      update: async () => tab,
      sendMessage: (_tabId, message) => Promise.resolve().then(() => dispatch(message)),
      onUpdated: noopEvent,
      onRemoved: noopEvent
    },
    permissions: {contains: async () => true, request: async () => true, onAdded: noopEvent, onRemoved: noopEvent}
  };
}

async function loadCatalogs(language: string): Promise<Messages[]> {
  const root = new URL("../_locales/", location.href);
  const catalogs = await Promise.all(localeCandidates(language).map(async locale => {
    try {
      const response = await fetch(new URL(`${locale}/messages.json`, root));
      return response.ok ? await response.json() as Messages : undefined;
    } catch {
      return undefined;
    }
  }));
  return catalogs.filter((catalog): catalog is Messages => Boolean(catalog));
}

// Wartet auf Office.js, lädt die Sprachdateien und setzt globalThis.browser.
export async function installOutlookApi(): Promise<OutlookApi> {
  const Office = (globalThis as {Office?: import("./office").OfficeGlobal}).Office!;
  await Office.onReady();
  const language = Office.context.displayLanguage || navigator.language || "de";
  const api = createOutlookApi(Office.context.roamingSettings, language, await loadCatalogs(language),
    url => location.assign(url));
  (globalThis as {browser?: ExtensionApi}).browser = api;
  return api;
}
