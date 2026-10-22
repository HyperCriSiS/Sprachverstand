import type { ExtensionApi } from "./api";

type OptionsPageApi = {
  readonly runtime: Pick<
    ExtensionApi["runtime"],
    "getURL" | "sendMessage"
  >;
  readonly tabs: Pick<ExtensionApi["tabs"], "create" | "query" | "update">;
};

function isValidTabId(tabId: number | undefined): tabId is number {
  return (
    typeof tabId === "number" &&
    Number.isInteger(tabId) &&
    tabId >= 0
  );
}

export function parseOptionsPageTabId(
  urlOrSearch: string | undefined
): number | undefined {
  if (!urlOrSearch) {
    return undefined;
  }

  try {
    const searchParams = urlOrSearch.startsWith("?")
      ? new URLSearchParams(urlOrSearch)
      : new URL(urlOrSearch).searchParams;
    const rawTabId = searchParams.get("tabId");
    if (rawTabId === null || rawTabId.trim() === "") {
      return undefined;
    }

    const tabId = Number(rawTabId);
    return isValidTabId(tabId) ? tabId : undefined;
  } catch {
    return undefined;
  }
}

function optionsPageUrl(api: OptionsPageApi, tabId: number | undefined): string {
  const url = new URL(api.runtime.getURL("options/options.html"));
  if (isValidTabId(tabId)) {
    url.searchParams.set("tabId", String(tabId));
  }
  return url.toString();
}

export async function openOptionsPageInForeground(
  api: OptionsPageApi
): Promise<void> {
  const [activeTab] = await api.tabs.query({
    active: true,
    currentWindow: true
  });

  const inspectedTabId = isValidTabId(activeTab?.id) ? activeTab.id : undefined;

  if (inspectedTabId !== undefined) {
    await api.runtime.sendMessage({
      type: "sprachverstand.set-inspected-tab",
      tabId: inspectedTabId
    });
  }

  // Firefox Android kann runtime.openOptionsPage() hinter dem Vollbild-Popup
  // öffnen. Ein explizit aktiver Tab plus anschließendes Schließen des Popups
  // hält die Einstellungen sichtbar im Vordergrund.
  const createdTab = await api.tabs.create({
    url: optionsPageUrl(api, inspectedTabId),
    active: true
  });

  if (isValidTabId(createdTab.id)) {
    await api.tabs.update(createdTab.id, { active: true });
  }
}
