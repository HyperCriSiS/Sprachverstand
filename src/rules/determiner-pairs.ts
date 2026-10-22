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
compact("zum", "zur", "zum", "dative");
compact("zur", "zum", "zum", "dative");
compact("zum", "r", "zum", "dative");
compact("zu", "r", "zum", "dative");
compact("zu", "m", "zum", "dative");
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

const separator = String.raw`(?:\s*\/\s*|[:*_·•]|\s+(?:oder|bzw\.|und|beziehungsweise)\s+)`;
// Capitalized attributes in job titles (`Operationstechnischen`) only with
// an adjective ending.
// The marker on an attribute carries an adjective ending (`/r`, `:n`, `/-r`),
// never `in`, so a marked noun (`Melder:in`) is no attribute.
const attribute = String.raw`(?!(?:die|der|den|dem|des|eine|einer|einen|einem|eines|ein)\s)(?:[\p{Ll}][\p{L}\p{M}]*|\p{Lu}[\p{Ll}\p{M}-]*(?:e|en|es|em))(?:(?:\/-?|[:*_·•])(?:e|en|er|es|em|r|n|m|s))?(?![\p{L}\p{M}])`;
const markedSingular = String.raw`\p{Lu}[\p{L}\p{M}’'-]*?(?:(?:\/-?|[:*_·•])in|\(-?in\)|\p{Ll}In)`;
const pairPattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}/])([\p{L}]+)(${separator})([\p{L}]+)(\s+)((?:${attribute}\s+){0,2})(${markedSingular})(?![\p{L}\p{M}])(?:(\s+(?:oder|und|bzw\.)\s+)(${markedSingular})(?![\p{L}\p{M}]))?`,
  "gu"
);

function applyCase(source: string, replacement: string): string {
  return source[0] === source[0]?.toLocaleUpperCase(locale)
    ? replacement[0]!.toLocaleUpperCase(locale) + replacement.slice(1)
    : replacement;
}

// `behandelnde` after `den` → `behandelnden`; `benannter/e` → `benannter`.
function inflectAttribute(word: string, form: PairForm): string {
  const marked = /^(\p{L}[\p{L}\p{M}]*?)(?:\/-?|[:*_·•])(\p{Ll}{1,4})$/u.exec(word);
  if (marked) {
    const [, left] = marked;
    // `benannter/e`, `erster/erste`: the masculine half ends in -r/-n/-m/-s.
    if (/[rnms]$/u.test(left!)) return left!;
    // `Anästhesietechnische*r`, `engagierte/n`: the stem takes the case ending.
    if (!/e$/u.test(left!)) return word;
    word = left!;
  }
  // `Der/die ausländischen Partner/in`: a written -en in the nominative is
  // the source's slip for -e.
  if (form.grammaticalCase === "nominative" && /\p{Ll}en$/u.test(word)) word = word.slice(0, -1);
  if (!/e$/u.test(word)) return word;
  if (form.grammaticalCase === "nominative") return form.strong ? `${word}r` : word;
  return `${word}n`;
}

export function normalizeDeterminerPairs(
  input: string,
  mapNoun?: (base: string, grammaticalCase: GrammaticalCase) => string | undefined
): TransformResult {
  if (!/(?:[\/:*_·•]|oder|bzw\.|und|beziehungsweise)/u.test(input)) return {text: input, replacements: 0};
  let replacements = 0;
  const baseOf = (noun: string) => /^(.*?)(?:(?:\/-?|[:*_·•])in|\(-?in\))$/u.exec(noun)?.[1] ??
    /^(.*\p{Ll})In$/u.exec(noun)?.[1];
  const text = input.replace(pairPattern,
    (match: string, left: string, separator: string, right: string, space: string, attributes: string,
      noun: string, coordinator: string | undefined, secondNoun: string | undefined) => {
      const form = pairs.get(`${left.toLocaleLowerCase(locale)}|${right.toLocaleLowerCase(locale)}`);
      if (!form) return match;
      // `zu:r` has no other rule; a compact determiner pair directly before
      // the noun (`der/die Ärzt/in`) is resolved by the determiner table itself,
      // only `(in)` forms need the reduction there.
      const contractedZu = left.toLocaleLowerCase(locale) === "zu";
      // Marker-separated pairs (`jede:r`, `der:die`) keep the determiner
      // table, which reads their case from the context.
      if (/^[:*_·•]$/u.test(separator) && !contractedZu) return match;
      if (!attributes && !contractedZu && !/\s/u.test(separator) && !/\(-?in\)$/u.test(noun)) return match;
      replacements += 1;
      const inflected = attributes.replace(/\S+/gu, (word) => inflectAttribute(word, form));
      // With attributes between, the noun is inflected here too; later rules
      // only see a determiner directly before the noun (`zum … Assistenten`).
      const convert = attributes || contractedZu;
      const base = baseOf(noun);
      const masculineNoun = convert && base && mapNoun ? mapNoun(base, form.grammaticalCase) : undefined;
      // A coordinated second noun shares the case (`den oder die behandelnde/n
      // Arzt*in oder Psycholog*in`).
      const secondBase = secondNoun ? baseOf(secondNoun) : undefined;
      const secondMasculine = convert && secondBase && mapNoun
        ? mapNoun(secondBase, form.grammaticalCase) : undefined;
      return applyCase(left, form.masculine) + space + inflected + (masculineNoun ?? noun) +
        (coordinator && secondNoun ? coordinator + (secondMasculine ?? secondNoun) : "");
    });
  return {text, replacements};
}

/*
 * Determiners carrying the marker themselves (`eine*n feste*n und
 * nahbare*n Ansprechpartner*in`, `von eine:r weiteren Mitarbeiter:in`,
 * `Rückfrage de*r Kolleg*in`, `Einweisungsschein Ihre*r Ärzt*in`, `Abwehr
 * ein:er übermächtigen Gegner:in`). An explicit ending gives the case
 * (-n/-en accusative, -m dative, -s genitive); `-r`/`-er` and a bare `de*`
 * are read from the word before: a dative preposition gives the dative, a
 * noun the genitive, otherwise the nominative. Determiner, attributes and
 * noun are converted together; without a known noun nothing changes.
 */
const compactBases = new Map<string, readonly [nominative: string, accusative: string, dative: string, genitive: string, strong: boolean]>([
  ["eine", ["ein", "einen", "einem", "eines", true]],
  ["ein", ["ein", "einen", "einem", "eines", true]],
  ["keine", ["kein", "keinen", "keinem", "keines", true]],
  ["de", ["der", "den", "dem", "des", false]],
  ["meine", ["mein", "meinen", "meinem", "meines", true]],
  ["deine", ["dein", "deinen", "deinem", "deines", true]],
  ["seine", ["sein", "seinen", "seinem", "seines", true]],
  ["ihre", ["ihr", "ihren", "ihrem", "ihres", true]],
  ["unsere", ["unser", "unseren", "unserem", "unseres", true]]
]);
const dativePrepositions = new Set(["mit", "von", "bei", "zu", "aus", "nach", "seit", "gegenüber", "samt", "nebst", "außer"]);
// Attributes, brand words (`BRITA`) and truncated compounds (`Bildungs-`);
// never a determiner (`Eine Welt-…` is a name).
const compactAttribute = String.raw`(?!(?:eine|einer|einen|einem|eines|ein|die|der|den|dem|des)\s)(?:\p{L}[\p{L}\p{M}-]*(?:[:*_·•](?:n|r))?|\p{Lu}{2,})`;
const compactPattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}])(eine|ein|keine|de|meine|deine|seine|ihre|unsere)([:*_·•])(en|er|n|r|m|s)?(\s+)((?:${compactAttribute}(?:\s+und\s+${compactAttribute})?\s+){0,2})(\p{Lu}[\p{L}\p{M}’'-]*?)(?:[:*_·•]in)(?![\p{L}\p{M}])`,
  "giu"
);

function caseFromEnding(ending: string | undefined, before: string): GrammaticalCase {
  const lower = ending?.toLocaleLowerCase(locale);
  if (lower === "n" || lower === "en") return "accusative";
  if (lower === "m") return "dative";
  if (lower === "s") return "genitive";
  const previous = /([\p{L}\p{M}.-]+)\s*$/u.exec(before)?.[1] ?? "";
  if (dativePrepositions.has(previous.toLocaleLowerCase(locale))) return "dative";
  if (/^(?:für|durch|gegen|ohne|um|wider)$/iu.test(previous)) return "accusative";
  // A noun right before (not a sentence start): genitive attribute.
  if (/^\p{Lu}\p{Ll}/u.test(previous) && !/[.!?:]\s*$/u.test(before.slice(0, -previous.length - 1)) &&
      before.trim().length > previous.length) return "genitive";
  return "nominative";
}

function compactAttributeForm(word: string, grammaticalCase: GrammaticalCase, strong: boolean): string {
  if (word === "und" || /^\p{Lu}{2,}$/u.test(word)) return word;
  const marked = /^(.*?)([:*_·•])n$/u.exec(word);
  const plain = marked ? marked[1]! : word;
  if (!/e$/u.test(plain)) return word;
  if (grammaticalCase === "nominative") return strong ? `${plain}r` : plain;
  return `${plain}n`;
}

export function normalizeCompactDeterminers(
  input: string,
  mapNoun: (base: string, grammaticalCase: GrammaticalCase) => string | undefined
): TransformResult {
  if (!/(?:eine?|keine|de|meine|deine|seine|ihre|unsere)[:*_·•]/iu.test(input)) return {text: input, replacements: 0};
  let replacements = 0;
  const text = input.replace(compactPattern,
    (match: string, base: string, _marker: string, ending: string | undefined, space: string,
      attributes: string, noun: string, offset: number, source: string) => {
      const forms = compactBases.get(base.toLocaleLowerCase(locale));
      if (!forms) return match;
      // A bare `ein:` before a space is mostly a verb particle and a colon
      // (`führt … ein: Jeder …`); bare forms count only with `*`, `_`, `·`.
      if (!ending && _marker === ":") return match;
      const grammaticalCase = caseFromEnding(ending, source.slice(Math.max(0, offset - 60), offset));
      const masculine = noun && mapNoun(noun, grammaticalCase);
      if (!masculine) return match;
      const index = {nominative: 0, accusative: 1, dative: 2, genitive: 3}[grammaticalCase];
      const determiner = applyCase(base, String(forms[index]));
      const strong = forms[4] === true;
      const inflected = attributes.replace(/\S+/gu, (word) => compactAttributeForm(word, grammaticalCase, strong));
      replacements += 1;
      return determiner + space + inflected + masculine;
    });
  return {text, replacements};
}
