// Wie die Thunderbird-Ausgabe: gemeinsame Oberfläche ohne die nur für
// Webvideos sinnvolle Untertiteloption. Das Eingabefeld bleibt für die
// gemeinsamen Skripte erhalten.
export function hideSubtitleOption(): void {
  const subtitles = document.querySelector<HTMLInputElement>("#process-subtitles");
  if (!subtitles) return;
  subtitles.disabled = true;
  const row = subtitles.closest<HTMLElement>("label");
  if (row) {
    row.hidden = true;
    row.style.display = "none";
  }
}
