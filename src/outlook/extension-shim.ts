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

// Bildet storage.sync und storage.local auf die Roaming-Einstellungen des
// Postfachs ab. Beide Bereiche liegen getrennt unter eigenem Präfix.
function roamingArea(settings: RoamingSettings, area: string, notify: ChangeListener): StorageArea {
  const key = (name: string) => `${area}:${name}`;
  const read = (name: string) => {
    const value = settings.get(key(name));
    return value === undefined || value === null ? undefined : JSON.parse(String(value)) as unknown;
  };
  async function write(update: (changes: Record<string, StorageChange>) => void): Promise<void> {
    const changes: Record<string, StorageChange> = {};
    update(changes);
    await call<void>(callback => settings.saveAsync(callback));
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
        changes[name] = {oldValue: read(name), newValue};
        settings.set(key(name), JSON.stringify(newValue));
      }
    }),
    remove: keys => write(changes => {
      for (const name of typeof keys === "string" ? [keys] : keys) {
        const oldValue = read(name);
        if (oldValue === undefined) continue;
        changes[name] = {oldValue};
        settings.remove(key(name));
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
  navigate: (url: string) => void): OutlookApi {
  const storageListeners = new Set<ChangeListener>();
  const messageListeners = new Set<MessageListener>();
  const notify: ChangeListener = (changes, area) => {
    for (const listener of [...storageListeners]) listener(changes, area);
  };
  const root = new URL("../", globalThis.location?.href ?? "https://localhost/x/");
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
      sync: roamingArea(roaming, "sync", notify),
      local: roamingArea(roaming, "local", notify),
      onChanged: {addListener: listener => storageListeners.add(listener),
        removeListener: listener => storageListeners.delete(listener)}
    },
    runtime: {
      id: "outlook",
      openOptionsPage: () => navigate(new URL("options/options.html", root).toString()),
      getURL: path => new URL(path.replace(/^\//, ""), root).toString(),
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
