import type { Rule, TransformResult } from "../core/rule";
import { mapKnownPlural } from "./known-plural-separators";
import { mapMappedPlural, mapMappedSingular } from "./person-lexicon";
import { preserveInnerCase } from "./inner-case";

const locale = "de-DE";
const separators = [":", "*", "_", "/", "·", "•", "’", "‘"] as const;
const replacements = new Map<string, string>([
  ["jede/-r", "jeder"],
  ["ihm/r", "ihm"],
  ["diese(r)", "dieser"],
  ["eine(n)", "einen"]
]);

function addPair(
  masculine: string,
  feminine: string,
  replacement = masculine,
  reverse = true
): void {
  for (const separator of separators) {
    replacements.set(`${masculine}${separator}${feminine}`, replacement);

    if (reverse) {
      replacements.set(`${feminine}${separator}${masculine}`, replacement);
    }
  }
}

function addCompactForm(left: string, right: string, replacement: string): void {
  for (const separator of separators) {
    replacements.set(`${left}${separator}${right}`, replacement);
  }
}

addPair("der", "die");
addPair("den", "die");
addPair("dem", "der");
addPair("des", "der");
addPair("eines", "einer");
addPair("dessen", "deren");
addPair("dieser", "diese");
addPair("diesen", "diese");
addPair("diesem", "dieser");
addPair("dieses", "dieser");
addPair("er", "sie");
addPair("ihn", "sie");
addPair("ihm", "ihr");
addPair("sein", "ihr");
addPair("seine", "ihre");
addPair("seinen", "ihren");
addPair("seinem", "ihrem");
addPair("seines", "ihres");
addPair("seiner", "ihrer");
addCompactForm("jede", "r", "jeder");
addCompactForm("jedem", "r", "jedem");
addCompactForm("ein", "e", "ein");
// Marked demonstrative used as a pronoun (`da diese*r frisch entlassen wurde`).
addCompactForm("diese", "r", "dieser");
addCompactForm("jene", "r", "jener");

const pairPattern =
  /(?<![\p{L}\p{M}])(?:([\p{L}\p{M}]+)([:*_/·•’‘])([\p{L}\p{M}]+)|(jede\/-r|ihm\/r|diese\(r\)|eine\(n\)))(?![\p{L}\p{M}])/giu;
// Only dictionary prefixes can produce a replacement. ASCII word boundaries
// are deliberately broader than the final Unicode protection boundary.
const candidatePrefixes = [...new Set([...replacements.keys()].map(value =>
  value.split(/[:*_\/·•’‘(]/u)[0]))];
const pronounCandidate = new RegExp(String.raw`\b(?:${candidatePrefixes.join("|")})(?=[:*_\/·•’‘(])`, "iu");
const followingGenderedTokenPattern =
  /^\s+[\p{L}\p{M}’'-]+(?:[:*_/·•.’‘][\p{L}\p{M}]+|In|\((?:-)?[iI][nN]\))(?![\p{L}\p{M}])/u;

// `der/die Besucherin`: the pair belongs to a plain feminine person noun.
// Resolving only the determiner gave „der Besucherin“; the phrase stays.
const followingFeminineNounPattern = /^\s+(\p{Lu}[\p{L}\p{M}-]*?)in(?![\p{L}\p{M}:*_/·•.’‘(-])/u;

function followsFeminineNoun(followingText: string): boolean {
  const stem = followingFeminineNounPattern.exec(followingText)?.[1];
  return stem !== undefined && (mapKnownPlural(stem) ?? mapMappedPlural(stem)) !== undefined;
}

// Whether this rule resolves a marked pair token such as `ein/e` or `des/der`.
export function isExplicitPairToken(token: string): boolean {
  return replacements.has(token.toLocaleLowerCase(locale));
}

function applyTokenCase(source: string, replacement: string): string {
  const inner = preserveInnerCase(source, replacement);
  if (inner !== undefined) return inner;
  const letters = source.replace(/[^\p{L}\p{M}]/gu, "");
  const lowerLetters = letters.toLocaleLowerCase(locale);
  const upperLetters = letters.toLocaleUpperCase(locale);

  if (letters === upperLetters && letters !== lowerLetters) {
    return replacement.toLocaleUpperCase(locale);
  }

  const firstLetter = [...letters][0];
  if (firstLetter && firstLetter === firstLetter.toLocaleUpperCase(locale)) {
    const characters = [...replacement];
    const firstCharacter = characters.shift();
    return firstCharacter
      ? firstCharacter.toLocaleUpperCase(locale) + characters.join("")
      : replacement;
  }

  return replacement;
}

// A resolved genitive determiner needs the genitive of a following
// gender-neutral noun (`des:der Azubi` -> `des Azubis`). Only lexicon nouns
// whose singular is exactly this word and which have their own genitive.
const genitiveDeterminers = new Set(["des", "eines", "dieses", "seines"]);
const resolvedGenitiveMark = "\u0000";
const resolvedGenitiveNounPattern =
  /\u0000(\s+)(\p{Lu}[\p{L}\p{M}]*)(?![\p{L}\p{M}:*_/·•’‘(-])/gu;

function inflectFollowingGenitives(input: string): {text: string; replacements: number} {
  let replacements = 0;
  const text = input.replace(resolvedGenitiveNounPattern, (_match: string, space: string, noun: string) => {
    if (mapMappedSingular(noun, "nominative") !== noun) return space + noun;
    const genitive = mapMappedSingular(noun, "genitive");
    if (!genitive || genitive === noun) return space + noun;
    replacements += 1;
    return space + genitive;
  });
  return {text: text.replaceAll(resolvedGenitiveMark, ""), replacements};
}

function transformExplicitPronouns(input: string): TransformResult {
  if (!/[:*_\/·•’‘(]/u.test(input)) return {text: input, replacements: 0};
  if (!pronounCandidate.test(input)) return {text: input, replacements: 0};
  let replacementCount = 0;

  const text = input.replace(
    pairPattern,
    (
      match: string,
      _left: string,
      _separator: string,
      _right: string | undefined,
      _compactPair: string | undefined,
      offset: number,
      source: string
    ) => {
      const replacement = replacements.get(match.toLocaleLowerCase(locale));

      if (!replacement) {
        return match;
      }

      const followingText = source.slice(offset + match.length);
      if (followingGenderedTokenPattern.test(followingText) || followsFeminineNoun(followingText)) {
        return match;
      }

      replacementCount += 1;
      return applyTokenCase(match, replacement) +
        (genitiveDeterminers.has(replacement) ? resolvedGenitiveMark : "");
    }
  );

  const genitives = inflectFollowingGenitives(text);
  return { text: genitives.text, replacements: replacementCount + genitives.replacements };
}

export const explicitPronounsRule: Rule = {
  id: "pronoun.explicit-pairs",
  risk: "safe",
  apply: transformExplicitPronouns
};
