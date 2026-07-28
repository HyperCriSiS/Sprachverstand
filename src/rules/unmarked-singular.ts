import type { Rule, TransformResult } from "../core/rule";
import { mapKnownSingular } from "./known-plural-separators";
import { mapMappedSingular } from "./person-lexicon";

const locale = "de-DE";
const markerPattern =
  /(?<![\p{L}\p{M}])([\p{L}\p{M}’'-]+)(?:(?:\/-?)|[:*_·•.’‘])in(?![\p{L}\p{M}])/giu;
const binnenIMarkerPattern =
  /(?<![\p{L}\p{M}])([\p{L}\p{M}’'-]+)In(?![\p{L}\p{M}])/gu;
const markedAdjectivePattern =
  /(?<![\p{L}\p{M}])(Verbündete)(?:[:*_\/·•.’‘])r(?![\p{L}\p{M}])/giu;
const additionalSingularForms = new Map<string, string>([
  ["dirigent", "dirigent"],
  ["dozent", "dozent"],
  ["jüd", "jude"],
  ["pat", "pate"],
  ["solist", "solist"]
]);
const ambiguousFeminineDeterminers = new Set([
  "die",
  "eine",
  "einer",
  "ihre",
  "ihrer",
  "jede",
  "keine",
  "keiner",
  "meine",
  "meiner",
  "seine",
  "seiner",
  "deine",
  "deiner",
  "diese",
  "dieser",
  "unsere",
  "unserer",
  "eure",
  "eurer",
  "welche",
  "welcher"
]);

function applyTokenCase(source: string, replacement: string): string {
  const lowerSource = source.toLocaleLowerCase(locale);
  const upperSource = source.toLocaleUpperCase(locale);

  if (source === upperSource && source !== lowerSource) {
    return replacement.toLocaleUpperCase(locale);
  }

  const first = [...source][0];
  if (first && first === first.toLocaleUpperCase(locale)) {
    const characters = [...replacement];
    const firstReplacementCharacter = characters.shift();
    return firstReplacementCharacter
      ? firstReplacementCharacter.toLocaleUpperCase(locale) + characters.join("")
      : replacement;
  }

  return replacement;
}

function mapBase(base: string): string | undefined {
  const additional = additionalSingularForms.get(
    base.toLocaleLowerCase(locale)
  );

  return (
    (additional ? applyTokenCase(base, additional) : undefined) ??
    mapMappedSingular(base, "nominative") ??
    mapKnownSingular(base, "nominative")
  );
}

function transformMarkedAdjectives(input: string): TransformResult {
  let replacements = 0;
  const text = input.replace(
    markedAdjectivePattern,
    (_match: string, base: string) => {
      replacements += 1;
      return applyTokenCase(base, "verbündeter");
    }
  );

  return { text, replacements };
}

function hasAmbiguousFeminineDeterminer(input: string, index: number): boolean {
  const prefix = input.slice(0, index);
  const match = /([\p{L}\p{M}]+)\s+$/u.exec(prefix);
  return Boolean(
    match?.[1] &&
      ambiguousFeminineDeterminers.has(match[1].toLocaleLowerCase(locale))
  );
}

function transformMarkerPattern(
  input: string,
  pattern: RegExp,
  protectAmbiguousDeterminer: boolean
): TransformResult {
  let replacements = 0;
  const text = input.replace(
    pattern,
    (match: string, base: string, offset: number, fullInput: string) => {
      if (
        protectAmbiguousDeterminer &&
        hasAmbiguousFeminineDeterminer(fullInput, offset)
      ) {
        return match;
      }

      const replacement = mapBase(base);
      if (!replacement) {
        return match;
      }

      replacements += 1;
      return replacement;
    }
  );

  return { text, replacements };
}

export const unmarkedSingularRule: Rule = {
  id: "singular.unmarked-marker",
  risk: "contextual",

  apply(input) {
    const adjectiveResult = transformMarkedAdjectives(input);
    const separatorResult = transformMarkerPattern(
      adjectiveResult.text,
      markerPattern,
      false
    );
    const binnenIResult = transformMarkerPattern(
      separatorResult.text,
      binnenIMarkerPattern,
      true
    );

    return {
      text: binnenIResult.text,
      replacements:
        adjectiveResult.replacements +
        separatorResult.replacements +
        binnenIResult.replacements
    };
  }
};
