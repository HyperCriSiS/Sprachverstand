import type { Rule, TransformResult } from "../core/rule";
import { mapMappedPlural } from "./mapped-plural-separators";
import { mapKnownPlural } from "./known-plural-separators";
import {markedPluralWordSource as markedWord, markedLeadingCandidate} from "./context-candidates";
import { dativeVerbPattern, directionalTwoWayPreposition, verbGovernsPlural } from "./dative-verbs";
import { auxiliaryInfinitives, listStartsNewClause, numberWordSource } from "./clause-structure";
import { namesPersons } from "./marker-source-repairs";
import { mapSupplementalPlural } from "./additional-person-forms";
import { listGovernorBefore, listHeadsAfter, nonDativePersonPluralOnE } from "./noun-lists";

// Regex literals with Unicode property escapes stay at module level: Pale
// Moon compiles such a literal again each time a function evaluates it.
const binnenIPluralPattern = /\p{Ll}Innen/u;

// Nur lexikalisch bekannte, markierte Pluralformen werden in eindeutig
// dativischen Wortgruppen mit der passenden Dativendung versehen.
// Die gewohnte allgemeine Pluralregel bleibt für alle anderen Kontexte zuständig.
// An embedded participle attribute after the trigger (`den von den neuen
// Schulen entsandten`, `den von der Schule entsandten`).
const embeddedAttributeGap = String.raw`(?:(?:von|aus|mit|bei|zu|nach)\s+(?:den|dem|der|unseren|ihren|seinen|meinen|deinen|euren|diesen|unserer|ihrer|seiner|dieser)\s+(?:\p{Ll}[\p{L}\p{M}]*e[nr]?\s+)?\p{Lu}[\p{L}\p{M}-]*\s+\p{Ll}[\p{L}\p{M}]*(?:ten|enen|nden)\s+)?`;
// Counts and quantities between trigger and noun (`mit rund zehn`, `mit bis zu
// maximal 30`, `mit vielen Tausend`).
const quantityGap = String.raw`(?:(?:teilweise|insgesamt|rund|etwa|circa|ca\.|knapp|fast|mindestens|maximal|höchstens|über|gut|nahezu|annähernd|bis\s+zu|mehr\s+als|weniger\s+als|${numberWordSource}|Hundert|Tausend|Dutzend|(?!(?:1[89]|20)\d\d\s|\d{1,2}\.\d{1,2}\.)\d[\d.]*)\s+){0,4}`;
// Adverbs before a count (`bis zu maximal drei`, `mit rund zehn`).
const quantityAdverbs = "maximal|höchstens|mindestens|rund|etwa|circa|ca\\.|knapp|fast|gut|insgesamt|über";
const dativePhrasePattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}])((?:mit|bei|von|(?<!bis\s)zu|zu(?!\s+(?:(?:${quantityAdverbs})\s+)?(?:\d|${numberWordSource})(?![\p{L}\p{M}]))|aus|nach|seit|neben|zwischen|den|unseren|ihren|euren|meinen|deinen|seinen|keinen|diesen|jenen|allen|(?<!(?:die|diese|jene|unsere|ihre|eure|meine|deine|seine|keine|alle|der)\s)(?:vielen|einigen|wenigen|mehreren|beiden)|(?<!Jugend\s)(?:danken|dankt|gratulieren|gratuliert|helfen|hilft|vertrauen|vertraut|begegnen|begegnet|zuhören|folgen|folgt|erzählen|erzählt))\s+${embeddedAttributeGap}${quantityGap}(?:(?!(?:neben|nehmen|zwischen)\s)(?:[\p{L}\p{M}-]+en)\s+){0,3})([\p{L}\p{M}’'-]+)((?:(?:[/∕⁄／]-?|[:*_·•.’‘'])innen|\(-?innen\)|[/∕⁄／]inne[/∕⁄／]n))(?![\p{L}\p{M}-])(?:([ \t]+und[ \t]+)([\p{L}\p{M}’'-]+)((?:(?:[/∕⁄／]-?|[:*_·•.’‘'])innen|\(-?innen\)|[/∕⁄／]inne[/∕⁄／]n))(?![\p{L}\p{M}-]))?`, "giu");

// Words between trigger and noun must form one noun phrase: lowercase
// determiners and adjectives on -en. A capitalized noun (`Seit Wochen`),
// a pronoun (`Mit ihnen`) or an auxiliary (`können`) ends the phrase
// before the marked word, which is then no dative.
const phraseBreakingWords = new Set([
  "ihnen", "denen", ...auxiliaryInfinitives, "helfen", "arbeiten", "erhalten",
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
const embeddedDeterminers = new Set(["den", "dem", "der", "unseren", "ihren", "seinen", "meinen", "deinen", "euren",
  "diesen", "unserer", "ihrer", "seiner", "dieser"]);
const lowercaseWordPattern = /^\p{Ll}/u;

// Words of an embedded participle attribute: preposition, determiner,
// adjectives, noun and participle (`den von den neuen Schulen entsandten
// Lehrer:innen`, `den von der Schule entsandten …`), unless its preposition
// is the trigger itself (`von den Verletzten gewählten …`).
function embeddedAttributeWords(words: string[], outerDative: boolean): Set<number> {
  const covered = new Set<number>();
  for (let index = 3; index < words.length; index++) {
    if (!participlePattern.test(words[index]!) || lowercaseWordPattern.test(words[index - 1]!)) continue;
    let determiner = index - 2;
    while (determiner > 1 && lowercaseWordPattern.test(words[determiner]!) &&
      !embeddedDeterminers.has(words[determiner]!.toLocaleLowerCase("de-DE"))) determiner--;
    const preposition = determiner - 1;
    if (!embeddedDeterminers.has(words[determiner]!.toLocaleLowerCase("de-DE")) ||
        !triggerPrepositions.has(words[preposition]!.toLocaleLowerCase("de-DE")) ||
        !(preposition >= 1 || outerDative)) continue;
    for (let i = preposition; i <= index; i++) covered.add(i);
  }
  return covered;
}

function isDativeNounPhrase(prefix: string, outerDative = false): boolean {
  const words = prefix.trim().split(/\s+/u);
  // After a bare quantifier only adjectives may follow (`In einigen Fällen
  // wurden Bewerber*innen` is no phrase).
  const quantifier = quantifierTriggers.has(words[0]!.toLocaleLowerCase("de-DE"));
  const embedded = embeddedAttributeWords(words, outerDative);
  return words.every((word, index) => {
    if (index === 0 || embedded.has(index)) return true;
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
    if (word === lower && index > 1 && previous !== previousLower &&
        !determinerLikeWords.has(previousLower) && !quantityNouns.has(previousLower) &&
        !determinerLikeWords.has(lower) && !triggerPrepositions.has(lower) &&
        !nameAdjectives.has(previousLower)) return false;
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
  String.raw`(?<![\p{L}\p{M}])(?<![Bb]is\s+)((?:${caseInsensitiveTriggers})\s+${embeddedAttributeGap}${quantityGap}(?:(?![\p{L}\p{M}-]*Innen\s|gegen\s|neben\s|nehmen\s|zwischen\s)[\p{L}\p{M}-]+en\s+){0,3})([\p{L}\p{M}’'-]*\p{Ll})Innen(?![\p{L}\p{M}-])`,
  "gu"
);

function transformMarkedDativePlural(input: string): TransformResult {
  if (!/inn/iu.test(input)) return {text: input, replacements: 0};
  if (!/mit|bei|von|zu|aus|nach|seit|neben|zwischen|den|unseren|ihren|euren|meinen|deinen|seinen|keinen|diesen|jenen|allen|vielen|einigen|wenigen|mehreren|beiden|dank|gratul|helf|hilft|vertrau|begegn|zuhör|folg|erzähl/iu.test(input) &&
      !neighbourCandidate.test(input)) return {text: input, replacements: 0};
  let replacements = 0;
  const text = input.replace(
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
  const inList = binnenI.replace(markedPluralPattern, (original: string, base: string, offset: number, source: string) => {
    if (!inDativeList(offset, original.length, source)) return original;
    const mapped = mapDativePlural(base);
    if (mapped === undefined) return original;
    replacements += 1;
    return mapped;
  });
  return { text: inList, replacements };
}

// Items further down a dative list (`zwischen Berater*innen aus der Praxis
// und Wissenschaftler*innen`, `mit Richter*innen, …, Vertreter*innen des
// Zollkriminalamtes`): the list scanner finds the governing word.
const markedPluralPattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}])(\p{Lu}[\p{L}\p{M}’'-]*?)(?:(?:[/∕⁄／]-?|[:*_·•’‘'])innen|\(-?innen\)|(?<=\p{Ll})Innen)(?![\p{L}\p{M}-])`,
  "gu"
);

// Only an item after a list separator can belong to a list; most marked
// plurals stand alone, so this check spares the scanner.
const separatorBefore = /(?:,|\s(?:und|oder|sowie|bzw\.|&))\s+(?:\S+\s+){0,6}$/u;

function inDativeList(offset: number, length: number, source: string): boolean {
  if (!separatorBefore.test(source.slice(Math.max(0, offset - 100), offset))) return false;
  const start = Math.max(0, offset - 400);
  const list = listGovernorBefore(source.slice(start, offset), start);
  if (!list || (list.items === 0 && !(list.compound && list.word !== ""))) return false;
  const governor = list.word;
  const before = source.slice(0, list.index);
  const after = source.slice(offset + length);
  const rest = after.replace(remainingItems, "");
  // A last comma item with a verb right after it starts a new clause
  // (`Lehrer werden zu Schulbegleitern, IT-Techniker*innen absolvieren …`,
  // `nach Pécs, und Pécser:innen kamen …`).
  if ((list.separator === "," || commaConjunctionBefore.test(source.slice(Math.max(0, offset - 60), offset))) &&
      verbAfterItem.test(after)) return false;
  // A later item outside the dative ends it (`aus allen Bereichen des
  // zivilen Lebens, Akademiker:innen, Offiziere, …`).
  const following = listHeadsAfter(after.slice(0, 300));
  if (following.some(nonDativePersonPluralOnE)) return false;
  // A singular object before a comma continues only in a list with a
  // conjunction (`mit dem Bildungsministerium, Regionalregierungen und …`).
  if (list.singular && !list.conjunction && !listContinues.test(after)) return false;
  if (governor === "") {
    // Without a governing word only a neighbour that can only be a dative
    // makes the list one; `der Beamten, Richter*innen` is a genitive.
    // A bare neighbour after it counts only inside a longer list (`Freund*innen
    // oder Arbeitgebern erfahren …` is a source error).
    const right = following.length >= 2 ? following : listHeadsAfter(after.slice(0, 300), true);
    if (![...list.heads, ...right].some((word) => dativeCandidate.test(word) && isUnambiguousDativePlural(word)) ||
        genitiveDeterminerBefore.test(before.slice(-12)) || nonDativeDeterminerBefore.test(before.slice(-12))) return false;
    return !listStartsNewClause(before, rest);
  }
  const verb = dativeVerbPattern.test(governor);
  if (directionalTwoWayPreposition(governor, before, after)) return false;
  if (verb && !verbGovernsPlural(governor, before.slice(-200), after.slice(0, 80))) return false;
  if (listStartsNewClause(verb ? `${before}${governor} ` : before, rest)) return false;
  // Persons after a first item without persons, then a verb: a new clause
  // (`werden Teile von faschistischen Netzwerken, Journalist*innen oder
  // Schriftsteller*innen verbinden sich …`).
  if (!namesPersons(list.first) && verbWithPronounAfter.test(rest)) return false;
  // A repeated noun is a fixed phrase (`von Haus zu Haus, zwei Bewohner*innen`).
  if (before.trimEnd().endsWith(` ${list.first}`)) return false;
  return list.items === 0 || firstItemBelongs(governor, list.first, before);
}

// `die Beamten, Lehrer*innen …` is a nominative or accusative.
const nonDativeDeterminerBefore = /(?:^|\s)(?:die|diese|jene|alle|keine|meine|deine|seine|ihre|unsere|eure|welche|manche|viele|einige|beide)\s+$/iu;
const genitiveDeterminerBefore = /(?:^|\s)(?:der|des|deren|dessen)\s+$/u;
const verbAfterItem = /^\s+\p{Ll}[\p{L}\p{M}]*en\s/u;
// A comma only continues the list when an `und` item follows.
const listContinues = /^(?:\s*,\s*[^\s,]+)*\s+(?:und|oder|sowie)\s/u;
const commaConjunctionBefore = /,\s*(?:und|oder|aber)\s+(?:\S+\s+){0,2}$/u;
// A list item on -n next to a separator (`Wir haben Lehrern, Lehrer:innen …`).
const neighbourCandidate = /\p{Ll}n(?:,|\s+(?:und|oder|sowie))\s/u;
// Only an unmarked word on -n can be an unambiguous dative plural.
const dativeCandidate = /^[^:*_·•\/()]*\p{Ll}n$/u;
const verbWithPronounAfter = /^\s+\p{Ll}[\p{L}\p{M}]*en\s+(?:sich|wir|sie|uns|euch|es|man)(?![\p{L}\p{M}])/u;
// The text after the remaining list items.
const remainingItems = /^(?:\s*(?:,|\s(?:und|oder|sowie))\s*[\p{L}\p{M}*:_·•\/’'-]+)*/u;

// `Spielern`, `Funktionären`: the dative differs from the plural. `Biologen`
// or `Bauern` are plurals in every case; `Eltern` has no singular stem here.
// Only persons count (`Fertigteilhäusern` is no list partner).
function isUnambiguousDativePlural(word: string): boolean {
  if (!namesPersons(word)) return false;
  const plurals = [1, 2, 3].map((cut) => {
    const stem = word.slice(0, -cut);
    return {stem, plural: mapMappedPlural(stem) ?? mapKnownPlural(stem) ?? mapSupplementalPlural(stem)};
  });
  // A stem whose plural is the word itself makes it a nominative too
  // (`Beamten` from `Beamte`, even though `Beamt` would give the dative).
  if (plurals.some(({plural}) => plural === word)) return false;
  return plurals.some(({stem, plural}) => plural !== undefined && mapDativePlural(stem) === word);
}

// Everything up to the last sentence end of the preceding text.
const leadingSentencePattern = /^[^]*[.!?]\s+/u;

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

    // The clause before the trigger decides too (`Wir stellen uns neben
    // <em>Lehrer:innen</em>` places, no dative); it is used only while the
    // rule leaves it unchanged.
    const trigger = auslöser.slice(0, auslöser.length - space.length);
    const clause = leadingContext.slice(-160).replace(leadingSentencePattern, "");
    for (const prefix of [clause, trigger]) {
      if (!prefix.endsWith(trigger)) continue;
      const result = transformMarkedDativePlural(prefix + input);
      if (result.text.startsWith(prefix)) {
        return { text: result.text.slice(prefix.length), replacements: result.replacements };
      }
    }
    return transformMarkedDativePlural(input);
  }
};
