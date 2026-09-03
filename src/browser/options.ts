import type { ExtensionApi } from "./api";

type OptionsPageApi = {
  readonly runtime: Pick<ExtensionApi["runtime"], "getURL">;
  readonly tabs: Pick<ExtensionApi["tabs"], "create">;
};

export async function openOptionsPageInForeground(
  api: OptionsPageApi
): Promise<void> {
  await api.tabs.create({
    url: api.runtime.getURL("options/options.html"),
    active: true
  });
}
