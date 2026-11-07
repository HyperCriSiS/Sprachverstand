import {office} from "./office";
import {offlinePreview} from "./offline-preview";
import type {ReadWindowContent} from "./read-window";

// Seite im Lesefenster: setzt die Teile der umgewandelten Nachricht zusammen
// und zeigt sie ohne Skripte und ohne Inhalte von außen.
export function receiveReadWindow(show: (content: ReadWindowContent) => void): (message: string) => void {
  const parts: string[] = [];
  return message => {
    const {index, total, text} = JSON.parse(message) as {index: number; total: number; text: string};
    parts[index] = text;
    if (parts.filter(part => part !== undefined).length === total) show(JSON.parse(parts.join("")) as ReadWindowContent);
  };
}

const Office = office();
if (Office && typeof document !== "undefined") {
  await Office.onReady();
  const heading = document.querySelector("h1")!;
  const frame = document.querySelector("iframe")!;
  const receive = receiveReadWindow(({title, html}) => {
    document.title = heading.textContent = frame.title = title;
    frame.srcdoc = offlinePreview(html);
  });
  Office.context.ui!.addHandlerAsync("dialogParentMessageReceived", ({message}) => receive(message),
    () => Office.context.ui!.messageParent("ready"));
}
