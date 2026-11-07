import type {ExtensionApi} from "../browser/api";
import {loadSettings} from "../settings/storage";
import {transformBody} from "./body-transform";
import {composeSettingKey} from "./compose-option";
import {installDomWithoutBrowser} from "./dom-without-browser";
import {createOutlookApi} from "./extension-shim";
import {call, office, type OfficeGlobal} from "./office";

// Gegenstück zu compose-background.ts der Thunderbird-Ausgabe: Antworten und
// Weiterleitungen werden einmal beim Öffnen korrigiert, beim Senden nicht.
// Eine Hinweisleiste im Antwortfenster nennt das Ergebnis oder den Grund,
// warum nichts korrigiert wurde. Ohne Option und ohne Genderformen bleibt sie aus.
export async function correctComposeOnOpen(Office: OfficeGlobal): Promise<void> {
  const german = (Office.context.displayLanguage ?? "de").toLowerCase().startsWith("de");
  let message: string | undefined;
  try {
    const result = await correctCompose(Office);
    if (result === "changed") {
      message = german ? "Outlook hat den Text beim Öffnen geändert (etwa durch die Signatur); nichts wurde korrigiert."
        : "Outlook changed the text while opening (for example the signature); nothing was corrected.";
    } else if (result) {
      message = german ? `${result} ${result === 1 ? "Korrektur" : "Korrekturen"} im Verlauf.`
        : `${result} ${result === 1 ? "correction" : "corrections"} in the conversation.`;
    }
  } catch (error) {
    console.error("Sprachverstand: Korrektur beim Öffnen fehlgeschlagen.", error);
    message = `${german ? "Korrektur fehlgeschlagen" : "Correction failed"}: ${error instanceof Error ? error.message : String(error)}`;
  }
  const notifications = Office.context.mailbox?.item?.notificationMessages;
  if (!message || !notifications) return;
  // Höchstens 150 Zeichen; das Symbol stammt aus dem Manifest.
  await call<void>(callback => notifications.replaceAsync("sprachverstand", {type: "informationalMessage",
    message: `Sprachverstand: ${message}`.slice(0, 150), icon: "Icon.16", persistent: false}, callback))
    .catch(error => {console.error("Sprachverstand: Hinweis ließ sich nicht anzeigen.", error);});
}

// Liefert die Zahl der Korrekturen oder "changed", wenn Outlook den Text
// zwischen Lesen und Schreiben geändert hat.
async function correctCompose(Office: OfficeGlobal): Promise<number | "changed" | undefined> {
  const api = createOutlookApi(Office.context.roamingSettings, "de", [], () => undefined);
  (globalThis as {browser?: ExtensionApi}).browser = api;
  if ((await api.storage.sync.get(composeSettingKey))[composeSettingKey] !== true) return undefined;
  const item = Office.context.mailbox?.item;
  if (!item?.getComposeTypeAsync || !item.body.setAsync) return undefined;
  const {composeType} = await call<{composeType: string}>(callback => item.getComposeTypeAsync!(callback));
  if (composeType !== "reply" && composeType !== "forward") return undefined;
  const settings = await loadSettings();
  if (!settings.enabled) return undefined;
  const type = await call<string>(callback => item.body.getTypeAsync(callback));
  // Ganzer Verlauf statt nur der eigenen Antwort (Unterhaltungsansicht).
  const bodyMode = Office.MailboxEnums?.BodyMode?.FullBody;
  const read = () => call<string>(callback => item.body.getAsync(type, bodyMode === undefined ? {} : {bodyMode}, callback));
  const body = await read();
  installDomWithoutBrowser();
  const result = transformBody(body, type === "html", settings);
  if (!result.count) return undefined;
  // Wie in Thunderbird: Hat Outlook (Signatur) oder der Nutzer den Text
  // inzwischen geändert, bleibt er unverändert.
  if (await read() !== body) return "changed";
  await call<void>(callback => item.body.setAsync!(result.body, {coercionType: type}, callback));
  return result.count;
}

function onNewMessageComposeHandler(event: {completed(options?: unknown): void}): void {
  void correctComposeOnOpen(office()).finally(() => event.completed());
}

office()?.actions?.associate("onNewMessageComposeHandler", onNewMessageComposeHandler);
