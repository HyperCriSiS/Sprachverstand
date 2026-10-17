const locale = "de-DE";
const plainAmbiguousDeterminers = new Set([
  "die",
  "eine",
  "einer",
  "ihre",
  "ihrer",
  "jene",
  "jener",
  "jede",
  "keine",
  "keiner",
  "meine",
  "meiner",
  "seine",
  "seiner",
  "deine",
  "deiner",
  "diese",
  "dieser",
  "unsere",
  "unserer",
  "eure",
  "eurer",
  "welche",
  "welcher"
]);
const markedDeterminerPrefixes = new Set([
  "der",
  "die",
  "den",
  "dem",
  "des",
  "ein",
  "eine",
  "einem",
  "eines",
  "kein",
  "keine",
  "keines",
  "jede",
  "jedes",
  "welche",
  "welches",
  "diese",
  "dieses",
  "jene",
  "jenes",
  "mein",
  "meine",
  "meines",
  "dein",
  "deine",
  "deines",
  "sein",
  "seine",
  "seinen",
  "seinem",
  "seines",
  "seiner",
  "ihr",
  "ihre",
  "ihren",
  "ihrem",
  "ihres",
  "ihrer",
  "unser",
  "unsere",
  "unseres",
  "euer",
  "eure",
  "eures"
]);
const separatorPattern = /[:*_\/·•.’‘]/u;
const contextTokenCharacter = /[\p{L}\p{M}:*_\/·•.’‘-]/u;
const whitespaceCharacter = /\s/u;

function previousCharacterStart(input: string, end: number): number {
  const last = input.charCodeAt(end - 1);
  if (last >= 0xdc00 && last <= 0xdfff && end > 1) {
    const first = input.charCodeAt(end - 2);
    if (first >= 0xd800 && first <= 0xdbff) {
      return end - 2;
    }
  }
  return end - 1;
}

function isAmbiguousDeterminer(token: string): boolean {
  const normalized = token.toLocaleLowerCase(locale);
  if (plainAmbiguousDeterminers.has(normalized)) {
    return true;
  }

  const separatorIndex = normalized.search(separatorPattern);
  return (
    separatorIndex > 0 &&
    markedDeterminerPrefixes.has(normalized.slice(0, separatorIndex))
  );
}

export function hasAmbiguousSingularDeterminer(
  input: string,
  nounIndex: number
): boolean {
  // Der bisherige unankerte End-Regex suchte für jeden Treffer erneut
  // den gesamten Präfix ab. Nur die letzten vier zusammenhängenden Tokens
  // können die Entscheidung beeinflussen: direkt rückwärts lesen, ohne
  // ein Zeichenlimit, das lange Wörter/Unicode-Kontexte abschneiden würde.
  let cursor = nounIndex;
  if (cursor === 0 || !whitespaceCharacter.test(input[cursor - 1] ?? "")) {
    return false;
  }
  for (let token = 0; token < 4; token += 1) {
    while (cursor > 0 && whitespaceCharacter.test(input[cursor - 1] ?? "")) {
      cursor -= 1;
    }
    const end = cursor;
    while (cursor > 0) {
      const start = previousCharacterStart(input, cursor);
      if (!contextTokenCharacter.test(input.slice(start, cursor))) {
        break;
      }
      cursor = start;
    }
    if (cursor === end) {
      return false;
    }
    if (isAmbiguousDeterminer(input.slice(cursor, end))) {
      return true;
    }
    if (cursor === 0 || !whitespaceCharacter.test(input[cursor - 1] ?? "")) {
      return false;
    }
  }
  return false;
}
