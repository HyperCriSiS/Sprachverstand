import type {ExtensionApi} from "../browser/api";

// Gleicher Schlüssel wie in der Thunderbird-Ausgabe.
export const composeSettingKey = "thunderbird.correct-replies-on-open";

// Option der Thunderbird-Ausgabe, hier ohne Berechtigungsabfrage: Outlook
// erteilt den Schreibzugriff mit der Installation des Add-ins.
export function addComposeOption(api: ExtensionApi): void {
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
    ? "Standardmäßig aus. Ändert den tatsächlichen Nachrichtentext samt zitierter Originalmail einmal beim Öffnen. Danach normal weiterbearbeiten. Die Originalmail im Postfach bleibt unverändert. Diese Option wird sofort im Postfach gespeichert und gilt für alle Outlook-Clients, unabhängig von Speichern und Sicherungsdateien. Im klassischen Outlook gelten dabei nur die Standardeinstellungen und synchronisierte Kategorien."
    : "Off by default. Changes the actual message body, including the quoted original, once when opened; then edit normally. The original email in the mailbox stays unchanged. This option is saved immediately in the mailbox and applies to all Outlook clients, independently of Save and backup files. Classic Outlook uses only the default settings and synchronized categories here.";
  text.append(title, description);
  label.append(input, text);
  const status = document.createElement("p");
  status.setAttribute("role", "status");
  document.querySelector("#process-quoted-text")?.closest(".settings-section-content")?.append(label, status);

  void api.storage.sync.get(composeSettingKey)
    .then(values => {input.checked = values[composeSettingKey] === true; input.disabled = false;})
    .catch(() => {status.textContent = de ? "Die Option konnte nicht geladen werden." : "Could not load this option.";});

  input.addEventListener("change", () => {
    const selected = input.checked;
    input.disabled = true;
    void api.storage.sync.set({[composeSettingKey]: selected})
      .then(() => {status.textContent = de ? "Gespeichert. Gilt für neu geöffnete Antworten und Weiterleitungen." : "Saved. Applies to newly opened replies and forwards.";})
      .catch(() => {input.checked = !selected; status.textContent = de ? "Die Option konnte nicht gespeichert werden." : "Could not save this option.";})
      .finally(() => {input.disabled = false;});
  });
}
