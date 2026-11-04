import {getExtensionApi} from "../browser/api";
import {composeSettingKey, type ThunderbirdComposeApi} from "./compose-api";

const api = getExtensionApi() as ThunderbirdComposeApi;
const de = api.i18n.getUILanguage().toLowerCase().startsWith("de");
const label = document.createElement("label");
label.className = "checkbox-row";
const input = document.createElement("input");
input.type = "checkbox";
input.id = "correct-replies-on-open";
input.disabled = true;
const text = document.createElement("span");
const title = document.createElement("strong");
title.textContent = de ? "Antworten und Weiterleitungen beim Öffnen korrigieren" : "Correct replies and forwards when opened";
const description = document.createElement("small");
description.textContent = de
  ? "Standardmäßig aus. Ändert den tatsächlichen Nachrichtentext einmal beim Öffnen. Danach normal weiterbearbeiten. Die Originalmail bleibt unverändert. Benötigt die optionale Berechtigung zum Verfassen. Diese Option wird sofort und nur lokal gespeichert, unabhängig von Speichern und Sicherungsdateien."
  : "Off by default. Changes the actual message body once when opened; then edit normally. The original email stays unchanged. Requires the optional compose permission. This option is saved immediately on this device only, independently of Save and backup files.";
text.append(title, description);
label.append(input, text);
const status = document.createElement("p");
status.setAttribute("role", "status");
document.querySelector("#process-quoted-text")!.closest(".settings-section-content")!.append(label, status);

void Promise.all([api.storage.local.get(composeSettingKey), api.permissions.contains({permissions: ["compose"]})])
  .then(([values, granted]) => {input.checked = values[composeSettingKey] === true && granted; input.disabled = false;})
  .catch(() => {status.textContent = de ? "Die Option konnte nicht geladen werden." : "Could not load this option.";});

input.addEventListener("change", () => {
  const selected = input.checked;
  // Permission requests must begin directly in the user gesture.
  const permission = selected ? api.permissions.request({permissions: ["compose"]}) : Promise.resolve(true);
  input.disabled = true;
  void permission.then(async granted => {
    if (!granted) {
      input.checked = false;
      status.textContent = de ? "Berechtigung nicht erteilt; die Option bleibt aus." : "Permission not granted; the option stays off.";
      return;
    }
    await api.storage.local.set({[composeSettingKey]: selected});
    status.textContent = de ? "Lokal gespeichert. Gilt für neu geöffnete Antworten und Weiterleitungen." : "Saved locally. Applies to newly opened replies and forwards.";
  }).catch(() => {input.checked = !selected; status.textContent = de ? "Die Option konnte nicht gespeichert werden." : "Could not save this option.";})
    .finally(() => {input.disabled = false;});
});
