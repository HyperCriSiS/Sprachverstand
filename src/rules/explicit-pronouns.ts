import type { Rule, TransformResult } from "../core/rule";

const locale = "de-DE";
const separators = [":", "*", "_", "/", "·", "•", "’", "‘"] as const;
const replacements = new Map<string, string>();

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

addPair("der", "die");
addPair("den", "die");
addPair("dem", "der");
addPair("des", "der");
addPair("er", "sie");
addPair("ihn", "sie");
addPair("ihm", "ihr");
addPair("sein", "ihr");
addPair("seine", "ihre");
addPair("seinen", "ihren");
addPair("seinem", "ihrem");
addPair("seines", "ihres");
addPair("seiner", "ihrer");

const pairPattern =
  /(?<![\p{L}\p{M}])([\p{L}\p{M}]+)([:*_/·•’‘])([\p{L}\p{M}]+)(?![\p{L}\p{M}])/gu;
const followingGenderedNounPattern =
  /^\s+[\p{L}\p{M}’'-]+(?:[:*_/·•.’‘]in|In)(?![\p{L}\p{M}])/u;

function applyTokenCase(source: string, replacement: string): string {
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

function transformExplicitPronouns(input: string): TransformResult {
  let replacementCount = 0;

  const text = input.replace(
    pairPattern,
    (
      match: string,
      _left: string,
      _separator: string,
      _right: string,
      offset: number,
      source: string
    ) => {
      const replacement = replacements.get(match.toLocaleLowerCase(locale));

      if (!replacement) {
        return match;
      }

      const followingText = source.slice(offset + match.length);
      if (followingGenderedNounPattern.test(followingText)) {
        return match;
      }

      replacementCount += 1;
      return applyTokenCase(match, replacement);
    }
  );

  return { text, replacements: replacementCount };
}

export const explicitPronounsRule: Rule = {
  id: "pronoun.explicit-pairs",
  risk: "safe",
  apply: transformExplicitPronouns
};
