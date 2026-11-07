// Minimaler Ausschnitt von Office.js, den das Outlook-Add-in verwendet.
export interface AsyncResult<T> {
  readonly status: string;
  readonly value: T;
  readonly error?: {readonly message: string; readonly code?: number; readonly name?: string};
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
  readonly attachments?: readonly {readonly id: string; readonly isInline: boolean; readonly contentId?: string;
    readonly contentType?: string}[];
  getAttachmentContentAsync?(id: string, options: Record<string, unknown>,
    callback: AsyncCallback<{content: string; format: string}>): void;
  readonly display?: {readonly body?: {setAsync(data: string, options: Record<string, unknown>, callback: AsyncCallback<void>): void}};
  getComposeTypeAsync?(callback: AsyncCallback<{composeType: string; coercionType: string}>): void;
}

export interface OfficeDialog {
  addEventHandler(type: string, handler: (arg: {readonly message?: string; readonly error?: number}) => void): void;
  messageChild?(message: string): void;
  close(): void;
}

export interface OfficeGlobal {
  onReady(): Promise<unknown>;
  readonly context: {
    readonly displayLanguage?: string;
    readonly ui?: {
      displayDialogAsync(url: string, options: Record<string, unknown>, callback: AsyncCallback<OfficeDialog>): void;
      addHandlerAsync(type: string, handler: (arg: {readonly message: string}) => void, callback?: AsyncCallback<void>): void;
      messageParent(message: string): void;
    };
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
    result.status === "succeeded" ? resolve(result.value)
      // Code und Name helfen bei der Fehlersuche in Outlook.
      : reject(Object.assign(new Error(result.error?.message ?? "Office.js"), {code: result.error?.code, name: result.error?.name ?? "Error"}))));
}
