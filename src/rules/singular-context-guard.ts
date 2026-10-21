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
  if (separatorIndex <= 0) return false;
  const prefix = normalized.slice(0, separatorIndex);
  // A marked adjective the context rule could not resolve
  // (`mit engagierte*n Mitarbeiter*in`): changing only the noun would leave
  // a half-converted phrase.
  return markedDeterminerPrefixes.has(prefix) ||
    (/^[\p{L}\p{M}]{3,}e$/u.test(prefix) &&
      /^[:*_\/·•.’‘]-?[rnms]$/u.test(normalized.slice(separatorIndex)));
}

const phraseOpeningPrepositions = new Set([
  "pro", "je", "für", "von", "mit", "bei", "ohne", "gegen", "durch",
  "zwischen", "nach", "aus", "seit", "laut", "gemäß", "samt", "nebst"
]);
const dativePrepositionsBeforeDer = new Set([
  "mit", "von", "bei", "zu", "aus", "nach", "seit", "gegenüber", "samt",
  "nebst", "außer", "entgegen"
]);
const markedCompoundAt =
  /^[\p{L}\p{M}’'-]*?(?:(?:\/-?|[:*_·•.’‘])in|\(-?in\)|\p{Ll}In)-/u;

function isNounOrDativePrepositionBefore(input: string, end: number): boolean {
  const previous = input.slice(0, end).trimEnd()
    .match(/([\p{L}\p{M}-]+)([.!?:;,)"“»]?)$/u);
  if (!previous || previous[2]) return false;
  const word = previous[1] ?? "";
  return dativePrepositionsBeforeDer.has(word.toLocaleLowerCase(locale)) ||
    /^\p{Lu}/u.test(word);
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
  // Only weak adjectives (`der verfolgten`) seen so far between the token
  // and the noun.
  let onlyWeakAdjectives = true;
  for (let tokenIndex = 0; tokenIndex < 4; tokenIndex += 1) {
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
    const token = input.slice(cursor, end);
    if (isAmbiguousDeterminer(token)) {
      return true;
    }
    const lowerToken = token.toLocaleLowerCase(locale);
    // `Projekt der Künstler*in`, `mit der neuen Kolleg*in`: `der` right
    // before the noun after a noun or a dative preposition is feminine
    // genitive/dative, never the masculine nominative (`der Künstler`).
    // A compound (`der Therapeut:in-Arzt-Beziehung`) is not a singular.
    if (onlyWeakAdjectives && lowerToken === "der" &&
        !markedCompoundAt.test(input.slice(nounIndex)) &&
        isNounOrDativePrepositionBefore(input, cursor)) {
      return true;
    }
    if (!/^[\p{L}\p{M}]+en$/u.test(token)) onlyWeakAdjectives = false;
    // `als` opens a new phrase: in `welche Benefits Sie als Mitarbeiter:in`
    // or `Ihre Angaben als Teilnehmer*in` the earlier determiner belongs to
    // another noun. A determiner after `als` was already read above.
    if (lowerToken === "als") {
      return false;
    }
    // So does a preposition right before the noun (`Die Kosten pro
    // Schüler:in`, `Beziehung zwischen Patient/in`): a determiner of this
    // noun would stand after the preposition.
    if (tokenIndex === 0 && phraseOpeningPrepositions.has(lowerToken)) {
      return false;
    }
    if (cursor === 0 || !whitespaceCharacter.test(input[cursor - 1] ?? "")) {
      return false;
    }
  }
  return false;
}
