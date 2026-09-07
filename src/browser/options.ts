import type { ExtensionApi } from "./api";

type OptionsPageApi = {
  readonly runtime: Pick<
    ExtensionApi["runtime"],
    "openOptionsPage" | "sendMessage"
  >;
  readonly tabs: Pick<ExtensionApi["tabs"], "query">;
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

export async function openOptionsPageInForeground(
  api: OptionsPageApi
): Promise<void> {
  const [activeTab] = await api.tabs.query({
    active: true,
    currentWindow: true
  });

  if (isValidTabId(activeTab?.id)) {
    await api.runtime.sendMessage({
      type: "sprachverstand.set-inspected-tab",
      tabId: activeTab.id
    });
  }

  // Die semantische Options-API überlässt dem Browser die korrekte Auswahl und
  // Fokussierung der Optionsseite; sie bleibt auch für den Legacy-Adapter stabil.
  await api.runtime.openOptionsPage();
}
