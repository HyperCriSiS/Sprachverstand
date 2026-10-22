import type { TransformResult } from "../core/rule";
import type { GrammaticalCase } from "./person-lexicon";

/*
 * A determiner pair before a marked singular, written out or with
 * attributes between: `durch den oder die behandelnde Ärzt:in`, `der/ die
 * deutsche Ehepartner/in`, `jede und jeder Expert*in`, `die/en richtigen
 * Ansprechpartner:in`, `der/die Bewerber(in)`. The pair is reduced to its
 * masculine determiner and the attributes take its ending; the following
 * singular rules then resolve the noun in that case. Pairs without a marked
 * singular after them are never touched.
 */
interface PairForm {
  readonly masculine: string;
  readonly grammaticalCase: GrammaticalCase;
  // ein-words: strong nominative ending -r on the attribute.
  readonly strong: boolean;
}

const locale = "de-DE";
const pairs = new Map<string, PairForm>();

function add(masculine: string, feminine: string, grammaticalCase: GrammaticalCase, strong = false): void {
  pairs.set(`${masculine}|${feminine}`, {masculine, grammaticalCase, strong});
  pairs.set(`${feminine}|${masculine}`, {masculine, grammaticalCase, strong});
}

add("der", "die", "nominative");
add("den", "die", "accusative");
add("dem", "der", "dative");
add("des", "der", "genitive");
add("jeder", "jede", "nominative");
add("jeden", "jede", "accusative");
add("jedem", "jeder", "dative");
add("ein", "eine", "nominative", true);
add("einen", "eine", "accusative");
add("einem", "einer", "dative");
add("eines", "einer", "genitive");
add("kein", "keine", "nominative", true);
add("keinen", "keine", "accusative");
add("keinem", "keiner", "dative");
for (const base of ["mein", "dein", "sein", "ihr", "unser", "euer"]) {
  const inflected = base === "euer" ? "eur" : base;
  add(base, `${inflected}e`, "nominative", true);
  add(`${inflected}en`, `${inflected}e`, "accusative");
  add(`${inflected}em`, `${inflected}er`, "dative");
  add(`${inflected}es`, `${inflected}er`, "genitive");
}
// Compact forms: `die/en`, `ein/e`, `eine/n`, `einem/r`, `jede/r`, `seine/n`.
function compact(left: string, right: string, masculine: string,
  grammaticalCase: GrammaticalCase, strong = false): void {
  pairs.set(`${left}|${right}`, {masculine, grammaticalCase, strong});
}
compact("die", "en", "den", "accusative");
compact("die", "n", "den", "accusative");
compact("der", "m", "dem", "dative");
compact("dem", "r", "dem", "dative");
compact("des", "r", "des", "genitive");
for (const base of ["ein", "kein", "mein", "dein", "sein", "ihr", "unser"]) {
  compact(base, "e", base, "nominative", true);
  compact(`${base}e`, "n", `${base}en`, "accusative");
  compact(`${base}em`, "r", `${base}em`, "dative");
  compact(`${base}er`, "m", `${base}em`, "dative");
  compact(`${base}es`, "r", `${base}es`, "genitive");
  compact(`${base}er`, "s", `${base}es`, "genitive");
}
compact("jede", "r", "jeder", "nominative");
compact("jede", "n", "jeden", "accusative");
compact("jede", "m", "jedem", "dative");

const separator = String.raw`(?:\s*\/\s*|\s+(?:oder|bzw\.|und|beziehungsweise)\s+)`;
const attribute = String.raw`[\p{Ll}][\p{L}\p{M}]*(?:(?:\/-?|[:*_·•])[\p{Ll}]{1,4})?`;
const markedSingular = String.raw`\p{Lu}[\p{L}\p{M}’'-]*?(?:(?:\/-?|[:*_·•])in|\(-?in\)|\p{Ll}In)`;
const pairPattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}/])([\p{L}]+)(${separator})([\p{L}]+)(\s+)((?:${attribute}\s+){0,2})(?=${markedSingular}(?![\p{L}\p{M}]))`,
  "gu"
);

function applyCase(source: string, replacement: string): string {
  return source[0] === source[0]?.toLocaleUpperCase(locale)
    ? replacement[0]!.toLocaleUpperCase(locale) + replacement.slice(1)
    : replacement;
}

// `behandelnde` after `den` → `behandelnden`; `benannter/e` → `benannter`.
function inflectAttribute(word: string, form: PairForm): string {
  const marked = /^(\p{Ll}[\p{L}\p{M}]*?)(?:\/-?|[:*_·•])(\p{Ll}{1,4})$/u.exec(word);
  if (marked) {
    const [, left, right] = marked;
    // `benannter/e`, `erster/erste`: the masculine half ends in -r/-n/-m/-s.
    if (/[rnms]$/u.test(left!)) return left!;
    if (/^[rnms]$/u.test(right!)) return left! + right!;
    return word;
  }
  if (!/e$/u.test(word)) return word;
  if (form.grammaticalCase === "nominative") return form.strong ? `${word}r` : word;
  return `${word}n`;
}

export function normalizeDeterminerPairs(input: string): TransformResult {
  if (!/(?:\/|oder|bzw\.|und|beziehungsweise)/u.test(input)) return {text: input, replacements: 0};
  let replacements = 0;
  const text = input.replace(pairPattern,
    (match: string, left: string, separator: string, right: string, space: string, attributes: string,
      offset: number, source: string) => {
      const form = pairs.get(`${left.toLocaleLowerCase(locale)}|${right.toLocaleLowerCase(locale)}`);
      if (!form) return match;
      // A compact pair directly before the noun (`der/die Ärzt/in`) is resolved
      // by the determiner table itself; only `(in)` forms need the reduction.
      if (!attributes && separator === "/" &&
          !/^\S*\(-?in\)/u.test(source.slice(offset + match.length))) return match;
      replacements += 1;
      const inflected = attributes.replace(/\S+/gu, (word) => inflectAttribute(word, form));
      return applyCase(left, form.masculine) + space + inflected;
    });
  return {text, replacements};
}
