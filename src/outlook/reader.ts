import {formatBadgeCount} from "../browser/badge";
import type {ReplacementSummaryEntry} from "../core/replacement-summary";
import {subscribeToSettings} from "../settings/storage";
import type {Settings} from "../settings/defaults";
import {transformBody} from "./body-transform";
import {inspectedTabId, type OutlookApi} from "./extension-shim";
import {call, type OfficeGlobal, type OutlookItem} from "./office";

export interface ReaderView {
  // Ersatz, wenn Outlook die angezeigte Nachricht nicht ersetzen kann.
  showPreview(html: string | undefined): void;
}

// Entspricht dem Thunderbird-Nachrichtenskript: Die ausgewählte Nachricht wird
// beim Öffnen umgewandelt, gespeichert wird nichts. Outlook ersetzt dazu nur
// die Anzeige (item.display.body); die Nachricht im Postfach bleibt unverändert.
export function connectReader(api: OutlookApi, Office: OfficeGlobal, view: ReaderView): () => Promise<void> {
  let count = 0;
  let replacements: readonly ReplacementSummaryEntry[] = [];
  let settings: Settings | undefined;
  let generation = 0;
  let displayed: {item: OutlookItem; original: string} | undefined;

  function publish(nextCount: number, nextReplacements: readonly ReplacementSummaryEntry[]): void {
    count = nextCount;
    replacements = nextReplacements;
    void api.runtime.sendMessage({type: "sprachverstand.state-updated", tabId: inspectedTabId,
      text: formatBadgeCount(count) || "0", count, replacements, hostname: ""});
  }

  const display = (item: OutlookItem, html: string) =>
    call<void>(callback => item.display!.body!.setAsync(html, {coercionType: "html"}, callback));

  async function process(): Promise<void> {
    const current = ++generation;
    const item = Office.context.mailbox?.item;
    // Im Verfassen hat body.setAsync; dort gilt die Korrektur beim Öffnen.
    if (displayed && displayed.item !== item) displayed = undefined;
    if (!item || !settings || typeof item.body.setAsync === "function") {
      view.showPreview(undefined);
      publish(0, []);
      return;
    }
    const original = await call<string>(callback => item.body.getAsync("html", {}, callback));
    if (current !== generation) return;
    if (!settings.enabled) {
      if (displayed) await display(item, displayed.original);
      displayed = undefined;
      view.showPreview(undefined);
      publish(0, []);
      return;
    }
    const result = transformBody(original, true, settings);
    if (current !== generation) return;
    if (item.display?.body) {
      if (result.count || displayed) await display(item, result.body);
      displayed = result.count ? {item, original} : undefined;
      view.showPreview(undefined);
    } else {
      view.showPreview(result.count ? result.body : undefined);
    }
    publish(result.count, result.replacements);
  }

  const run = () => process().catch((error: unknown) => {
    console.error("Sprachverstand: Die Nachricht konnte nicht umgewandelt werden.", error);
  });

  api.runtime.onMessage.addListener(message => {
    const type = (message as {type?: unknown} | null)?.type;
    if (type === "sprachverstand.get-replacement-state" || type === "sprachverstand.get-count") {
      return {count, replacements, text: formatBadgeCount(count) || "0", hostname: ""};
    }
    if (type === "sprachverstand.get-inspected-count") {
      return {tabId: inspectedTabId, text: formatBadgeCount(count) || "0"};
    }
    return undefined;
  });
  Office.context.mailbox?.addHandlerAsync("olkItemSelectedChanged", () => void run());
  subscribeToSettings(next => {
    settings = next;
    return run();
  }, {initial: true});
  return run;
}
