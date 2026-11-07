// Umgewandelte Nachrichten im Lesefenster laden nichts
// nach: externe Bilder, Schriften und Stile könnten sonst dem Absender das
// Öffnen verraten.
export function offlinePreview(html: string): string {
  return `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'">${html}`;
}
