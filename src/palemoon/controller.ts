import { formatBadgeCount } from "../browser/badge";
import { defaultRules } from "../rules";
import { isDomainExcluded } from "../settings/domain";
import { normalizeSettings, type Settings } from "../settings/defaults";

declare const Components: {
  readonly utils: {
    import(path: string, scope?: Record<string, unknown>): Record<string, unknown>;
    Sandbox(
      principal: Window,
      options?: {
        readonly sandboxPrototype?: Window;
        readonly wantXrays?: boolean;
      }
    ): Record<string, unknown>;
    nukeSandbox?(sandbox: Record<string, unknown>): void;
  };
};

interface PaleMoonBrowser extends HTMLElement {
  readonly contentDocument?: Document;
}

interface PaleMoonTab extends HTMLElement {
  readonly linkedBrowser?: PaleMoonBrowser;
}

interface PaleMoonGBrowser extends HTMLElement {
  readonly browsers: readonly PaleMoonBrowser[];
  readonly selectedBrowser?: PaleMoonBrowser;
  selectedTab?: PaleMoonTab;
  readonly tabContainer?: EventTarget;
  addTab(url: string): PaleMoonTab;
}

interface PaleMoonServices {
  readonly prefs: {
    prefHasUserValue(name: string): boolean;
    getCharPref(name: string): string;
    getBoolPref(name: string): boolean;
    setBoolPref(name: string, value: boolean): void;
    addObserver(name: string, observer: PrefObserver, holdWeak: boolean): void;
    removeObserver(name: string, observer: PrefObserver): void;
  };
  readonly obs: {
    notifyObservers(subject: null, topic: string, data: string): void;
  };
  readonly scriptloader: {
    loadSubScript(
      url: string,
      target: Record<string, unknown>,
      charset?: string
    ): void;
  };
}

interface PrefObserver {
  observe(subject: unknown, topic: string, data: string): void;
}

interface PaleMoonContentRuntime {
  apply(settings: Settings): void;
  stop(restore?: boolean): void;
  getReplacementCount(): number;
}

interface ContentSandbox extends Record<string, unknown> {
  SprachverstandPaleMoonContent?: PaleMoonContentRuntime;
  __sprachverstandReportCount?: (count: number) => void;
}

interface GetCountMessage {
  readonly type: "sprachverstand.get-count";
  readonly tabId: number;
}

interface SetInspectedTabMessage {
  readonly type: "sprachverstand.set-inspected-tab";
  readonly tabId: number;
}

interface GetInspectedCountMessage {
  readonly type: "sprachverstand.get-inspected-count";
}

interface PaleMoonBridge {
  openPopup(): void;
  openOptions(): void;
  getActiveTabId(): number | undefined;
  getCountText(tabId?: number): string;
  handleMessage(message: unknown): unknown;
}

interface PaleMoonWindow extends Window {
  readonly gBrowser?: PaleMoonGBrowser;
  SprachverstandPaleMoon?: PaleMoonBridge;
  openDialog(url: string, name: string, features: string): Window | null;
}

interface PaleMoonChromeDocument extends Document {
  persist(id: string, attribute: string): void;
}

const windowObject = window as unknown as PaleMoonWindow;
const chromeDocument = document as PaleMoonChromeDocument;
const importedServices = Components.utils.import(
  "resource://gre/modules/Services.jsm",
  {}
) as { readonly Services?: PaleMoonServices };
const importedServiceValue = importedServices.Services;

if (!importedServiceValue) {
  throw new Error("Pale-Moon-Dienste konnten nicht geladen werden.");
}

const Services: PaleMoonServices = importedServiceValue;
const settingsPreference = "extensions.sprachverstand.storage.local.settings";
const toolbarInstalledPreference =
  "extensions.sprachverstand.palemoon.toolbarInstalled";
const runtimeMessageTopic = "sprachverstand-palemoon-runtime-message";
const toolbarButtonId = "sprachverstand-toolbar-button";
const contentRuntimeUrl = "chrome://sprachverstand/content/palemoon/content.js";

const sandboxesByDocument = new Map<Document, ContentSandbox>();
const countsByTabId = new Map<number, number>();
const tabIdsByBrowser = new WeakMap<PaleMoonBrowser, number>();
let nextTabId = 1;
let inspectedTabId: number | undefined;
let started = false;

function loadSettings(): Settings {
  if (!Services.prefs.prefHasUserValue(settingsPreference)) {
    return normalizeSettings(undefined);
  }

  try {
    return normalizeSettings(
      JSON.parse(Services.prefs.getCharPref(settingsPreference))
    );
  } catch {
    return normalizeSettings(undefined);
  }
}

function isEligibleDocument(documentToCheck: Document): boolean {
  const protocol = documentToCheck.location?.protocol;
  return protocol === "http:" || protocol === "https:" || protocol === "file:";
}

function shouldRun(documentToCheck: Document, settings: Settings): boolean {
  return (
    settings.enabled &&
    defaultRules.length > 0 &&
    isEligibleDocument(documentToCheck) &&
    !isDomainExcluded(
      documentToCheck.location?.hostname ?? "",
      settings.excludedDomains
    )
  );
}

function browserForDocument(documentToFind: Document): PaleMoonBrowser | undefined {
  return windowObject.gBrowser?.browsers.find(
    (browser) => browser.contentDocument === documentToFind
  );
}

function tabIdForBrowser(browser: PaleMoonBrowser): number {
  const existing = tabIdsByBrowser.get(browser);
  if (existing !== undefined) {
    return existing;
  }

  const created = nextTabId;
  nextTabId += 1;
  tabIdsByBrowser.set(browser, created);
  return created;
}

function activeTabId(): number | undefined {
  const browser = windowObject.gBrowser?.selectedBrowser;
  return browser ? tabIdForBrowser(browser) : undefined;
}

function notifyRuntimeMessage(message: unknown): void {
  Services.obs.notifyObservers(
    null,
    runtimeMessageTopic,
    JSON.stringify(message)
  );
}

function updateToolbarTooltip(): void {
  const button = document.getElementById(toolbarButtonId);
  if (!button) {
    return;
  }

  const tabId = activeTabId();
  const count = tabId === undefined ? 0 : countsByTabId.get(tabId) ?? 0;
  const text = formatBadgeCount(count);
  button.setAttribute(
    "tooltiptext",
    text ? `Sprachverstand – ${text} Korrekturen` : "Sprachverstand"
  );
  button.setAttribute("sprachverstand-count", text);
}

function reportCount(documentToReport: Document, count: number): void {
  const browser = browserForDocument(documentToReport);
  if (!browser) {
    return;
  }

  const tabId = tabIdForBrowser(browser);
  const normalizedCount = Math.max(0, Math.trunc(count));
  countsByTabId.set(tabId, normalizedCount);
  updateToolbarTooltip();
  notifyRuntimeMessage({
    type: "sprachverstand.count-updated",
    tabId,
    text: formatBadgeCount(normalizedCount) || "0"
  });
}

function destroySandbox(documentToStop: Document, restore: boolean): void {
  const sandbox = sandboxesByDocument.get(documentToStop);
  if (!sandbox) {
    return;
  }

  try {
    sandbox.SprachverstandPaleMoonContent?.stop(restore);
  } catch {
    // The document can already be tearing down during navigation.
  }

  sandboxesByDocument.delete(documentToStop);
  Components.utils.nukeSandbox?.(sandbox);
}

function createSandbox(documentToProcess: Document): ContentSandbox | undefined {
  const contentWindow = documentToProcess.defaultView;
  if (!contentWindow) {
    return undefined;
  }

  const sandbox = Components.utils.Sandbox(contentWindow, {
    sandboxPrototype: contentWindow,
    wantXrays: true
  }) as ContentSandbox;

  sandbox.__sprachverstandReportCount = (count: number) => {
    reportCount(documentToProcess, count);
  };

  Services.scriptloader.loadSubScript(contentRuntimeUrl, sandbox, "UTF-8");
  if (!sandbox.SprachverstandPaleMoonContent) {
    Components.utils.nukeSandbox?.(sandbox);
    throw new Error("Pale-Moon-Inhaltsruntime konnte nicht geladen werden.");
  }

  sandboxesByDocument.set(documentToProcess, sandbox);
  return sandbox;
}

function applySettingsToDocument(
  documentToProcess: Document,
  settings = loadSettings()
): void {
  if (!shouldRun(documentToProcess, settings)) {
    destroySandbox(documentToProcess, true);
    if (browserForDocument(documentToProcess)) {
      reportCount(documentToProcess, 0);
    }
    return;
  }

  const sandbox =
    sandboxesByDocument.get(documentToProcess) ??
    createSandbox(documentToProcess);
  sandbox?.SprachverstandPaleMoonContent?.apply(settings);
}

function refreshOpenDocuments(): void {
  const settings = loadSettings();

  for (const browser of windowObject.gBrowser?.browsers ?? []) {
    const contentDocument = browser.contentDocument;
    if (contentDocument) {
      applySettingsToDocument(contentDocument, settings);
    }
  }

  updateToolbarTooltip();
}

function eventDocument(event: Event): Document | undefined {
  const candidate =
    (event as Event & { readonly originalTarget?: EventTarget | null })
      .originalTarget ?? event.target;

  if (!candidate || typeof candidate !== "object") {
    return undefined;
  }

  const nodeType = (candidate as { readonly nodeType?: unknown }).nodeType;
  return nodeType === 9 ? (candidate as unknown as Document) : undefined;
}

function handleDocumentLoaded(event: Event): void {
  const loadedDocument = eventDocument(event);
  if (loadedDocument) {
    applySettingsToDocument(loadedDocument);
  }
}

function handlePageHide(event: Event): void {
  const hiddenDocument = eventDocument(event);
  if (hiddenDocument) {
    destroySandbox(hiddenDocument, false);
  }
}

function handleTabClose(event: Event): void {
  const tab = event.target as PaleMoonTab | null;
  const browser = tab?.linkedBrowser;
  if (!browser) {
    return;
  }

  const tabId = tabIdsByBrowser.get(browser);
  if (tabId !== undefined) {
    countsByTabId.delete(tabId);
    if (inspectedTabId === tabId) {
      inspectedTabId = undefined;
    }
  }
  updateToolbarTooltip();
}

function ensureToolbarButtonInstalled(): void {
  if (Services.prefs.prefHasUserValue(toolbarInstalledPreference)) {
    try {
      if (Services.prefs.getBoolPref(toolbarInstalledPreference)) {
        return;
      }
    } catch {
      // Fall through and try installing the button once.
    }
  }

  const navigationBar = document.getElementById("nav-bar") as
    | (HTMLElement & {
        readonly currentSet?: string;
        insertItem?(id: string, before?: Element | null): void;
      })
    | null;

  if (!navigationBar?.insertItem) {
    return;
  }

  const currentSet =
    navigationBar.currentSet ?? navigationBar.getAttribute("currentset") ?? "";
  if (!currentSet.split(",").includes(toolbarButtonId)) {
    navigationBar.insertItem(toolbarButtonId, null);
    const updatedSet =
      navigationBar.currentSet ?? navigationBar.getAttribute("currentset") ?? "";
    navigationBar.setAttribute("currentset", updatedSet);
    chromeDocument.persist("nav-bar", "currentset");
  }

  Services.prefs.setBoolPref(toolbarInstalledPreference, true);
}

function openPopup(): void {
  windowObject.openDialog(
    "chrome://sprachverstand/content/popup/popup.html",
    "sprachverstand-popup",
    "chrome,dialog=no,resizable=yes,centerscreen,width=420,height=720"
  );
}

function openOptions(): void {
  const browser = windowObject.gBrowser;
  if (!browser) {
    return;
  }

  const tab = browser.addTab(
    "chrome://sprachverstand/content/options/options.html"
  );
  browser.selectedTab = tab;
}

function countText(tabId?: number): string {
  const resolvedTabId = tabId ?? activeTabId();
  if (resolvedTabId === undefined) {
    return "0";
  }
  return formatBadgeCount(countsByTabId.get(resolvedTabId) ?? 0) || "0";
}

function isGetCountMessage(message: unknown): message is GetCountMessage {
  return (
    Boolean(message) &&
    typeof message === "object" &&
    (message as Partial<GetCountMessage>).type === "sprachverstand.get-count" &&
    typeof (message as Partial<GetCountMessage>).tabId === "number"
  );
}

function isSetInspectedTabMessage(
  message: unknown
): message is SetInspectedTabMessage {
  return (
    Boolean(message) &&
    typeof message === "object" &&
    (message as Partial<SetInspectedTabMessage>).type ===
      "sprachverstand.set-inspected-tab" &&
    typeof (message as Partial<SetInspectedTabMessage>).tabId === "number"
  );
}

function isGetInspectedCountMessage(
  message: unknown
): message is GetInspectedCountMessage {
  return (
    Boolean(message) &&
    typeof message === "object" &&
    (message as Partial<GetInspectedCountMessage>).type ===
      "sprachverstand.get-inspected-count"
  );
}

const bridge: PaleMoonBridge = {
  openPopup,
  openOptions,
  getActiveTabId: activeTabId,
  getCountText: countText,
  handleMessage(message) {
    if (isGetCountMessage(message)) {
      return { text: countText(message.tabId) };
    }

    if (isSetInspectedTabMessage(message)) {
      inspectedTabId = message.tabId;
      return undefined;
    }

    if (isGetInspectedCountMessage(message)) {
      const tabId = inspectedTabId ?? activeTabId();
      return {
        ...(tabId === undefined ? {} : { tabId }),
        text: countText(tabId)
      };
    }

    return undefined;
  }
};

const prefObserver: PrefObserver = {
  observe(_subject, topic, data) {
    if (topic === "nsPref:changed" && data === settingsPreference) {
      refreshOpenDocuments();
    }
  }
};

function shutdown(): void {
  if (!started) {
    return;
  }
  started = false;

  Services.prefs.removeObserver(settingsPreference, prefObserver);
  windowObject.gBrowser?.removeEventListener(
    "DOMContentLoaded",
    handleDocumentLoaded,
    true
  );
  windowObject.gBrowser?.removeEventListener("pagehide", handlePageHide, true);
  windowObject.gBrowser?.tabContainer?.removeEventListener(
    "TabSelect",
    updateToolbarTooltip as EventListener
  );
  windowObject.gBrowser?.tabContainer?.removeEventListener(
    "TabClose",
    handleTabClose
  );

  for (const contentDocument of [...sandboxesByDocument.keys()]) {
    destroySandbox(contentDocument, true);
  }

  delete windowObject.SprachverstandPaleMoon;
}

function start(): void {
  if (started || !windowObject.gBrowser) {
    return;
  }
  started = true;

  windowObject.SprachverstandPaleMoon = bridge;
  Services.prefs.addObserver(settingsPreference, prefObserver, false);
  windowObject.gBrowser.addEventListener(
    "DOMContentLoaded",
    handleDocumentLoaded,
    true
  );
  windowObject.gBrowser.addEventListener("pagehide", handlePageHide, true);
  windowObject.gBrowser.tabContainer?.addEventListener(
    "TabSelect",
    updateToolbarTooltip as EventListener
  );
  windowObject.gBrowser.tabContainer?.addEventListener(
    "TabClose",
    handleTabClose
  );
  window.addEventListener("unload", shutdown, { once: true });

  ensureToolbarButtonInstalled();
  refreshOpenDocuments();
}

if (document.readyState === "complete") {
  start();
} else {
  window.addEventListener("load", start, { once: true });
}
