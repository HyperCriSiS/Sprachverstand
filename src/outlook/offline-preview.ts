// Umgewandelte Nachrichten im Lesefenster laden nichts
// nach: externe Bilder, Schriften und Stile könnten sonst dem Absender das
// Öffnen verraten. Nachrichten ohne eigene Farben folgen dem hellen oder
// dunklen Systemdesign; eigene Farben der Nachricht gehen vor.
export function offlinePreview(html: string): string {
  return `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'">` +
    `<meta name="color-scheme" content="light dark">${html}`;
}
