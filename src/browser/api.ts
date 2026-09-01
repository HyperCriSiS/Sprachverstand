export interface StorageChange {
  readonly oldValue?: unknown;
  readonly newValue?: unknown;
}

export interface ExtensionTab {
  readonly id?: number;
}

export interface MessageSender {
  readonly tab?: ExtensionTab;
}

export type MessageListener = (
  message: unknown,
  sender: MessageSender
) => unknown | Promise<unknown>;

export interface StorageArea {
  get(
    keys?: string | readonly string[] | Record<string, unknown>
  ): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(keys: string | readonly string[]): Promise<void>;
}

export interface ExtensionApi {
  readonly i18n: {
    getMessage(
      messageName: string,
      substitutions?: string | readonly string[]
    ): string;
    getUILanguage(): string;
  };
  readonly storage: {
    readonly sync: StorageArea;
    readonly local: StorageArea;
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
    getURL(path: string): string;
    sendMessage(message: unknown): Promise<unknown>;
    readonly onMessage: {
      addListener(listener: MessageListener): void;
      removeListener(listener: MessageListener): void;
    };
  };
  readonly action: {
    setBadgeText(details: {
      readonly text: string;
      readonly tabId?: number;
    }): Promise<void> | void;
    getBadgeText(details: { readonly tabId?: number }): Promise<string>;
    setBadgeBackgroundColor(details: {
      readonly color: string;
      readonly tabId?: number;
    }): Promise<void> | void;
  };
  readonly tabs: {
    create(createProperties: {
      readonly url: string;
      readonly active?: boolean;
    }): Promise<ExtensionTab>;
    query(queryInfo: {
      readonly active: boolean;
      readonly currentWindow: boolean;
    }): Promise<ExtensionTab[]>;
    readonly onRemoved: {
      addListener(listener: (tabId: number) => void): void;
      removeListener(listener: (tabId: number) => void): void;
    };
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
