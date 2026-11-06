import {installOutlookApi} from "./extension-shim";
import {connectReader, offlinePreview} from "./reader";
import {hideSubtitleOption} from "./platform-ui";
import {office} from "./office";

// Seitenbereich = Popup der Thunderbird-Ausgabe plus Nachrichtenverarbeitung.
const api = await installOutlookApi();
// Das Popup schließt sich nach „Erweiterte Einstellungen“; der Seitenbereich
// navigiert stattdessen zur Einstellungsseite und muss offen bleiben.
window.close = () => undefined;
// @ts-expect-error Reines Browser-Skript ohne Typdeklaration.
await import("../../static/i18n-bootstrap.js");
hideSubtitleOption();

const preview = document.createElement("section");
preview.className = "outlook-preview";
preview.hidden = true;
const heading = document.createElement("h2");
heading.textContent = api.i18n.getUILanguage().toLowerCase().startsWith("de") ? "Umgewandelte Nachricht" : "Converted message";
const frame = document.createElement("iframe");
// Ohne Skripte und ohne Zugriff auf diese Seite.
frame.setAttribute("sandbox", "");
frame.title = heading.textContent;
preview.append(heading, frame);
document.querySelector("#open-replacements")?.after(preview);

connectReader(api, office(), {showPreview(html) {
  preview.hidden = html === undefined;
  frame.srcdoc = html === undefined ? "" : offlinePreview(html);
}});
await import("../popup");
