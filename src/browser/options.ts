import type { ExtensionApi } from "./api";

type OptionsPageApi = {
  readonly runtime: Pick<
    ExtensionApi["runtime"],
    "openOptionsPage" | "sendMessage"
  >;
  readonly tabs: Pick<ExtensionApi["tabs"], "query">;
};

export async function openOptionsPageInForeground(
  api: OptionsPageApi
): Promise<void> {
  const [activeTab] = await api.tabs.query({
    active: true,
    currentWindow: true
  });

  if (typeof activeTab?.id === "number") {
    await api.runtime.sendMessage({
      type: "sprachverstand.set-inspected-tab",
      tabId: activeTab.id
    });
  }

  await api.runtime.openOptionsPage();
}
