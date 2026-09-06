import type { ExtensionApi } from "./api";

type OptionsPageApi = {
  readonly runtime: Pick<ExtensionApi["runtime"], "openOptionsPage">;
};

export async function openOptionsPageInForeground(
  api: OptionsPageApi
): Promise<void> {
  await api.runtime.openOptionsPage();
}
