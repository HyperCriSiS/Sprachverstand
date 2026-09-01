import type { ExtensionApi } from "./api";

type OptionsPageApi = {
  readonly runtime: Pick<ExtensionApi["runtime"], "getURL">;
  readonly tabs: Pick<ExtensionApi["tabs"], "create">;
};

function isValidTabId(tabId: number | undefined): tabId is number {
  return (
    typeof tabId === "number" &&
    Number.isInteger(tabId) &&
    tabId >= 0
  );
}

export function parseOptionsPageTabId(search: string): number | undefined {
  const rawTabId = new URLSearchParams(search).get("tabId");
  if (rawTabId === null || rawTabId.trim() === "") {
    return undefined;
  }

  const tabId = Number(rawTabId);
  return isValidTabId(tabId) ? tabId : undefined;
}

export async function openOptionsPageInForeground(
  api: OptionsPageApi,
  tabId?: number
): Promise<void> {
  const baseUrl = api.runtime.getURL("options/options.html");
  const url = isValidTabId(tabId)
    ? `${baseUrl}?tabId=${encodeURIComponent(String(tabId))}`
    : baseUrl;

  await api.tabs.create({
    url,
    active: true
  });
}
