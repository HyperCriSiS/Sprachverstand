import type { ExtensionApi } from "./api";

type OptionsPageApi = {
  readonly runtime: Pick<ExtensionApi["runtime"], "getURL">;
  readonly tabs: Pick<ExtensionApi["tabs"], "create" | "query">;
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
  const baseUrl = api.runtime.getURL("options/options.html");
  const url = isValidTabId(activeTab?.id)
    ? `${baseUrl}?tabId=${encodeURIComponent(String(activeTab.id))}`
    : baseUrl;

  await api.tabs.create({
    url,
    active: true
  });
}
