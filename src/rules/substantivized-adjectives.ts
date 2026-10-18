import type { Rule, TransformResult } from "../core/rule";
import {lazyPattern} from "../core/lazy-pattern";
import { contextSuffix } from "./context-suffix";
import type { GrammaticalCase } from "./person-lexicon";

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
const adjectiveBaseSet = new Set<string>(adjectiveBases);
const adjectiveAlternation = [...adjectiveBases]
  .sort((left, right) => right.length - left.length)
  .join("|");
const marker = String.raw`[:*_\/·•.’‘]`;
const standalonePattern = lazyPattern(
  String.raw`(?<![\p{L}\p{M}])(${adjectiveAlternation})(${marker})([rnm])(?![\p{L}\p{M}])`,
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
  String.raw`(?<![\p{L}\p{M}])(${determinerAlternation})(\s+)(${adjectiveAlternation})(${marker})([rnms])(?![\p{L}\p{M}])`,
  "giu"
);

function applyTokenCase(source: string, replacement: string): string {
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

function adjectiveForm(
  sourceBase: string,
  grammaticalCase: GrammaticalCase,
  strongNominative: boolean
): string {
  const normalized = sourceBase.toLocaleLowerCase(locale);
  if (!adjectiveBaseSet.has(normalized)) {
    return sourceBase;
  }

  const ending =
    grammaticalCase === "nominative"
      ? strongNominative
        ? "r"
        : ""
      : "n";
  return applyTokenCase(sourceBase, normalized + ending);
}

function transformPhrases(input: string): TransformResult {
  let replacements = 0;
  const text = input.replace(
    phrasePattern(),
    (
      match: string,
      determiner: string,
      whitespace: string,
      base: string,
      _marker: string,
      ending: string
    ) => {
      const form = determinerForms.get(determiner.toLocaleLowerCase(locale));
      if (
        !form ||
        ending.toLocaleLowerCase(locale) !== form.markerEnding
      ) {
        return match;
      }
      replacements += 1;
      return (
        applyTokenCase(determiner, form.masculine) +
        whitespace +
        adjectiveForm(base, form.grammaticalCase, form.strongNominative)
      );
    }
  );
  return { text, replacements };
}

function hasMarkedDeterminer(input: string, index: number): boolean {
  const prefix = contextSuffix(input, index, 1);
  const match = /([\p{L}\p{M}:*_\/·•.’‘-]+)\s+$/u.exec(prefix);
  return Boolean(match?.[1] && determinerForms.has(match[1].toLocaleLowerCase(locale)));
}

function transformStandalone(input: string): TransformResult {
  let replacements = 0;
  const text = input.replace(
    standalonePattern(),
    (
      match: string,
      base: string,
      _separator: string,
      ending: string,
      offset: number,
      fullInput: string
    ) => {
      if (hasMarkedDeterminer(fullInput, offset)) {
        return match;
      }
      const normalizedEnding = ending.toLocaleLowerCase(locale);
      replacements += 1;
      if (normalizedEnding === "r") {
        return applyTokenCase(
          base,
          base.toLocaleLowerCase(locale) + "r"
        );
      }
      if (normalizedEnding === "m") {
        return applyTokenCase(
          base,
          base.toLocaleLowerCase(locale) + "m"
        );
      }
      return applyTokenCase(
        base,
        base.toLocaleLowerCase(locale) + "n"
      );
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
  String.raw`(?<![\p{L}\p{M}])(${pluralStemAlternation})(${marker}innen|innen)(?![\p{L}\p{M}])`,
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
    .match(/[\p{L}\p{M}\d:*_\/·•’‘-]+[.!?]?|[,;()]/gu) ?? []);
  let position = words.length - 1;
  if (position >= 0 && coordinationWords.has(words[position]!.toLocaleLowerCase(locale))) {
    // `die Kolleg:innen und Angestellt:innen`: follow the first conjunct.
    position -= 2;
    if (position < -1) return undefined;
  }
  // Attributive -e adjectives (`viele neue …`) inherit the decision before them.
  while (position >= 0 && /^\p{Ll}+e$/u.test(words[position]!) &&
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
  if (/^\p{Ll}+en$/u.test(previous)) {
    // Only an -en adjective after a weak determiner (`die neuen …`); a verb
    // such as `suchen` gives no declension information.
    while (position >= 0 && /^\p{Ll}+en$/u.test(words[position]!) &&
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
    // All patterns require a marked adjective ending, never plain prose.
    const singular = /[:*_\/·•.’‘][rnms]/iu.test(input);
    const plural = /innen/iu.test(input);
    if (!singular && !plural) return {text: input, replacements: 0};
    const phraseResult = singular ? transformPhrases(input) : {text: input, replacements: 0};
    const standaloneResult = singular ? transformStandalone(phraseResult.text) : phraseResult;
    const pluralResult = plural ? transformMarkedPlurals(standaloneResult.text) : {text: standaloneResult.text, replacements: 0};
    return {
      text: pluralResult.text,
      replacements: phraseResult.replacements +
        (singular ? standaloneResult.replacements : 0) + pluralResult.replacements
    };
  }
};
