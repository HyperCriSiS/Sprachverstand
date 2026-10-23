import type { Rule, TransformResult } from "../core/rule";
import { mapMappedPlural } from "./mapped-plural-separators";
import { mapKnownPlural } from "./known-plural-separators";
import {markedPluralWordSource as markedWord, markedLeadingCandidate} from "./context-candidates";

// Nur lexikalisch bekannte, markierte Pluralformen werden in eindeutig
// dativischen Wortgruppen mit der passenden Dativendung versehen.
// Die gewohnte allgemeine Pluralregel bleibt für alle anderen Kontexte zuständig.
const dativePhrasePattern =
  /(?<![\p{L}\p{M}])((?:mit|bei|von|zu|aus|nach|seit|den|unseren|ihren|euren|meinen|deinen|seinen|keinen|diesen|jenen|allen|danken|dankt|gratulieren|gratuliert|helfen|hilft|vertrauen|vertraut|begegnen|folgen|zuhören)\s+(?:(?:[\p{L}\p{M}-]+en)\s+){0,3})([\p{L}\p{M}’'-]+)((?:(?:[/∕⁄／]-?|[:*_·•.’‘'])innen|\(-?innen\)|[/∕⁄／]inne[/∕⁄／]n))(?![\p{L}\p{M}-])(?:([ \t]+und[ \t]+)([\p{L}\p{M}’'-]+)((?:(?:[/∕⁄／]-?|[:*_·•.’‘'])innen|\(-?innen\)|[/∕⁄／]inne[/∕⁄／]n))(?![\p{L}\p{M}-]))?/giu;

// Words between trigger and noun must form one noun phrase: lowercase
// determiners and adjectives on -en. A capitalized noun (`Seit Wochen`),
// a pronoun (`Mit ihnen`) or an auxiliary (`können`) ends the phrase
// before the marked word, which is then no dative.
const phraseBreakingWords = new Set([
  "ihnen", "denen", "haben", "können", "müssen", "sollen", "wollen",
  "dürfen", "werden", "möchten", "helfen", "arbeiten", "erhalten",
  "bekommen", "finden", "lernen", "stehen", "gehen", "kommen", "sehen"
]);
// Verbs with a dative object: `Wir danken Lehrer:innen` → `Lehrern`.
const dativeVerbs = new Set([
  "danken", "dankt", "gratulieren", "gratuliert", "helfen", "hilft",
  "vertrauen", "vertraut", "begegnen", "folgen", "zuhören"
]);
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
  return words.every((word, index) => {
    // A dative verb counts only lowercase: `Vertrauen` is a noun.
    if (index === 0) return !dativeVerbs.has(word.toLocaleLowerCase("de-DE")) || dativeVerbs.has(word);
    if (phraseBreakingWords.has(word)) return false;
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
const dativeEnumerationPattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}])((?:mit|bei|von|zu|aus|nach|seit|den|unseren|ihren|euren|meinen|deinen|seinen|keinen|diesen|jenen|allen)\s+)((?:${markedWord}[ \t]*,[ \t]*)+${markedWord}[ \t]+und[ \t]+${markedWord})(?![\p{L}\p{M}-])`,
  "giu"
);
const markedWordPattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}])([\p{L}\p{M}’'-]+)((?:[/∕⁄／]-?|[:*_·•.’‘'])innen|\(-?innen\)|[/∕⁄／]inne[/∕⁄／]n)`,
  "giu"
);
const dativeLeadingContextPattern =
  /(?:^|[\s(])((?:mit|bei|von|zu|aus|nach|seit|den|unseren|ihren|euren|meinen|deinen|seinen|keinen|diesen|jenen|allen|danken|dankt|gratulieren|gratuliert|helfen|hilft|vertrauen|vertraut|begegnen|folgen|zuhören)\s+(?:(?:[\p{L}\p{M}-]+en)\s+){0,3})$/iu;

function transformDativeEnumeration(input: string): TransformResult {
  let replacements = 0;
  const text = input.replace(
    dativeEnumerationPattern,
    (original: string, prefix: string, list: string) => {
      const basen = [...list.matchAll(markedWordPattern)];
      const flektiert = basen.map((match) => mapDativePlural(match[1] ?? ""));
      if (basen.length < 3 || flektiert.some((wort) => wort === undefined)) {
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

// Binnen-I (`von LehrerInnen` → `von Lehrern`) needs a case-sensitive `Innen`;
// with the i flag, ordinary feminine plurals (`Lehrerinnen`) would match.
const caseInsensitiveTriggers = ["mit", "bei", "von", "zu", "aus", "nach", "seit",
  "den", "unseren", "ihren", "euren", "meinen", "deinen", "seinen", "keinen",
  "diesen", "jenen", "allen", "danken", "dankt", "gratulieren", "gratuliert", "helfen", "hilft",
  "vertrauen", "vertraut", "begegnen", "folgen", "zuhören"]
  .map((word) => [...word].map((letter) =>
    `[${letter}${letter.toLocaleUpperCase("de-DE")}]`).join(""))
  .join("|");
const binnenIDativePattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}])((?:${caseInsensitiveTriggers})\s+(?:(?:[\p{L}\p{M}-]+en)\s+){0,3})([\p{L}\p{M}’'-]*\p{Ll})Innen(?![\p{L}\p{M}-])`,
  "gu"
);

function transformMarkedDativePlural(input: string): TransformResult {
  if (!/inn/iu.test(input)) return {text: input, replacements: 0};
  if (!/mit|bei|von|zu|aus|nach|seit|den|unseren|ihren|euren|meinen|deinen|seinen|keinen|diesen|jenen|allen|dank|gratul|helf|hilft|vertrau|begegn|folg|zuhör/iu.test(input)) return {text: input, replacements: 0};
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
      secondMarker: string | undefined
    ) => {
      if (!isDativeNounPhrase(prefix)) return original;
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
  const binnenI = /\p{Ll}Innen/u.test(text) ? text.replace(
    binnenIDativePattern,
    (original: string, prefix: string, base: string) => {
      if (!isDativeNounPhrase(prefix)) return original;
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
