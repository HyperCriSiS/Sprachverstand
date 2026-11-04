import type {ExtensionApi} from "../browser/api";

export const composeSettingKey = "thunderbird.correct-replies-on-open";
export const composeScriptId = "sprachverstand-compose-on-open";
export interface ComposeDetails {
  readonly type?: string;
  readonly isPlainText?: boolean;
  readonly isModified?: boolean;
  readonly body?: string;
  readonly plainTextBody?: string;
}
export type ThunderbirdComposeApi = ExtensionApi & {
  readonly permissions: {
    contains(details: {permissions: string[]}): Promise<boolean>;
    request(details: {permissions: string[]}): Promise<boolean>;
    readonly onAdded: {addListener(listener: () => void): void};
    readonly onRemoved: {addListener(listener: () => void): void};
  };
  readonly scripting: {readonly compose: {
    getRegisteredScripts(filter: {ids: string[]}): Promise<readonly {id: string}[]>;
    registerScripts(scripts: {id: string; js: string[]}[]): Promise<void>;
    unregisterScripts(filter: {ids: string[]}): Promise<void>;
  }};
  readonly compose: {
    getComposeDetails(tabId: number): Promise<ComposeDetails>;
    setComposeDetails(tabId: number, details: {body?: string; plainTextBody?: string}): Promise<void>;
  };
};
