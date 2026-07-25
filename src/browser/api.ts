export interface StorageChange {
  readonly oldValue?: unknown;
  readonly newValue?: unknown;
}

export interface ExtensionApi {
  readonly storage: {
    readonly sync: {
      get(
        keys?: string | readonly string[] | Record<string, unknown>
      ): Promise<Record<string, unknown>>;
      set(items: Record<string, unknown>): Promise<void>;
    };
    readonly onChanged: {
      addListener(
        listener: (
          changes: Record<string, StorageChange>,
          areaName: string
        ) => void
      ): void;
      removeListener(
        listener: (
          changes: Record<string, StorageChange>,
          areaName: string
        ) => void
      ): void;
    };
  };
  readonly runtime: {
    openOptionsPage(): Promise<void> | void;
  };
}

type ExtensionGlobal = typeof globalThis & {
  readonly browser?: ExtensionApi;
  readonly chrome?: ExtensionApi;
};

export function getExtensionApi(): ExtensionApi {
  const extensionGlobal = globalThis as ExtensionGlobal;
  const api = extensionGlobal.browser ?? extensionGlobal.chrome;

  if (!api) {
    throw new Error("WebExtension-API ist nicht verfügbar.");
  }

  return api;
}
