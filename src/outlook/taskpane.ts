import {installOutlookApi} from "./extension-shim";
import {connectReader} from "./reader";
import {openReadWindow} from "./read-window";
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

// Die neue Outlook-App ersetzt die angezeigte Nachricht nicht. Dann öffnet
// dieser Button die umgewandelte Nachricht in einem eigenen Fenster.
const german = api.i18n.getUILanguage().toLowerCase().startsWith("de");
const read = document.createElement("button");
read.type = "button";
read.className = "page-summary popup-section outlook-read";
read.hidden = true;
const label = document.createElement("strong");
label.textContent = german ? "Korrigiert lesen" : "Read corrected";
const action = document.createElement("span");
action.className = "page-summary-action";
action.textContent = german ? "Öffnen " : "Open ";
const chevron = document.createElement("span");
chevron.className = "chevron-next";
chevron.setAttribute("aria-hidden", "true");
action.append(chevron);
read.append(label, action);
const status = document.createElement("p");
status.className = "outlook-read-status";
status.setAttribute("role", "status");
document.querySelector("#open-replacements")?.after(read, status);

let corrected: string | undefined;
read.addEventListener("click", () => {
  status.textContent = "";
  openReadWindow(office(), new URL("../read-window.html", location.href).toString(),
    {title: german ? "Sprachverstand: korrigierte Nachricht" : "Sprachverstand: corrected message", html: corrected ?? ""},
    error => {
      if (!error) return;
      console.error("Sprachverstand: Das Lesefenster ließ sich nicht öffnen.", error);
      status.textContent = `${german ? "Das Fenster ließ sich nicht öffnen" : "The window could not be opened"}: ${error}`;
    });
});
connectReader(api, office(), {showPreview(html) {
  corrected = html;
  read.hidden = html === undefined;
  if (html === undefined) status.textContent = "";
}});
await import("../popup");
