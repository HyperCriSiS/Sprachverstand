import type {ExtensionApi} from "../browser/api";
import {loadSettings} from "../settings/storage";
import {transformBody} from "./body-transform";
import {installDomWithoutBrowser} from "./dom-without-browser";
import {createOutlookApi} from "./extension-shim";
import {call, type OfficeGlobal} from "./office";
import {inlineImages} from "./reader";

// Das Lesefenster ist ein Office-Dialog. Dialoge kennen das Postfach nicht;
// die Schaltfläche wandelt die Nachricht um und schickt sie in Teilen hinüber,
// weil Outlook für Dialognachrichten keine Größe zusichert.
export const readWindowChunk = 30_000;

export interface ReadWindowContent {
  readonly title: string;
  readonly html: string;
}

export async function readWindowContent(Office: OfficeGlobal): Promise<ReadWindowContent> {
  const api = createOutlookApi(Office.context.roamingSettings, "de", [], () => undefined);
  (globalThis as {browser?: ExtensionApi}).browser = api;
  const item = Office.context.mailbox?.item;
  if (!item?.itemId) throw new Error("Keine Nachricht zum Lesen ausgewählt.");
  const original = await call<string>(callback => item.body.getAsync("html", {}, callback));
  const settings = await loadSettings();
  installDomWithoutBrowser();
  const result = settings.enabled ? transformBody(original, true, settings) : {body: original, count: 0};
  const german = (Office.context.displayLanguage ?? "de").toLowerCase().startsWith("de");
  const corrections = german ? `${result.count} ${result.count === 1 ? "Korrektur" : "Korrekturen"}`
    : `${result.count} ${result.count === 1 ? "correction" : "corrections"}`;
  return {title: `Sprachverstand: ${corrections}`, html: await inlineImages(item, result.body)};
}

// Öffnet das Lesefenster und meldet über done, wenn es geschlossen ist.
export function openReadWindow(Office: OfficeGlobal, url: string, content: ReadWindowContent, done: () => void): void {
  const text = JSON.stringify(content);
  const total = Math.max(1, Math.ceil(text.length / readWindowChunk));
  Office.context.ui!.displayDialogAsync(url, {height: 85, width: 60, displayInIframe: true}, result => {
    if (result.status !== "succeeded") {
      console.error("Sprachverstand: Das Lesefenster ließ sich nicht öffnen.", result.error);
      done();
      return;
    }
    const dialog = result.value;
    dialog.addEventHandler("dialogMessageReceived", ({message}) => {
      if (message !== "ready") return;
      for (let index = 0; index < total; index++) {
        dialog.messageChild?.(JSON.stringify({index, total,
          text: text.slice(index * readWindowChunk, (index + 1) * readWindowChunk)}));
      }
    });
    // Schließen durch den Nutzer (12006) und alle Fehler im Fenster.
    dialog.addEventHandler("dialogEventReceived", () => done());
  });
}
