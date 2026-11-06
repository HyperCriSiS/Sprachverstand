import {temporaryIntl} from "./runtime-globals";
import {DOMParser as Parser} from "linkedom";

if (temporaryIntl) delete (globalThis as {Intl?: unknown}).Intl;

// Der Kern ruft Timer über defaultView auf, bei linkedom ein Proxy auf
// globalThis. Eingebaute Timer verlangen globalThis als this. Fehlen sie,
// genügen solche, die nie auslösen: Eine Nachricht wird einmal synchron
// umgewandelt und der Kern danach beendet. Beides gilt nur im Dokument.
function timer(name: string): (...args: unknown[]) => unknown {
  const native = (globalThis as Record<string, unknown>)[name] as ((...args: unknown[]) => unknown) | undefined;
  return native ? (...args) => native.apply(globalThis, args) : () => 0;
}

const escapeAttribute = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/\u00a0/g, "&nbsp;").replace(/"/g, "&quot;");

// Liest HTML wie ein Browser, soweit es der DOM-Kern und Outlook brauchen.
class OutlookParser {
  parseFromString(markup: string) {
    // Word-Bedingungen außerhalb von Kommentaren (`<![if !vml]>`) macht der
    // Browser zu Kommentaren; linkedom würde sie verwerfen. Inhalte von
    // Kommentaren bleiben unberührt.
    const html = markup.replace(/<!--[\s\S]*?-->|<!\[(if [^\]]*|endif)\]>/gi,
      (match, condition?: string) => condition ? `<!--[${condition}]-->` : match);
    const doc = new Parser().parseFromString(/<html[\s>]/i.test(html) ? html : `<html><body>${html}</body></html>`, "text/html",
      {setTimeout: timer("setTimeout"), clearTimeout: timer("clearTimeout")});
    // htmlparser2 legt je Entität einen eigenen Textknoten an (`jede*r&nbsp;…`).
    doc.documentElement.normalize();
    return doc;
  }
}

// Ereignisse laufen im klassischen Outlook ohne DOM. linkedom stellt dort den
// Teil des DOM bereit, den der DOM-Kern braucht. So gilt dieselbe Umwandlung
// wie in Thunderbird, auch über Tags hinweg (`Lehrer*<b>innen</b>`).
export function installDomWithoutBrowser(): void {
  if (typeof DOMParser !== "undefined") return;
  const scope = globalThis as Record<string, unknown>;
  const doc = new Parser().parseFromString("<html></html>", "text/html");
  const view = doc.defaultView as unknown as Record<string, unknown>;
  // Der Kern prüft Knoten mit instanceof; die Klassen müssen die von linkedom sein.
  for (const name of ["Node", "Element", "Text", "ShadowRoot"]) scope[name] = view[name];
  scope.NodeFilter = {SHOW_ALL: 0xffffffff, SHOW_ELEMENT: 1, SHOW_TEXT: 4, SHOW_COMMENT: 128,
    FILTER_ACCEPT: 1, FILTER_REJECT: 2, FILTER_SKIP: 3};
  // linkedom maskiert Attributwerte in HTML-Dokumenten nicht; ein rohes `&` in
  // Links könnte Word als Entität lesen (`&region=` als „®ion=“).
  const attribute = Object.getPrototypeOf(doc.createAttribute("x")) as {toString(this: Attr): string};
  const serialize = attribute.toString;
  attribute.toString = function (this: Attr) {
    return this.value ? `${this.name}="${escapeAttribute(this.value)}"` : serialize.call(this);
  };
  scope.DOMParser = OutlookParser;
}
