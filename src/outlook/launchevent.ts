import type {ExtensionApi} from "../browser/api";
import {loadSettings} from "../settings/storage";
import {transformBody} from "./body-transform";
import {composeSettingKey} from "./compose-option";
import {createOutlookApi} from "./extension-shim";
import {call, office, type OfficeGlobal} from "./office";

// Gegenstück zu compose-background.ts der Thunderbird-Ausgabe: Antworten und
// Weiterleitungen werden einmal beim Öffnen korrigiert, beim Senden nicht.
export async function correctComposeOnOpen(Office: OfficeGlobal): Promise<void> {
  const api = createOutlookApi(Office.context.roamingSettings, "de", [], () => undefined);
  (globalThis as {browser?: ExtensionApi}).browser = api;
  if ((await api.storage.local.get(composeSettingKey))[composeSettingKey] !== true) return;
  const item = Office.context.mailbox?.item;
  if (!item?.getComposeTypeAsync || !item.body.setAsync) return;
  const {composeType} = await call<{composeType: string}>(callback => item.getComposeTypeAsync!(callback));
  if (composeType !== "reply" && composeType !== "forward") return;
  const settings = await loadSettings();
  if (!settings.enabled) return;
  const type = await call<string>(callback => item.body.getTypeAsync(callback));
  const html = type === "html";
  // Klassisches Outlook führt Ereignisse ohne DOM aus; HTML bleibt dort unverändert.
  if (html && typeof DOMParser === "undefined") return;
  // Ganzer Verlauf statt nur der eigenen Antwort (Unterhaltungsansicht).
  const bodyMode = Office.MailboxEnums?.BodyMode?.FullBody;
  const body = await call<string>(callback => item.body.getAsync(type, bodyMode === undefined ? {} : {bodyMode}, callback));
  const result = transformBody(body, html, settings);
  if (!result.count) return;
  await call<void>(callback => item.body.setAsync!(result.body, {coercionType: type}, callback));
}

function onNewMessageComposeHandler(event: {completed(options?: unknown): void}): void {
  void correctComposeOnOpen(office())
    .catch(() => {console.error("Sprachverstand: Korrektur beim Öffnen fehlgeschlagen.");})
    .finally(() => event.completed());
}

office()?.actions?.associate("onNewMessageComposeHandler", onNewMessageComposeHandler);
