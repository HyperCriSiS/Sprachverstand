import type {OfficeGlobal} from "./office";

// Das Lesefenster ist ein Office-Dialog. Dialoge kennen das Postfach nicht;
// der Seitenbereich schickt die umgewandelte Nachricht in Teilen hinüber,
// weil Outlook für Dialognachrichten keine Größe zusichert. Jeder Teil ist
// „Nummer/Anzahl:Text“, damit seine Länge vorhersagbar bleibt.
export const readWindowChunk = 30_000;

export interface ReadWindowContent {
  readonly title: string;
  readonly html: string;
}

// Öffnet das Lesefenster. done meldet einmal: ohne Fehler beim Schließen,
// mit Fehler, wenn sich das Fenster nicht öffnen ließ oder darin etwas scheiterte.
export function openReadWindow(Office: OfficeGlobal, url: string, content: ReadWindowContent,
  done: (error?: string) => void): void {
  let finished = false;
  const finish = (error?: string) => {
    if (!finished) done(error);
    finished = true;
  };
  // messageChild (DialogApi 1.2) fehlt etwa in Volumenlizenzen von Outlook 2016/2019.
  if (!Office.context.ui || !Office.context.requirements?.isSetSupported("DialogApi", "1.2")) {
    finish("Outlook unterstützt DialogApi 1.2 nicht.");
    return;
  }
  const text = JSON.stringify(content);
  const total = Math.max(1, Math.ceil(text.length / readWindowChunk));
  Office.context.ui.displayDialogAsync(url, {height: 85, width: 60, displayInIframe: true}, result => {
    if (result.status !== "succeeded") {
      finish(`${result.error?.message ?? "unbekannter Fehler"} (${result.error?.code ?? "ohne Code"})`);
      return;
    }
    const dialog = result.value;
    dialog.addEventHandler("dialogMessageReceived", ({message}) => {
      if (message !== "ready") return;
      for (let index = 0; index < total; index++) {
        dialog.messageChild!(`${index}/${total}:${text.slice(index * readWindowChunk, (index + 1) * readWindowChunk)}`);
      }
    });
    // 12006: vom Nutzer geschlossen. Andere Codes sind Fehler im Fenster.
    dialog.addEventHandler("dialogEventReceived", ({error}) =>
      finish(error === 12006 ? undefined : `Fehler im Fenster (${error ?? "ohne Code"})`));
  });
}
