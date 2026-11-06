import "./runtime-globals";
import {DOMParser as Parser} from "linkedom";

// Ereignisse laufen im klassischen Outlook ohne DOM. linkedom stellt dort den
// Teil des DOM bereit, den der DOM-Kern braucht. So gilt dieselbe Umwandlung
// wie in Thunderbird, auch über Tags hinweg (`Lehrer*<b>innen</b>`).
export function installDomWithoutBrowser(): void {
  if (typeof DOMParser !== "undefined") return;
  const scope = globalThis as Record<string, unknown>;
  const view = new Parser().parseFromString("<html></html>", "text/html").defaultView as unknown as Record<string, unknown>;
  // Der Kern prüft Knoten mit instanceof; die Klassen müssen die von linkedom sein.
  for (const name of ["Node", "Element", "Text", "ShadowRoot"]) scope[name] = view[name];
  scope.NodeFilter = {SHOW_ALL: 0xffffffff, SHOW_ELEMENT: 1, SHOW_TEXT: 4, SHOW_COMMENT: 128,
    FILTER_ACCEPT: 1, FILTER_REJECT: 2, FILTER_SKIP: 3};
  // Der Kern ruft Timer über defaultView auf, bei linkedom ein Proxy auf
  // globalThis. Eingebaute Timer verlangen globalThis als this.
  for (const name of ["setTimeout", "clearTimeout"]) {
    const timer = scope[name] as (...args: unknown[]) => unknown;
    scope[name] = (...args: unknown[]) => timer.apply(globalThis, args);
  }
  scope.DOMParser = Parser;
}
