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


// Eingebettete Bilder verweisen per cid: auf Anhänge, die das Lesefenster
// nicht kennt. Sie werden als data:-URL eingesetzt (Mailbox 1.8
// und 1.16); fehlt etwas davon, bleibt der Verweis.
export async function inlineImages(item: OutlookItem, html: string): Promise<string> {
  // Verweise sind unabhängig von Groß- und Kleinschreibung und dürfen
  // %-kodiert sein (RFC 2392).
  const key = (id: string) => {
    try {
      return decodeURIComponent(id).replace(/^<|>$/g, "").toLowerCase();
    } catch {
      return id.toLowerCase();
    }
  };
  const reference = /cid:([^"'\s)>]+)/gi;
  const inline = new Map((item.attachments ?? []).filter(attachment => attachment.isInline && attachment.contentId)
    .map(attachment => [key(attachment.contentId!), attachment] as const));
  const images = new Map<string, string | undefined>();
  for (const [, id] of html.matchAll(reference)) {
    const attachment = inline.get(key(id!));
    if (!attachment || !item.getAttachmentContentAsync || images.has(key(id!))) continue;
    const content = await call<{content: string; format: string}>(callback =>
      item.getAttachmentContentAsync!(attachment.id, {}, callback)).catch(() => undefined);
    images.set(key(id!), content?.format === "base64"
      ? `data:${attachment.contentType ?? "image/png"};base64,${content.content}` : undefined);
  }
  return html.replace(reference, (match, id: string) => images.get(key(id)) ?? match);
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
    // Nur gelesene Nachrichten haben eine itemId; im Verfassen gilt die
    // Korrektur beim Öffnen.
    if (displayed && displayed.item !== item) displayed = undefined;
    if (!item?.itemId || !settings) {
      view.showPreview(undefined);
      publish(0, []);
      return;
    }
    const original = await call<string>(callback => item.body.getAsync("html", {}, callback));
    if (current !== generation) return;
    if (!settings.enabled) {
      view.showPreview(undefined);
      publish(0, []);
      const restore = displayed?.original;
      displayed = undefined;
      if (restore !== undefined) await display(item, restore);
      return;
    }
    const result = transformBody(original, true, settings);
    publish(result.count, result.replacements);
    // Das Lesefenster steht sofort bereit. Die neue Outlook-App
    // beantwortet die Vorschau-API erst nach etwa einer Minute mit einem Fehler.
    const preview = result.count ? await inlineImages(item, result.body) : undefined;
    if (current !== generation) return;
    view.showPreview(preview);
    if (item.display?.body && (result.count || displayed)) {
      const replaced = await display(item, result.body).then(() => true, (error: unknown) => {
        console.warn("Sprachverstand: Outlook hat die Anzeige nicht ersetzt.", error);
        return false;
      });
      if (current !== generation) return;
      displayed = replaced && result.count ? {item, original} : undefined;
      if (replaced) view.showPreview(undefined);
    }
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
