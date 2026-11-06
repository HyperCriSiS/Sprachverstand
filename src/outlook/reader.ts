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

// Die Fassung im Seitenbereich lädt nichts nach: externe Bilder, Schriften
// und Stile könnten sonst dem Absender das Öffnen verraten.
export function offlinePreview(html: string): string {
  return `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'">${html}`;
}

// Eingebettete Bilder verweisen per cid: auf Anhänge, die die Fassung im
// Seitenbereich nicht kennt. Sie werden als data:-URL eingesetzt (Mailbox 1.8
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
      if (displayed) await display(item, displayed.original);
      displayed = undefined;
      view.showPreview(undefined);
      publish(0, []);
      return;
    }
    const result = transformBody(original, true, settings);
    if (current !== generation) return;
    let replaced = false;
    if (item.display?.body && (result.count || displayed)) {
      // Vorschau-API: Lehnt Outlook sie ab, bleibt die Fassung im Seitenbereich.
      replaced = await display(item, result.body).then(() => true, () => false);
      if (current !== generation) return;
      displayed = replaced && result.count ? {item, original} : undefined;
    }
    const preview = result.count && !replaced ? await inlineImages(item, result.body) : undefined;
    if (current !== generation) return;
    view.showPreview(preview);
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
