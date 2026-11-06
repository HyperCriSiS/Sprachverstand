// Die Ereignislaufzeit des klassischen Outlook ist reines JavaScript. linkedom
// und der DOM-Kern erwarten einige Browser-Funktionen; dieses Modul ergänzt sie
// vor dem Laden von linkedom (die Entitätentabellen werden beim Laden mit atob
// entpackt). Ergänzt wird nur, was vollständig funktioniert; Timer bekommt nur
// das linkedom-Dokument (dom-without-browser.ts).
const scope = globalThis as Record<string, unknown>;
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

scope.atob ??= (input: string) => {
  let bits = 0;
  let count = 0;
  let output = "";
  for (const char of input.replace(/=+$/, "")) {
    bits = bits << 6 | alphabet.indexOf(char);
    count += 6;
    if (count >= 8) {
      count -= 8;
      output += String.fromCharCode(bits >> count & 0xff);
    }
  }
  return output;
};
scope.performance ??= {now: () => Date.now()};
scope.queueMicrotask ??= (callback: () => void) => void Promise.resolve().then(callback);

// Ein Bericht zu Build 2406 nennt Intl als fehlend. linkedom legt beim Laden
// einen Zahlenformatierer für CSS-Werte an; dafür genügt dieser Ersatz, den
// dom-without-browser.ts nach dem Laden wieder entfernt.
export const temporaryIntl = scope.Intl === undefined;
if (temporaryIntl) {
  scope.Intl = {NumberFormat: class {
    format(value: number) {
      return String(Math.round(value * 1e6) / 1e6);
    }
  }};
}
