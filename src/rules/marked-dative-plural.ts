import type { Rule, TransformResult } from "../core/rule";
import { mapMappedPlural } from "./mapped-plural-separators";
import { mapKnownPlural } from "./known-plural-separators";
import {markedPluralWordSource as markedWord, markedLeadingCandidate} from "./context-candidates";
import { dativeVerbPattern, directionalTwoWayPreposition, listStartsNewClause, verbGovernsPlural } from "./dative-verbs";
import { coordinatedAdjective, namesPersons } from "./marker-source-repairs";
import { mapSupplementalPlural } from "./additional-person-forms";

// Regex literals with Unicode property escapes stay at module level: Pale
// Moon compiles such a literal again each time a function evaluates it.
const uppercaseStartPattern = /^\p{Lu}/u;
const binnenIPluralPattern = /\p{Ll}Innen/u;

// Nur lexikalisch bekannte, markierte Pluralformen werden in eindeutig
// dativischen Wortgruppen mit der passenden Dativendung versehen.
// Die gewohnte allgemeine Pluralregel bleibt für alle anderen Kontexte zuständig.
const dativePhrasePattern =
  /(?<![\p{L}\p{M}])((?:mit|bei|von|(?<!bis\s)zu|zu(?!\s+(?:\d|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|zwanzig|dreißig|vierzig|fünfzig|hundert|tausend)(?![\p{L}\p{M}]))|aus|nach|seit|neben|zwischen|den|unseren|ihren|euren|meinen|deinen|seinen|keinen|diesen|jenen|allen|(?<!(?:die|diese|jene|unsere|ihre|eure|meine|deine|seine|keine|alle|der)\s)(?:vielen|einigen|wenigen|mehreren|beiden)|(?<!Jugend\s)(?:danken|dankt|gratulieren|gratuliert|helfen|hilft|vertrauen|vertraut|begegnen|begegnet|zuhören|folgen|folgt|erzählen|erzählt))\s+(?:(?:teilweise|insgesamt|rund|etwa|circa|knapp|fast|mindestens|maximal|höchstens|bis\s+zu|mehr\s+als|weniger\s+als|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|zwanzig|dreißig|vierzig|fünfzig|hundert|tausend|Hundert|Tausend|Dutzend|(?!(?:1[89]|20)\d\d\s|\d{1,2}\.\d{1,2}\.)\d[\d.]*)\s+){0,4}(?:(?!(?:neben|nehmen)\s)(?:[\p{L}\p{M}-]+en)\s+){0,3})([\p{L}\p{M}’'-]+)((?:(?:[/∕⁄／]-?|[:*_·•.’‘'])innen|\(-?innen\)|[/∕⁄／]inne[/∕⁄／]n))(?![\p{L}\p{M}-])(?:([ \t]+und[ \t]+)([\p{L}\p{M}’'-]+)((?:(?:[/∕⁄／]-?|[:*_·•.’‘'])innen|\(-?innen\)|[/∕⁄／]inne[/∕⁄／]n))(?![\p{L}\p{M}-]))?/giu;

// Words between trigger and noun must form one noun phrase: lowercase
// determiners and adjectives on -en. A capitalized noun (`Seit Wochen`),
// a pronoun (`Mit ihnen`) or an auxiliary (`können`) ends the phrase
// before the marked word, which is then no dative.
const phraseBreakingWords = new Set([
  "ihnen", "denen", "haben", "können", "müssen", "sollen", "wollen",
  "dürfen", "werden", "möchten", "helfen", "arbeiten", "erhalten",
  "bekommen", "finden", "lernen", "stehen", "gehen", "kommen", "sehen", "nehmen"
]);
// `die vielen Unterstützer` is no dative: after an article or possessive
// the quantifier has its weak ending. Degree adverbs may stand between
// (`Die sehr vielen …`), a genitive determiner counts too (`ihrer wenigen
// lauten Gegner*innen`), and a coordination shares the article of its
// first item (`für die Menschen und vielen MitarbeiterInnen`).
const quantifierTriggers = new Set(["vielen", "einigen", "wenigen", "mehreren", "beiden"]);
// The patterns run without the `i` flag, so `\p{Ll}` only takes lowercase
// adverbs; determiners are written with both initial cases.
const bothCases = (words: string) => words.split("|")
  .map((word) => `[${word[0]}${word[0]!.toLocaleUpperCase("de-DE")}]${word.slice(1)}`).join("|");
// `mit der Schule und vielen …` keeps the dative: only plural forms share it.
const weakQuantifierDeterminer = bothCases("die|diese|jene|unsere|ihre|eure|meine|deine|seine|keine|alle|welche");
// Genitive forms only right before the quantifier: `, der auch vielen
// Einwohner*innen` is a relative pronoun.
const genitiveQuantifierDeterminer = bothCases("der|des|dieser|jener|unserer|ihrer|eurer|meiner|deiner|seiner|keiner|aller|welcher");
// Any uninflected lowercase word works as a degree adverb (`Die überaus
// vielen …`, `Die inzwischen vielen …`), but no preposition or conjunction.
const degreeAdverbs = String.raw`(?:(?!(?:unter|über|in|an|auf|aus|bei|mit|nach|von|zu|für|gegen|ohne|um|durch|vor|hinter|neben|zwischen|und|oder|sowie)\s)(?:\p{Ll}+(?<![en])|ausgesprochen|inzwischen|vollkommen|verschwindend)\s+)*`;
const weakQuantifierBefore = new RegExp(
  String.raw`(?:^|[^\p{L}\p{M}])(?:(?:${weakQuantifierDeterminer})\s+${degreeAdverbs}|(?:${genitiveQuantifierDeterminer})\s+)$`, "u");
const coordinatedQuantifierBefore = new RegExp(
  String.raw`(?:^|[^\p{L}\p{M}])(?:${weakQuantifierDeterminer})\s+(?:[\p{L}\p{M}-]+\s+){0,2}?[\p{L}\p{M}-]+\s+(?:und|oder|sowie)\s+${degreeAdverbs}$`, "u");
const datives = new Set(["den", "unseren", "ihren", "euren", "meinen", "deinen", "seinen",
  "keinen", "diesen", "jenen", "allen"]);
const uppercaseWordBeforeConjunction = /(?:^|\s)\p{Lu}[\p{L}\p{M}-]*\s+(?:und|oder|sowie)\s+(?:\p{Ll}+\s+)*$/u;

function weakQuantifier(prefix: string, textBefore: string): boolean {
  const [first, ...rest] = prefix.trim().toLocaleLowerCase("de-DE").split(/\s+/u);
  if (!quantifierTriggers.has(first!)) return false;
  // A dative determiner of its own follows (`die beiden den topgesetzten …`).
  if (rest.some((word) => datives.has(word))) return false;
  if (weakQuantifierBefore.test(textBefore)) return true;
  return uppercaseWordBeforeConjunction.test(textBefore) &&
    coordinatedQuantifierBefore.test(textBefore);
}
const determinerLikeWords = new Set([
  "den", "unseren", "ihren", "euren", "meinen", "deinen", "seinen",
  "keinen", "diesen", "jenen", "allen", "vielen", "einigen", "mehreren",
  "beiden"
]);
// Quantity nouns keep the dative of the following noun
// (`von Tausenden Unterstützer:innen` → `Unterstützern`).
const quantityNouns = new Set([
  "dutzend", "hundert", "tausend", "dutzenden", "hunderten", "tausenden", "zehntausenden",
  "hunderttausenden", "millionen"
]);

const triggerPrepositions = new Set(["mit", "bei", "von", "zu", "aus", "nach", "seit", "neben", "zwischen"]);
const nameAdjectives = new Set(["neuen", "grünen", "freien", "vereinten", "deutschen",
  "europäischen", "roten", "weißen", "schwarzen"]);

// `Wir danken den von den Schulen entsandten …`: the outer determiner is a
// dative; after `ohne die von den …` it is not.
const outerDativeBefore = /(?:^|\s)(?:den|allen|unseren|ihren|euren|meinen|deinen|seinen|keinen|diesen|jenen)\s+$/iu;
const participlePattern = /^\p{Ll}[\p{L}\p{M}]*(?:ten|enen|nden)$/u;
const embeddedDeterminers = new Set(["den", "dem", "der"]);

function isDativeNounPhrase(prefix: string, outerDative = false): boolean {
  const words = prefix.trim().split(/\s+/u);
  // After a bare quantifier only adjectives may follow (`In einigen Fällen
  // wurden Bewerber*innen` is no phrase).
  const quantifier = quantifierTriggers.has(words[0]!.toLocaleLowerCase("de-DE"));
  return words.every((word, index) => {
    if (index === 0) return true;
    if (phraseBreakingWords.has(word)) return false;
    if (quantifier) return word === word.toLocaleLowerCase("de-DE") || quantityNouns.has(word.toLocaleLowerCase("de-DE"));
    // A capitalized word is a noun (`Seit Wochen`) unless it is a
    // determiner in polite form (`mit Ihren`), a quantity noun
    // (`von Tausenden`) or an adjective in a name right after a
    // determiner (`den Jungen …`).
    const lower = word.toLocaleLowerCase("de-DE");
    // A lowercase word after such a capitalized word is a verb (`Auf den
    // Bühnen treffen Politiker:innen …`).
    const previous = words[index - 1] ?? "";
    const previousLower = previous.toLocaleLowerCase("de-DE");
    // A new determiner or trigger, or an adjective in a name (`den Neuen
    // deutschen Medienmachern`), continues it.
    // An embedded participle attribute continues it too (`den von den
    // Schulen entsandten Lehrer:innen`), unless its preposition is the
    // trigger itself (`von den Verletzten gewählten …`).
    const embeddedParticiple = participlePattern.test(word) && index >= 3 &&
      embeddedDeterminers.has((words[index - 2] ?? "").toLocaleLowerCase("de-DE")) &&
      triggerPrepositions.has((words[index - 3] ?? "").toLocaleLowerCase("de-DE")) &&
      (index >= 4 || outerDative);
    if (word === lower && index > 1 && previous !== previousLower &&
        !determinerLikeWords.has(previousLower) && !quantityNouns.has(previousLower) &&
        !determinerLikeWords.has(lower) && !triggerPrepositions.has(lower) &&
        !nameAdjectives.has(previousLower) && !embeddedParticiple) return false;
    return word === lower ||
      determinerLikeWords.has(lower) ||
      quantityNouns.has(lower) ||
      determinerLikeWords.has((words[index - 1] ?? "").toLocaleLowerCase("de-DE"));
  });
}

function mapDativePlural(base: string): string | undefined {
  // Compounds the supplemental forms read (`mit Humanmediziner*innen`).
  const plural = mapMappedPlural(base) ?? mapKnownPlural(base) ?? mapSupplementalPlural(base);
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
  String.raw`(?<![\p{L}\p{M}])((?:mit|bei|von|zu|aus|nach|seit|neben|zwischen|den|unseren|ihren|euren|meinen|deinen|seinen|keinen|diesen|jenen|allen)\s+)((?:${enumerationItem}[ \t]*,[ \t]*)+${enumerationItem}[ \t]+(?:und|oder|sowie)[ \t]+${enumerationItem})(?![\p{L}\p{M}-])`,
  "giu"
);
const markedWordPattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}])([\p{L}\p{M}’'-]+)((?:[/∕⁄／]-?|[:*_·•.’‘'])innen|\(-?innen\)|[/∕⁄／]inne[/∕⁄／]n)`,
  "giu"
);
const dativeLeadingContextPattern =
  /(?:^|[\s(])((?:mit|bei|von|zu|aus|nach|seit|neben|zwischen|den|unseren|ihren|euren|meinen|deinen|seinen|keinen|diesen|jenen|allen|(?<!(?:die|diese|jene|unsere|ihre|eure|meine|deine|seine|keine|alle|der)\s)(?:vielen|einigen|wenigen|mehreren|beiden)|(?<!Jugend\s)(?:danken|dankt|gratulieren|gratuliert|helfen|hilft|vertrauen|vertraut|begegnen|begegnet|zuhören|folgen|folgt|erzählen|erzählt))\s+(?:(?:[\p{L}\p{M}-]+en)\s+){0,3})$/iu;

// After `den` an unmarked first item must name persons (`Wir sehen den Mann,
// Lehrer:innen und …` is an accusative singular). After a person plural the
// preposition with an item without persons is its attribute, and the list
// coordinates with that plural (`Mitarbeitende von Stiftungen, Politiker:innen
// sowie …`).
const markedItemPattern = new RegExp(String.raw`^${markedWord}$`, "iu");
const personPluralBefore = /(\p{Lu}[\p{L}\p{M}*:_\/·•’'-]*(?:e|en|er|innen|Innen|s))\s+$/u;
const dativePluralEnding = /(?:en|rn|ln)$/u;
const dativeBeforePlural = /(?:^|\s)(?:mit|bei|von|zu|aus|nach|seit|zwischen|unter|vor|neben|den|allen)\s+(?:\S+\s+){0,2}$/iu;

function firstItemBelongs(prefix: string, first: string, textBefore: string): boolean {
  if (markedItemPattern.test(first) || namesPersons(first)) return true;
  if (prefix.trim().toLocaleLowerCase("de-DE") === "den") return dativePluralEnding.test(first);
  const previous = personPluralBefore.exec(textBefore);
  if (!previous || !namesPersons(previous[1]!)) return true;
  // That plural is a dative object itself (`zwischen Spieler:innen mit
  // Behinderungen, Vereinen und Trainer:innen`): either reading takes the dative.
  return dativeBeforePlural.test(textBefore.slice(0, previous.index));
}

function transformDativeEnumeration(input: string): TransformResult {
  let replacements = 0;
  const text = input.replace(
    dativeEnumerationPattern,
    (original: string, prefix: string, list: string, offset: number, source: string) => {
      const basen = [...list.matchAll(markedWordPattern)];
      const flektiert = basen.map((match) => mapDativePlural(match[1] ?? ""));
      // The `i` flag of the pattern also lets lowercase words through.
      const items = list.split(/[ \t]*,[ \t]*|[ \t]+(?:und|oder|sowie)[ \t]+/u);
      if (basen.length === 0 || items.length < 3 || items.some((item) => !uppercaseStartPattern.test(item)) ||
          !firstItemBelongs(prefix, items[0]!, source.slice(0, offset)) ||
          listStartsNewClause(source.slice(0, offset), source.slice(offset + original.length)) ||
          directionalTwoWayPreposition(prefix.trim(), source.slice(0, offset), source.slice(offset + original.length)) ||
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
  if (directionalTwoWayPreposition(verb, source.slice(Math.max(0, offset - 120), offset),
    source.slice(offset + length))) return false;
  if (!dativeVerbPattern.test(verb)) return true;
  return verbGovernsPlural(verb, source.slice(Math.max(0, offset - 200), offset),
    source.slice(offset + length, offset + length + 80)) || triggerAfterVerb.test(prefix);
}

// Binnen-I (`von LehrerInnen` → `von Lehrern`) needs a case-sensitive `Innen`;
// with the i flag, ordinary feminine plurals (`Lehrerinnen`) would match.
const caseInsensitiveTriggers = ["mit", "bei", "von", "zu", "aus", "nach", "seit", "neben", "zwischen",
  "den", "unseren", "ihren", "euren", "meinen", "deinen", "seinen", "keinen",
  "diesen", "jenen", "allen", "vielen", "einigen", "wenigen", "mehreren", "beiden",
  "danken", "dankt", "gratulieren", "gratuliert", "helfen", "hilft", "vertrauen", "vertraut",
  "begegnen", "begegnet", "zuhören", "folgen", "folgt", "erzählen", "erzählt"]
  .map((word) => [...word].map((letter) =>
    `[${letter}${letter.toLocaleUpperCase("de-DE")}]`).join(""))
  .join("|");
const binnenIDativePattern = new RegExp(
  // A Binnen-I noun or `gegen` is no attribute (`von SchülerInnen gegen LehrerInnen`).
  String.raw`(?<![\p{L}\p{M}])((?:${caseInsensitiveTriggers})\s+(?:(?![\p{L}\p{M}-]*Innen\s|gegen\s|neben\s|nehmen\s)[\p{L}\p{M}-]+en\s+){0,3})([\p{L}\p{M}’'-]*\p{Ll})Innen(?![\p{L}\p{M}-])`,
  "gu"
);

function transformMarkedDativePlural(input: string): TransformResult {
  if (!/inn/iu.test(input)) return {text: input, replacements: 0};
  if (!/mit|bei|von|zu|aus|nach|seit|neben|zwischen|den|unseren|ihren|euren|meinen|deinen|seinen|keinen|diesen|jenen|allen|vielen|einigen|wenigen|mehreren|beiden|dank|gratul|helf|hilft|vertrau|begegn|zuhör|folg|erzähl/iu.test(input)) return {text: input, replacements: 0};
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
      if (!isDativeNounPhrase(prefix, outerDativeBefore.test(source.slice(Math.max(0, offset - 20), offset))) ||
          weakQuantifier(prefix, source.slice(0, offset)) ||
          !isGoverned(prefix, offset, original.length, source)) return original;
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
      if (!isDativeNounPhrase(prefix, outerDativeBefore.test(source.slice(Math.max(0, offset - 20), offset))) ||
          weakQuantifier(prefix, source.slice(0, offset)) ||
          !isGoverned(prefix, offset, original.length, source)) return original;
      const mapped = mapDativePlural(base);
      if (mapped === undefined) return original;
      replacements += 1;
      return prefix + mapped;
    }
  ) : text;
  // Each pass takes one more list item (`bei Spielern, Helfern,
  // FunktionärInnen und SponsorInnen`).
  let listed = binnenI;
  for (let pass = 0; pass < 4; pass++) {
    const before = replacements;
    listed = listed.replace(dativeNeighbourPattern, (original: string, prefix: string, neighbour: string,
      base: string, offset: number, source: string) => {
      const after = source.slice(offset + original.length);
      const textBefore = source.slice(0, offset);
      if (!isUnambiguousDativePlural(neighbour) || listStartsNewClause(textBefore, after.replace(remainingItems, "")) ||
          // `der Beamten, Richter`: a weak plural after `der` is a genitive.
          genitiveDeterminerBefore.test(source.slice(Math.max(0, offset - 12), offset)) ||
          // `zu Schulbegleitern, IT-Techniker*innen absolvieren`: a last comma
          // item with a verb right after it starts a new clause.
          (commaBeforeItem.test(prefix) && verbAfterItem.test(after))) return original;
      const mapped = mapDativePlural(base);
      if (mapped === undefined) return original;
      replacements += 1;
      return prefix + mapped;
    });
    listed = listed.replace(dativeRightNeighbourPattern, (original: string, base: string, neighbour: string,
      offset: number, source: string) => {
      const neighbourEnd = source.indexOf(neighbour, offset + original.length) + neighbour.length;
      // Only inside a list (`von Politik, Arbeitgeber:innen und …`), not when
      // the neighbour belongs to an attribute (`Künstler:innen und allen
      // Lehrern bekannte Autoren`).
      if (!listItemBefore.test(source.slice(Math.max(0, offset - 3), offset)) ||
          attributeAfterNeighbour.test(source.slice(neighbourEnd, neighbourEnd + 60)) ||
          !isUnambiguousDativePlural(neighbour)) return original;
      const mapped = mapDativePlural(base);
      if (mapped === undefined) return original;
      replacements += 1;
      return mapped;
    });
    if (replacements === before) break;
  }
  return { text: listed, replacements };
}

// A marked item next to a plural that can only be a dative takes the dative
// too: `mit Biologen, erfahrenen Physikern und Ingenieur:innen`, `mit Lehrern
// der Schule, Schüler:innen der Klasse …`, `mit Lehrern und, bei Bedarf,
// Schüler:innen`.
const dativeNeighbourPattern = new RegExp(
  String.raw`((?<![\p{L}\p{M}])(\p{Lu}[\p{L}\p{M}-]*n)(?:\s+(?:der|des)\s+(?:\p{Ll}[\p{L}\p{M}-]*\s+(?:und\s+\p{Ll}[\p{L}\p{M}-]*\s+)?)?\p{Lu}[\p{L}\p{M}-]*)?[ \t]*(?:,|[ \t](?:und|oder|sowie)(?:,[^,.;:!?]{1,30},)?)[ \t]+(?:\d+[ \t]+)?(?:${coordinatedAdjective}[ \t]+){0,2}(?:\p{Lu}[\p{L}\p{M}-]*er[ \t]+)?)([\p{L}\p{M}’'-]+?)(?:(?:[/∕⁄／]-?|[:*_·•’‘'])innen|\(-?innen\)|(?<=\p{Ll})Innen)(?![\p{L}\p{M}-])`,
  "gu"
);
// The neighbour may also follow: `von Politik, Arbeitgeber:innen und allen
// Verantwortungsträgern`.
const dativeRightNeighbourPattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}])([\p{L}\p{M}’'-]+?)(?:(?:[/∕⁄／]-?|[:*_·•’‘'])innen|\(-?innen\)|(?<=\p{Ll})Innen)(?=[ \t]*(?:,|[ \t](?:und|oder|sowie))[ \t]+(?:(?:allen|den|unseren|ihren|vielen)[ \t]+(?:\p{Ll}[\p{L}\p{M}-]*en[ \t]+){0,2}|(?:\p{Ll}[\p{L}\p{M}-]*en[ \t]+){1,2})(\p{Lu}[\p{L}\p{M}-]*n)(?![\p{L}\p{M}-]))`,
  "gu"
);

const genitiveDeterminerBefore = /(?:^|\s)(?:der|des|deren|dessen)\s+$/u;
const commaBeforeItem = /,[ \t]*(?:\d+[ \t]+)?(?:\p{Ll}[\p{L}\p{M}-]*en[ \t]+){0,2}$/u;
const verbAfterItem = /^\s+\p{Ll}[\p{L}\p{M}]*en\s/u;
const listItemBefore = /,[ \t]*$/u;
const attributeAfterNeighbour = /^\s+\p{Ll}[\p{L}\p{M}]*e[nrs]?\s+\p{Lu}/u;
// The text after the remaining list items.
const remainingItems = /^(?:\s*(?:,|\s(?:und|oder|sowie))\s*[\p{L}\p{M}*:_·•\/’'-]+)*/u;

// `Spielern`, `Funktionären`: the dative differs from the plural. `Biologen`
// or `Bauern` are plurals in every case; `Eltern` has no singular stem here.
// Only persons count (`Fertigteilhäusern` is no list partner).
function isUnambiguousDativePlural(word: string): boolean {
  if (!namesPersons(word)) return false;
  return [1, 2, 3].some((cut) => {
    const stem = word.slice(0, -cut);
    const plural = mapMappedPlural(stem) ?? mapKnownPlural(stem) ?? mapSupplementalPlural(stem);
    return plural !== undefined && plural !== word && mapDativePlural(stem) === word;
  });
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
