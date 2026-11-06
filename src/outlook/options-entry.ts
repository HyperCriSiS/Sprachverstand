import {installOutlookApi} from "./extension-shim";
import {hideSubtitleOption} from "./platform-ui";
import {addComposeOption} from "./compose-option";

// Die Einstellungsseite öffnet im selben Seitenbereich; „Zurück“ führt zum Popup.
const api = await installOutlookApi();
// @ts-expect-error Reines Browser-Skript ohne Typdeklaration.
await import("../../static/i18n-bootstrap.js");
hideSubtitleOption();
addComposeOption(api);

const back = document.createElement("a");
back.href = "../popup/popup.html";
back.className = "outlook-back";
back.dataset.i18n = "back";
back.textContent = "Zurück";
document.querySelector(".page-header")?.before(back);
await import("../options");
