import type { Rule, TransformResult } from "../core/rule";
import {lazyPattern} from "../core/lazy-pattern";
import { contextSuffix } from "./context-suffix";
import type { GrammaticalCase } from "./person-lexicon";
import { preserveInnerCase } from "./inner-case";

interface DeterminerForm {
  readonly masculine: string;
  readonly grammaticalCase: GrammaticalCase;
  readonly strongNominative: boolean;
  readonly markerEnding: "r" | "n";
}

const locale = "de-DE";
const separators = [":", "*", "_", "/", "·", "•", ".", "’", "‘"] as const;
const adjectiveBases = [
  "abhängige",
  "abgeordnete",
  "alleinerziehende",
  "angeklagte",
  "angestellte",
  "angehörige",
  "anwesende",
  "arbeitslose",
  "arbeitsuchende",
  "asylsuchende",
  "bankangestellte",
  "beamte",
  "auszubildende",
  "befragte",
  "beauftragte",
  "behinderte",
  "bekannte",
  "beschäftigte",
  "beteiligte",
  "betroffene",
  "delegierte",
  "deutsche",
  "einzelne",
  "ehrenamtliche",
  "erkrankte",
  "erwachsene",
  "erwerbstätige",
  "erziehungsberechtigte",
  "fortgeschrittene",
  "freiberufliche",
  "freiwillige",
  "gefangene",
  "geflüchtete",
  "gelehrte",
  "geschädigte",
  "hilfebedürftige",
  "interessierte",
  "jugendliche",
  "kranke",
  "leistungsberechtigte",
  "minderjährige",
  "obdachlose",
  "pflegebedürftige",
  "reisende",
  "sachverständige",
  "schutzsuchende",
  "selbstständige",
  "stimmberechtigte",
  "überlebende",
  "unterhaltsberechtigte",
  "verbündete",
  "verantwortliche",
  "verdächtige",
  "verfolgte",
  "verletzte",
  "versicherte",
  "verstorbene",
  "vertraute",
  "verwandte",
  "volljährige",
  "vorgesetzte",
  "vorsitzende",
  "wahlberechtigte",
  "zugewanderte",
  "zuständige"
] as const;
// Marked participles name a person noun (`Mitarbeitende:r` → „Mitarbeiter“,
// `Studierende_r` → „Student“); weak nouns take -en outside the nominative.
const participleNouns = new Map<string, {readonly masculine: string; readonly weak: boolean}>([
  ["mitarbeitende", {masculine: "mitarbeiter", weak: false}],
  ["teilnehmende", {masculine: "teilnehmer", weak: false}],
  ["nutzende", {masculine: "nutzer", weak: false}],
  ["studierende", {masculine: "student", weak: true}],
  ["forschende", {masculine: "forscher", weak: false}],
  ["lehrende", {masculine: "lehrer", weak: false}],
  ["lesende", {masculine: "leser", weak: false}],
  ["zuhörende", {masculine: "zuhörer", weak: false}],
  ["arbeitnehmende", {masculine: "arbeitnehmer", weak: false}],
  ["arbeitgebende", {masculine: "arbeitgeber", weak: false}],
  ["dozierende", {masculine: "dozent", weak: true}],
  ["fördergebende", {masculine: "förderer", weak: false}],
  ["theatermachende", {masculine: "theatermacher", weak: false}]
]);
const adjectiveBaseSet = new Set<string>(adjectiveBases);
const adjectiveAlternation = [...adjectiveBases, ...participleNouns.keys()]
  .sort((left, right) => right.length - left.length)
  .join("|");
// Compounds keep their capitalized head (`Fachangestellte*r`,
// `Verwaltungsfachangestellte/-r`, `Projekt-Mitarbeitende:r`); at least three
// letters, so negations like `Unbekannte:r` stay outside the list.
const compoundPrefixSource = String.raw`\p{Lu}[\p{L}\p{M}]{2,}?-?`;
const compoundPrefix = String.raw`((?:${compoundPrefixSource})?)`;
const marker = String.raw`(?:[:*_·•.’‘]|\/-?)`;
const standalonePattern = lazyPattern(
  String.raw`(?<![\p{L}\p{M}])${compoundPrefix}(${adjectiveAlternation})(${marker})([rnm])(?![\p{L}\p{M}])`,
  "giu"
);
const determinerForms = new Map<string, DeterminerForm>();

function addDeterminer(
  left: string,
  right: string,
  masculine: string,
  grammaticalCase: GrammaticalCase,
  strongNominative: boolean,
  reverse = false
): void {
  for (const separator of separators) {
    determinerForms.set(`${left}${separator}${right}`, {
      masculine,
      grammaticalCase,
      strongNominative,
      markerEnding: grammaticalCase === "nominative" ? "r" : "n"
    });
    if (reverse) {
      determinerForms.set(`${right}${separator}${left}`, {
        masculine,
        grammaticalCase,
        strongNominative,
        markerEnding: grammaticalCase === "nominative" ? "r" : "n"
      });
    }
  }
}

addDeterminer("der", "die", "der", "nominative", false, true);
addDeterminer("den", "die", "den", "accusative", false, true);
addDeterminer("dem", "der", "dem", "dative", false, true);
addDeterminer("des", "der", "des", "genitive", false, true);
addDeterminer("ein", "e", "ein", "nominative", true);
addDeterminer("eine", "n", "einen", "accusative", false);
addDeterminer("einem", "einer", "einem", "dative", false);
addDeterminer("eines", "einer", "eines", "genitive", false);
addDeterminer("kein", "e", "kein", "nominative", true);
addDeterminer("keine", "n", "keinen", "accusative", false);
addDeterminer("keine", "m", "keinem", "dative", false);
addDeterminer("keines", "keiner", "keines", "genitive", false);
addDeterminer("jede", "r", "jeder", "nominative", false);
addDeterminer("jede", "n", "jeden", "accusative", false);
addDeterminer("jede", "m", "jedem", "dative", false);
addDeterminer("jedes", "jeder", "jedes", "genitive", false);
addDeterminer("welche", "r", "welcher", "nominative", false);
addDeterminer("welche", "n", "welchen", "accusative", false);
addDeterminer("welche", "m", "welchem", "dative", false);
addDeterminer("welches", "welcher", "welches", "genitive", false);
addDeterminer("diese", "r", "dieser", "nominative", false);
addDeterminer("diese", "n", "diesen", "accusative", false);
addDeterminer("diese", "m", "diesem", "dative", false);
addDeterminer("dieses", "dieser", "dieses", "genitive", false);
addDeterminer("jene", "r", "jener", "nominative", false);
addDeterminer("jene", "n", "jenen", "accusative", false);
addDeterminer("jene", "m", "jenem", "dative", false);
addDeterminer("jenes", "jener", "jenes", "genitive", false);

function addPossessive(base: string, feminineBase = `${base}e`): void {
  addDeterminer(base, "e", base, "nominative", true);
  addDeterminer(feminineBase, "n", `${base}en`, "accusative", false);
  addDeterminer(feminineBase, "m", `${base}em`, "dative", false);
  addDeterminer(`${base}es`, `${base}er`, `${base}es`, "genitive", false);
}

addPossessive("mein");
addPossessive("dein");
addPossessive("sein");
addPossessive("ihr");
addPossessive("unser");
addDeterminer("euer", "e", "euer", "nominative", true);
addDeterminer("eure", "n", "euren", "accusative", false);
addDeterminer("eure", "m", "eurem", "dative", false);
addDeterminer("eures", "eurer", "eures", "genitive", false);

const determinerAlternation = [...determinerForms.keys()]
  .sort((left, right) => right.length - left.length)
  .map((value) => value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"))
  .join("|");
const phrasePattern = lazyPattern(
  String.raw`(?<![\p{L}\p{M}])(${determinerAlternation})(\s+)(?:([\p{L}\p{M}-]*?\p{L}e)${marker}([rn])(\s+))?${compoundPrefix}(${adjectiveAlternation})(${marker})([rnms])(?![\p{L}\p{M}])`,
  "giu"
);

function applyTokenCase(source: string, replacement: string): string {
  const inner = preserveInnerCase(source, replacement);
  if (inner !== undefined) return inner;
  const lower = source.toLocaleLowerCase(locale);
  const upper = source.toLocaleUpperCase(locale);
  if (source === upper && source !== lower) {
    return replacement.toLocaleUpperCase(locale);
  }
  const first = [...source][0];
  if (first && first === first.toLocaleUpperCase(locale)) {
    const characters = [...replacement];
    const replacementFirst = characters.shift();
    return replacementFirst
      ? replacementFirst.toLocaleUpperCase(locale) + characters.join("")
      : replacement;
  }
  return replacement.toLocaleLowerCase(locale);
}

// The `i` flag also lets lowercase letters through the prefix's p{Lu}.
function isNounPrefix(prefix: string): boolean {
  const first = [...prefix][0];
  return first === undefined || first !== first.toLocaleLowerCase(locale);
}

// After a hyphen the head keeps its own case (`Solo-Selbstständiger`).
function withPrefix(prefix: string, base: string, replacement: string): string {
  return prefix && !prefix.endsWith("-")
    ? prefix + replacement
    : prefix + applyTokenCase(base, replacement);
}

function participleForm(normalized: string,
  grammaticalCase: GrammaticalCase | "oblique"): string | undefined {
  const noun = participleNouns.get(normalized);
  if (!noun) return undefined;
  if (grammaticalCase === "nominative") return noun.masculine;
  if (noun.weak) return noun.masculine + "en";
  return grammaticalCase === "genitive" ? noun.masculine + "s" : noun.masculine;
}

function adjectiveForm(
  prefix: string,
  sourceBase: string,
  grammaticalCase: GrammaticalCase,
  strongNominative: boolean
): string {
  const normalized = sourceBase.toLocaleLowerCase(locale);
  const participle = participleForm(normalized, grammaticalCase);
  if (participle) return withPrefix(prefix, sourceBase, participle);
  if (!adjectiveBaseSet.has(normalized)) {
    return prefix + sourceBase;
  }

  const ending =
    grammaticalCase === "nominative"
      ? strongNominative
        ? "r"
        : ""
      : "n";
  return withPrefix(prefix, sourceBase, normalized + ending);
}

function transformPhrases(input: string): TransformResult {
  let replacements = 0;
  const text = input.replace(
    phrasePattern(),
    (
      match: string,
      determiner: string,
      whitespace: string,
      attributive: string | undefined,
      attributiveEnding: string | undefined,
      attributiveWhitespace: string | undefined,
      prefix: string,
      base: string,
      _marker: string,
      ending: string
    ) => {
      const form = determinerForms.get(determiner.toLocaleLowerCase(locale));
      if (
        !form ||
        ending.toLocaleLowerCase(locale) !== form.markerEnding ||
        (attributiveEnding !== undefined &&
          attributiveEnding.toLocaleLowerCase(locale) !== form.markerEnding)
      ) {
        return match;
      }
      replacements += 1;
      // `eine:n Kaufmännische:n Angestellte:n`: the marked attributive
      // adjective follows the declension of the noun.
      const attributiveForm = attributive === undefined ? "" : attributive +
        (form.grammaticalCase === "nominative" ? form.strongNominative ? "r" : "" : "n") +
        attributiveWhitespace;
      return (
        applyTokenCase(determiner, form.masculine) +
        whitespace +
        attributiveForm +
        adjectiveForm(prefix, base, form.grammaticalCase, form.strongNominative)
      );
    }
  );
  return { text, replacements };
}

// An attributive adjective before a standalone form (`Medizinische/r
// Fachangestellte/r`, `Kaufmännische Angestellte*r`) takes the same strong
// ending. Plain adjectives only with a typical suffix; after a determiner the
// phrase rules decide.
const attributivePattern = lazyPattern(
  String.raw`(?<![\p{L}\p{M}])([\p{L}\p{M}-]*?\p{L}e)(?:${marker}([rn]))?(\s+)(?=(?:${compoundPrefixSource})?(?:${adjectiveAlternation})${marker}([rn])(?![\p{L}\p{M}]))`,
  "giu"
);
const plainAttributiveSuffix = /(?:isch|lich|ig)e$/iu;
const attributiveToken = /^(?:\p{Ll}[\p{L}\p{M}-]*e|[\p{L}\p{M}-]+(?:isch|lich|ig)e|[\p{L}\p{M}-]+e(?:[:*_·•.’‘]|\/-?)[rn])$/u;
// A determiner that needs another adjective ending (`die Angestellte/r`,
// `eine neue Angestellte*r`, `der Angestellte/r`) keeps the phrase; the
// marker cannot be resolved without rewriting it.
const blockingDeterminers = new Set([
  "der", "die", "das", "ein", "eine", "einer", "kein", "keine", "keiner",
  "jede", "jeder", "diese", "dieser", "jene", "jener", "welche", "welcher",
  "mein", "meine", "meiner", "dein", "deine", "deiner", "sein", "seine", "seiner",
  "ihr", "ihre", "ihrer", "unser", "unsere", "unserer", "euer", "eure", "eurer"
]);

function hasBlockingDeterminer(input: string, offset: number): boolean {
  const tokens = input.slice(Math.max(0, offset - 96), offset).split(/\s+/u);
  if (tokens.at(-1) !== "") return false;
  tokens.pop();
  let skipped = 0;
  while (tokens.length > 0 && skipped < 2 && attributiveToken.test(tokens.at(-1)!) &&
      !blockingDeterminers.has(tokens.at(-1)!.toLocaleLowerCase(locale))) {
    tokens.pop();
    skipped += 1;
  }
  const token = tokens.at(-1);
  return token !== undefined && blockingDeterminers.has(token.toLocaleLowerCase(locale));
}

function transformAttributives(input: string): TransformResult {
  let replacements = 0;
  const text = input.replace(
    attributivePattern(),
    (match: string, adjective: string, markedEnding: string | undefined,
      whitespace: string, nounEnding: string, offset: number, fullInput: string) => {
      const ending = nounEnding.toLocaleLowerCase(locale);
      if (markedEnding ? markedEnding.toLocaleLowerCase(locale) !== ending
        : !plainAttributiveSuffix.test(adjective)) return match;
      if (hasMarkedDeterminer(fullInput, offset) || hasBlockingDeterminer(fullInput, offset) ||
          determinerForms.has(adjective.toLocaleLowerCase(locale))) return match;
      replacements += 1;
      return adjective + ending + whitespace;
    }
  );
  return {text, replacements};
}

// Regex literals with Unicode property escapes stay at module level: Pale
// Moon compiles such a literal again each time a function evaluates it.
const beamterPattern = /(?<![\p{L}\p{M}])(\p{Lu}?[\p{L}\p{M}-]*?[Bb]eamt)er([:*_·•]|\/-?)in(?![\p{L}\p{M}])/gu;
const lastWordPattern = /([\p{L}\p{M}:*_\/·•.’‘-]+)\s+$/u;
const pluralContextWordPattern = /[\p{L}\p{M}\d:*_\/·•’‘-]+[.!?]?|[,;()]/gu;
const lowercaseEWordPattern = /^\p{Ll}+e$/u;
const lowercaseEnWordPattern = /^\p{Ll}+en$/u;

function hasMarkedDeterminer(input: string, index: number): boolean {
  const prefix = contextSuffix(input, index, 1);
  const match = lastWordPattern.exec(prefix);
  return Boolean(match?.[1] && determinerForms.has(match[1].toLocaleLowerCase(locale)));
}

function transformStandalone(input: string): TransformResult {
  let replacements = 0;
  const text = input.replace(
    standalonePattern(),
    (
      match: string,
      prefix: string,
      base: string,
      _separator: string,
      ending: string,
      offset: number,
      fullInput: string
    ) => {
      if (hasMarkedDeterminer(fullInput, offset) || hasBlockingDeterminer(fullInput, offset) ||
          !isNounPrefix(prefix)) {
        return match;
      }
      const normalizedEnding = ending.toLocaleLowerCase(locale);
      const normalized = base.toLocaleLowerCase(locale);
      const participle = participleForm(normalized, normalizedEnding === "r"
        ? "nominative" : normalizedEnding === "m" ? "dative" : "oblique");
      replacements += 1;
      return withPrefix(prefix, base, participle ?? normalized + normalizedEnding);
    }
  );
  return { text, replacements };
}

// Plural forms without the adjective's own -e, e.g. `Angestellt:innen`.
// The declension follows the preceding word: weak "-en" after articles,
// possessives, dative prepositions or -en adjectives; strong "-e" without a
// determiner or after quantifiers. Coordinations without a clear anchor stay.
const pluralStemAlternation = [...adjectiveBases]
  .map((base) => base.slice(0, -1))
  .sort((left, right) => right.length - left.length)
  .join("|");
const markedPluralPattern = lazyPattern(
  // Not after a hyphen (`ICE-Beamt:innen`): the word before the compound
  // gives no reliable declension; the general plural rules decide there.
  String.raw`(?<![\p{L}\p{M}-])(${pluralStemAlternation})(${marker}innen|innen)(?![\p{L}\p{M}])`,
  "giu"
);
const weakPluralTriggers = new Set([
  "die", "der", "den", "alle", "allen", "beide", "beiden", "diese", "diesen",
  "jene", "jenen", "welche", "welchen", "solche", "solchen", "keine", "keinen",
  "meine", "meinen", "deine", "deinen", "seine", "seinen", "ihre", "ihren",
  "unsere", "unseren", "eure", "euren", "sämtliche", "sämtlichen",
  "mit", "bei", "von", "zu", "zum", "zur", "aus", "nach", "seit", "gegenüber"
]);
const strongPluralTriggers = new Set([
  "viele", "einige", "mehrere", "wenige", "zahlreiche", "etliche", "manche",
  "andere", "weitere", "liebe", "zwei", "drei", "vier", "fünf", "für", "an", "über"
]);
const coordinationWords = new Set(["und", "oder", "sowie"]);

function pluralEnding(input: string, index: number): "en" | "e" | undefined {
  const words = (input.slice(Math.max(0, index - 120), index)
    .match(pluralContextWordPattern) ?? []);
  let position = words.length - 1;
  if (position >= 0 && coordinationWords.has(words[position]!.toLocaleLowerCase(locale))) {
    // `die Kolleg:innen und Angestellt:innen`: follow the first conjunct.
    position -= 2;
    if (position < -1) return undefined;
  }
  // Attributive -e adjectives (`viele neue …`) inherit the decision before them.
  while (position >= 0 && lowercaseEWordPattern.test(words[position]!) &&
      !weakPluralTriggers.has(words[position]!) && !strongPluralTriggers.has(words[position]!)) {
    position -= 1;
  }
  if (position < 0) return "e";
  const previous = words[position]!;
  const lower = previous.toLocaleLowerCase(locale);
  if (/^[,;(]$/u.test(previous)) return undefined;
  if (/[.!?]$/u.test(previous)) return "e";
  if (weakPluralTriggers.has(lower)) return "en";
  if (strongPluralTriggers.has(lower) || /^\d+$/u.test(lower)) return "e";
  if (lowercaseEnWordPattern.test(previous)) {
    // Only an -en adjective after a weak determiner (`die neuen …`); a verb
    // such as `suchen` gives no declension information.
    while (position >= 0 && lowercaseEnWordPattern.test(words[position]!) &&
        !weakPluralTriggers.has(words[position]!)) position -= 1;
    return position >= 0 && weakPluralTriggers.has(words[position]!.toLocaleLowerCase(locale))
      ? "en" : undefined;
  }
  // Sentence start or capitalized heading word: no determiner in reach.
  return previous[0] !== lower[0] ? "e" : undefined;
}

function transformMarkedPlurals(input: string): TransformResult {
  let replacements = 0;
  const text = input.replace(
    markedPluralPattern(),
    (match: string, stem: string, suffix: string, offset: number, fullInput: string) => {
      // Binnen-I needs the capital I; plain `-innen` words are not markers.
      if (suffix.startsWith("i") || suffix.startsWith("I") && suffix !== "Innen") return match;
      const ending = pluralEnding(fullInput, offset);
      if (!ending) return match;
      replacements += 1;
      return applyTokenCase(stem, stem.toLocaleLowerCase(locale) + ending);
    }
  );
  return { text, replacements };
}

export const substantivizedAdjectivesRule: Rule = {
  id: "adjective.substantivized-markers",
  risk: "safe",

  apply(input) {
    // `Beamter/in`: the strong masculine form with the feminine suffix, as the
    // marked adjective form `Beamte/r`, so determiner and attributes follow.
    if (input.includes("eamter") && beamterPattern.test(input)) {
      beamterPattern.lastIndex = 0;
      return substantivizedAdjectivesRule.apply(input.replace(beamterPattern, "$1e$2r"));
    }
    // All patterns require a marked adjective ending, never plain prose.
    const singular = /(?:[:*_·•.’‘]|\/-?)[rnms]/iu.test(input);
    const plural = /innen/iu.test(input);
    if (!singular && !plural) return {text: input, replacements: 0};
    const phraseResult = singular ? transformPhrases(input) : {text: input, replacements: 0};
    const attributiveResult = singular ? transformAttributives(phraseResult.text) : phraseResult;
    const standaloneResult = singular
      ? transformStandalone(attributiveResult.text)
      : attributiveResult;
    const pluralResult = plural ? transformMarkedPlurals(standaloneResult.text) : {text: standaloneResult.text, replacements: 0};
    return {
      text: pluralResult.text,
      replacements: phraseResult.replacements +
        (singular ? attributiveResult.replacements + standaloneResult.replacements : 0) +
        pluralResult.replacements
    };
  }
};
