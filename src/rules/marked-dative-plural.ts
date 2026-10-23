import type { Rule, TransformResult } from "../core/rule";
import { mapMappedPlural } from "./mapped-plural-separators";
import { mapKnownPlural } from "./known-plural-separators";
import {markedPluralWordSource as markedWord, markedLeadingCandidate} from "./context-candidates";
import { dativeVerbPattern, verbGovernsPlural } from "./dative-verbs";

// Regex literals with Unicode property escapes stay at module level: Pale
// Moon compiles such a literal again each time a function evaluates it.
const uppercaseStartPattern = /^\p{Lu}/u;
const binnenIPluralPattern = /\p{Ll}Innen/u;

// Nur lexikalisch bekannte, markierte Pluralformen werden in eindeutig
// dativischen Wortgruppen mit der passenden Dativendung versehen.
// Die gewohnte allgemeine Pluralregel bleibt für alle anderen Kontexte zuständig.
const dativePhrasePattern =
  /(?<![\p{L}\p{M}])((?:mit|bei|von|zu|aus|nach|seit|den|unseren|ihren|euren|meinen|deinen|seinen|keinen|diesen|jenen|allen|(?<!(?:die|diese|jene|unsere|ihre|eure|meine|deine|seine|keine|alle|der)\s)(?:vielen|einigen|wenigen|mehreren|beiden)|(?<!Jugend\s)(?:danken|dankt|gratulieren|gratuliert|helfen|hilft|vertrauen|vertraut|begegnen|begegnet|zuhören))\s+(?:(?:[\p{L}\p{M}-]+en)\s+){0,3})([\p{L}\p{M}’'-]+)((?:(?:[/∕⁄／]-?|[:*_·•.’‘'])innen|\(-?innen\)|[/∕⁄／]inne[/∕⁄／]n))(?![\p{L}\p{M}-])(?:([ \t]+und[ \t]+)([\p{L}\p{M}’'-]+)((?:(?:[/∕⁄／]-?|[:*_·•.’‘'])innen|\(-?innen\)|[/∕⁄／]inne[/∕⁄／]n))(?![\p{L}\p{M}-]))?/giu;

// Words between trigger and noun must form one noun phrase: lowercase
// determiners and adjectives on -en. A capitalized noun (`Seit Wochen`),
// a pronoun (`Mit ihnen`) or an auxiliary (`können`) ends the phrase
// before the marked word, which is then no dative.
const phraseBreakingWords = new Set([
  "ihnen", "denen", "haben", "können", "müssen", "sollen", "wollen",
  "dürfen", "werden", "möchten", "helfen", "arbeiten", "erhalten",
  "bekommen", "finden", "lernen", "stehen", "gehen", "kommen", "sehen"
]);
// `die vielen Unterstützer` is no dative: after an article or possessive
// the quantifier has its weak ending.
const quantifierTriggers = new Set(["vielen", "einigen", "wenigen", "mehreren", "beiden"]);
const determinerLikeWords = new Set([
  "den", "unseren", "ihren", "euren", "meinen", "deinen", "seinen",
  "keinen", "diesen", "jenen", "allen", "vielen", "einigen", "mehreren",
  "beiden"
]);
// Quantity nouns keep the dative of the following noun
// (`von Tausenden Unterstützer:innen` → `Unterstützern`).
const quantityNouns = new Set([
  "dutzenden", "hunderten", "tausenden", "zehntausenden",
  "hunderttausenden", "millionen"
]);

function isDativeNounPhrase(prefix: string): boolean {
  const words = prefix.trim().split(/\s+/u);
  // After a bare quantifier only adjectives may follow (`In einigen Fällen
  // wurden Bewerber*innen` is no phrase).
  const quantifier = quantifierTriggers.has(words[0]!.toLocaleLowerCase("de-DE"));
  return words.every((word, index) => {
    if (index === 0) return true;
    if (phraseBreakingWords.has(word)) return false;
    if (quantifier) return word === word.toLocaleLowerCase("de-DE");
    // A capitalized word is a noun (`Seit Wochen`) unless it is a
    // determiner in polite form (`mit Ihren`), a quantity noun
    // (`von Tausenden`) or an adjective in a name right after a
    // determiner (`den Jungen …`).
    const lower = word.toLocaleLowerCase("de-DE");
    return word === lower ||
      determinerLikeWords.has(lower) ||
      quantityNouns.has(lower) ||
      determinerLikeWords.has((words[index - 1] ?? "").toLocaleLowerCase("de-DE"));
  });
}

function mapDativePlural(base: string): string | undefined {
  const plural = mapMappedPlural(base) ?? mapKnownPlural(base);
  if (plural === undefined) return undefined;
  // Reguläre Dativplurale enden auf -n; die vorhandenen -n/-s-Plurale
  // bekommen keine zusätzliche Endung.
  if (/[ns]$/iu.test(plural)) return plural;
  const uppercase = plural === plural.toLocaleUpperCase("de-DE");
  return plural + (uppercase ? "N" : "n");
}

// Aufzählungen werden nur bei eindeutigem Dativauslöser als Ganzes flexiert.
// Glieder, die eine frühere Regel schon in den Dativ gesetzt hat
// (`von Biologen, Physikern und Ingenieur*innen`), gehören weiter dazu.
const enumerationItem = String.raw`(?:${markedWord}|\p{L}[\p{L}\p{M}’'-]*n(?![\p{L}\p{M}]))`;
const dativeEnumerationPattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}])((?:mit|bei|von|zu|aus|nach|seit|den|unseren|ihren|euren|meinen|deinen|seinen|keinen|diesen|jenen|allen)\s+)((?:${enumerationItem}[ \t]*,[ \t]*)+${enumerationItem}[ \t]+(?:und|oder|sowie)[ \t]+${enumerationItem})(?![\p{L}\p{M}-])`,
  "giu"
);
const markedWordPattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}])([\p{L}\p{M}’'-]+)((?:[/∕⁄／]-?|[:*_·•.’‘'])innen|\(-?innen\)|[/∕⁄／]inne[/∕⁄／]n)`,
  "giu"
);
const dativeLeadingContextPattern =
  /(?:^|[\s(])((?:mit|bei|von|zu|aus|nach|seit|den|unseren|ihren|euren|meinen|deinen|seinen|keinen|diesen|jenen|allen|(?<!(?:die|diese|jene|unsere|ihre|eure|meine|deine|seine|keine|alle|der)\s)(?:vielen|einigen|wenigen|mehreren|beiden)|(?<!Jugend\s)(?:danken|dankt|gratulieren|gratuliert|helfen|hilft|vertrauen|vertraut|begegnen|begegnet|zuhören))\s+(?:(?:[\p{L}\p{M}-]+en)\s+){0,3})$/iu;

function transformDativeEnumeration(input: string): TransformResult {
  let replacements = 0;
  const text = input.replace(
    dativeEnumerationPattern,
    (original: string, prefix: string, list: string) => {
      const basen = [...list.matchAll(markedWordPattern)];
      const flektiert = basen.map((match) => mapDativePlural(match[1] ?? ""));
      // The `i` flag of the pattern also lets lowercase words through.
      const items = list.split(/[ \t]*,[ \t]*|[ \t]+(?:und|oder|sowie)[ \t]+/u);
      if (basen.length === 0 || items.length < 3 || items.some((item) => !uppercaseStartPattern.test(item)) ||
          flektiert.some((wort) => wort === undefined)) {
        return original;
      }
      let index = 0;
      const ausgabe = list.replace(markedWordPattern, () => flektiert[index++] ?? "");
      replacements += basen.length;
      return prefix + ausgabe;
    }
  );
  return { text, replacements };
}

// A dative verb governs the plural only where it is not its subject; then a
// determiner after the verb can still be the trigger (`Vertrauen unseren
// Lehrer*innen gegenüber`).
const triggerAfterVerb =
  /^\S+\s+(?:den|unseren|ihren|euren|meinen|deinen|seinen|keinen|diesen|jenen|allen|vielen|einigen|wenigen|mehreren|beiden)\s/iu;

function isGoverned(prefix: string, offset: number, length: number, source: string): boolean {
  const verb = prefix.trim().split(/\s+/u)[0]!;
  if (!dativeVerbPattern.test(verb)) return true;
  return verbGovernsPlural(verb, source.slice(Math.max(0, offset - 200), offset),
    source.slice(offset + length, offset + length + 80)) || triggerAfterVerb.test(prefix);
}

// Binnen-I (`von LehrerInnen` → `von Lehrern`) needs a case-sensitive `Innen`;
// with the i flag, ordinary feminine plurals (`Lehrerinnen`) would match.
const caseInsensitiveTriggers = ["mit", "bei", "von", "zu", "aus", "nach", "seit",
  "den", "unseren", "ihren", "euren", "meinen", "deinen", "seinen", "keinen",
  "diesen", "jenen", "allen", "vielen", "einigen", "wenigen", "mehreren", "beiden",
  "danken", "dankt", "gratulieren", "gratuliert", "helfen", "hilft", "vertrauen", "vertraut",
  "begegnen", "begegnet", "zuhören"]
  .map((word) => [...word].map((letter) =>
    `[${letter}${letter.toLocaleUpperCase("de-DE")}]`).join(""))
  .join("|");
const binnenIDativePattern = new RegExp(
  // A Binnen-I noun or `gegen` is no attribute (`von SchülerInnen gegen LehrerInnen`).
  String.raw`(?<![\p{L}\p{M}])((?:${caseInsensitiveTriggers})\s+(?:(?![\p{L}\p{M}-]*Innen\s|gegen\s)[\p{L}\p{M}-]+en\s+){0,3})([\p{L}\p{M}’'-]*\p{Ll})Innen(?![\p{L}\p{M}-])`,
  "gu"
);

function transformMarkedDativePlural(input: string): TransformResult {
  if (!/inn/iu.test(input)) return {text: input, replacements: 0};
  if (!/mit|bei|von|zu|aus|nach|seit|den|unseren|ihren|euren|meinen|deinen|seinen|keinen|diesen|jenen|allen|vielen|einigen|wenigen|mehreren|beiden|dank|gratul|helf|hilft|vertrau|begegn|zuhör/iu.test(input)) return {text: input, replacements: 0};
  const aufzählung = transformDativeEnumeration(input);
  let replacements = aufzählung.replacements;
  const text = aufzählung.text.replace(
    dativePhrasePattern,
    (
      original: string,
      prefix: string,
      first: string,
      _firstMarker: string,
      conjunction: string | undefined,
      second: string | undefined,
      secondMarker: string | undefined,
      offset: number,
      source: string
    ) => {
      if (!isDativeNounPhrase(prefix) || !isGoverned(prefix, offset, original.length, source)) return original;
      const mappedFirst = mapDativePlural(first);
      if (mappedFirst === undefined) return original;
      replacements += 1;
      if (!conjunction || !second || !secondMarker) {
        return prefix + mappedFirst;
      }
      const mappedSecond = mapDativePlural(second);
      if (mappedSecond === undefined) {
        return prefix + mappedFirst + conjunction + second + secondMarker;
      }
      replacements += 1;
      return prefix + mappedFirst + conjunction + mappedSecond;
    }
  );
  const binnenI = binnenIPluralPattern.test(text) ? text.replace(
    binnenIDativePattern,
    (original: string, prefix: string, base: string, offset: number, source: string) => {
      if (!isDativeNounPhrase(prefix) || !isGoverned(prefix, offset, original.length, source)) return original;
      const mapped = mapDativePlural(base);
      if (mapped === undefined) return original;
      replacements += 1;
      return prefix + mapped;
    }
  ) : text;
  return { text: binnenI, replacements };
}

export const markedDativePluralRule: Rule = {
  id: "plural.marked-dative-context",
  risk: "safe",
  apply: transformMarkedDativePlural,
  leadingContextCandidate: markedLeadingCandidate,
  leadingContextRequiresTrailingWhitespace: true,
  applyWithLeadingContext(input, leadingContext) {
    // The separating whitespace may begin this text instead of ending the context.
    const space = /^[ \t]*/u.exec(input)?.[0] ?? "";
    const auslöser = dativeLeadingContextPattern.exec(leadingContext + space)?.[1];
    if (!auslöser) return transformMarkedDativePlural(input);

    const prefix = auslöser.slice(0, auslöser.length - space.length);
    const result = transformMarkedDativePlural(prefix + input);
    if (!result.text.startsWith(prefix)) return transformMarkedDativePlural(input);
    return { text: result.text.slice(prefix.length), replacements: result.replacements };
  }
};
