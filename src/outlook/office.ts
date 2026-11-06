// Minimaler Ausschnitt von Office.js, den das Outlook-Add-in verwendet.
export interface AsyncResult<T> {
  readonly status: string;
  readonly value: T;
  readonly error?: {readonly message: string};
}
export type AsyncCallback<T> = (result: AsyncResult<T>) => void;

export interface RoamingSettings {
  get(name: string): unknown;
  set(name: string, value: unknown): void;
  remove(name: string): void;
  saveAsync(callback?: AsyncCallback<void>): void;
}

export interface OutlookBody {
  getTypeAsync(callback: AsyncCallback<string>): void;
  getAsync(coercionType: string, options: Record<string, unknown>, callback: AsyncCallback<string>): void;
  setAsync?(data: string, options: Record<string, unknown>, callback: AsyncCallback<void>): void;
}

export interface OutlookItem {
  readonly itemType?: string;
  readonly itemId?: string;
  readonly body: OutlookBody;
  readonly display?: {readonly body?: {setAsync(data: string, options: Record<string, unknown>, callback: AsyncCallback<void>): void}};
  getComposeTypeAsync?(callback: AsyncCallback<{composeType: string; coercionType: string}>): void;
}

export interface OfficeGlobal {
  onReady(): Promise<unknown>;
  readonly context: {
    readonly displayLanguage?: string;
    readonly roamingSettings: RoamingSettings;
    readonly mailbox?: {
      readonly item?: OutlookItem | null;
      addHandlerAsync(eventType: string, handler: () => void, callback?: AsyncCallback<void>): void;
    };
  };
  readonly MailboxEnums?: {readonly BodyMode?: {readonly FullBody?: unknown}};
  readonly actions?:{associate(name: string, handler: (event: {completed(options?: unknown): void}) => void): void};
}

export function office(): OfficeGlobal {
  return (globalThis as {Office?: OfficeGlobal}).Office!;
}

// Office.js meldet Ergebnisse über Callbacks; hier als Promise.
export function call<T>(start: (callback: AsyncCallback<T>) => void): Promise<T> {
  return new Promise((resolve, reject) => start(result =>
    result.status === "succeeded" ? resolve(result.value) : reject(new Error(result.error?.message ?? "Office.js"))));
}
