import { finiteVerbsBeforeDer } from "./finite-verbs-before-der";

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

const coordinators = new Set(["und", "oder", "bzw.", "sowie"]);
// Capitalized words with unambiguous noun suffixes (never adjectives).
const headNounSuffix =
  /^\p{Lu}[\p{L}\p{M}-]*(?:ung|ungen|ion|ionen|heit|keit|schaft|tät|gang|kurs|tum|nis|ment|ismus)$/u;
const categoryNoun =
  /^\p{Lu}[\p{L}\p{M}-]*(?:beruf|berufe|bild|bilder|angebot|angebote|ebene|kategorie|bereich|bereiche|lizenz|titel|rolle|stelle|profil|abschluss|zertifikat|kurs|kurse|lehrgang|programm|modul|studiengang|marke|bezeichnung|funktion|position|Beruf|Berufe|Ebene|Kategorie|Marke|Rolle|Stelle)$/u;
const markedSingularToken =/^[\p{L}\p{M}’'-]+(?:(?:\/-?|[:*_·•.’‘])in|\(-?in\)|\p{Ll}In)$/u;

// Start index of a marked singular directly before `end` (`Hausärzt:in`).
function markedNounBefore(input: string, end: number): number | undefined {
  const match = /[\p{L}\p{M}’'-]+(?:(?:\/-?|[:*_·•.’‘])in|\(-?in\)|\p{Ll}In)$/u
    .exec(input.slice(Math.max(0, end - 64), end));
  if (!match) return undefined;
  const start = end - match[0].length;
  return start === 0 || whitespaceCharacter.test(input[start - 1] ?? "") ? start : undefined;
}

const phraseOpeningPrepositions = new Set([
  "pro", "je", "für", "von", "mit", "bei", "ohne", "gegen", "durch",
  "zwischen", "nach", "aus", "seit", "laut", "gemäß", "samt", "nebst"
]);
const dativePrepositionsBeforeDer = new Set([
  "mit", "von", "bei", "zu", "aus", "nach", "seit", "gegenüber", "samt",
  "nebst", "außer", "entgegen", "zwischen", "neben", "vor", "hinter", "unter", "an", "auf"
]);
const markedCompoundAt =
  /^[\p{L}\p{M}’'-]*?(?:(?:\/-?|[:*_·•.’‘])in|\(-?in\)|\p{Ll}In)-/u;

function isNounOrDativePrepositionBefore(input: string, end: number): boolean {
  const previous = input.slice(0, end).trimEnd()
    .match(/([\p{L}\p{M}-]+)([.!?:;,)"“»]?)$/u);
  if (!previous || previous[2]) return false;
  const word = previous[1] ?? "";
  const lower = word.toLocaleLowerCase(locale);
  return dativePrepositionsBeforeDer.has(lower) ||
    (/^\p{Lu}/u.test(word) && !finiteVerbsBeforeDer.has(lower));
}

// Abbreviations end in a dot without ending the sentence (`die ggf. neue
// Lehrer*in`, `Dipl. Biomedizinische/r Analytiker/in`).
const abbreviations = new Set([
  "bzw", "ggf", "inkl", "exkl", "evtl", "bspw", "insb", "usw", "etc", "vgl", "ca", "sog", "zzgl", "max", "min",
  "dr", "prof", "hr", "fr", "nr", "st", "str", "dipl", "ing", "mag", "staatl", "gepr", "akad", "approb",
  "med", "rer", "nat", "phil", "jur", "dent", "vet", "techn", "kaufm", "kfm", "fachl", "wiss", "zert", "allg",
  "psych", "päd", "soz", "pol", "kath", "ev", "evang", "pharm", "univ", "ehem", "stellv", "gem", "geb", "verh",
  "zzt", "tlw", "ugs", "jur", "oec", "sen", "jun",
  "u", "z", "d", "i", "e", "o", "a", "s", "v"
]);

function isSentenceEnd(token: string): boolean {
  const word = /^([\p{L}\p{M}-]+)\.$/u.exec(token)?.[1];
  return word !== undefined && !abbreviations.has(word.toLocaleLowerCase(locale));
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
  // Second noun of a slash pair (`die Hausärzt:in/Fachärzt:in`): it shares
  // the determiner of the first one and must not be resolved alone.
  if (cursor > 0 && input[cursor - 1] === "/") {
    const previous = markedNounBefore(input, cursor - 1);
    return previous !== undefined && hasAmbiguousSingularDeterminer(input, previous);
  }
  if (cursor === 0 || !whitespaceCharacter.test(input[cursor - 1] ?? "")) {
    return false;
  }
  let afterCoordinator = false;
  let plainConjunct = false;
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
    // A sentence end (`Die Arbeit. Werden Sie Umweltstifter*in!`): a
    // determiner further left belongs to the previous sentence.
    if (isSentenceEnd(token)) return false;
    // `die Künstler:in oder Kurator:in`: a coordinated marked noun follows
    // the decision for the first one instead of being resolved alone.
    if (afterCoordinator && markedSingularToken.test(token)) {
      return hasAmbiguousSingularDeterminer(input, cursor);
    }
    // `Diese Doppelposition Studierende_r und Mitarbeiter_in`: the first
    // conjunct is already resolved („Student“). A capitalized word before it
    // is another noun, so a determiner further left belongs to that noun.
    if (plainConjunct && /^\p{Lu}[\p{Ll}\p{M}-]+$/u.test(token) && !isAmbiguousDeterminer(token)) {
      return false;
    }
    plainConjunct = afterCoordinator && /^\p{Lu}[\p{Ll}\p{M}-]+$/u.test(token);
    afterCoordinator = false;
    if (coordinators.has(token.toLocaleLowerCase(locale))) {
      afterCoordinator = true;
      if (cursor === 0 || !whitespaceCharacter.test(input[cursor - 1] ?? "")) return false;
      continue;
    }
    // `die berufliche Grundbildung Metallbaukonstrukteur/in`, `die Umschulung
    // Industrieelektriker*in`: a noun right before the title owns the
    // determiner further left; the title itself stands without one.
    if (headNounSuffix.test(token)) {
      return false;
    }
    // `die Berufe Altenpfleger*in, …`, `die Ebene Leiter*in`, `ihrer DOSB
    // Übungsleiter:in B-Lizenz`: a category noun or an abbreviation right
    // before the title.
    if (tokenIndex === 0 && !isAmbiguousDeterminer(token) &&
        (categoryNoun.test(token) || /^\p{Lu}{2,}$/u.test(token))) {
      return false;
    }
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
