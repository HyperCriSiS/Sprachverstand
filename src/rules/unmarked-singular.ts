import type { Rule, TransformResult } from "../core/rule";
import { mapKnownSingular } from "./known-plural-separators";
import { mapMappedSingular } from "./person-lexicon";

const locale = "de-DE";
const markerPattern =
  /(?<![\p{L}\p{M}])([\p{L}\p{M}’'-]+)(?:(?:\/-?)|[:*_·•.’‘])in(?![\p{L}\p{M}])/giu;
const markedAdjectivePattern =
  /(?<![\p{L}\p{M}])(Verbündete)(?:[:*_\/·•.’‘])r(?![\p{L}\p{M}])/giu;
const additionalSingularForms = new Map<string, string>([
  ["dirigent", "dirigent"],
  ["dozent", "dozent"],
  ["jüd", "jude"],
  ["pat", "pate"],
  ["solist", "solist"]
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

export const unmarkedSingularRule: Rule = {
  id: "singular.unmarked-marker",
  risk: "contextual",

  apply(input) {
    const adjectiveResult = transformMarkedAdjectives(input);
    let replacements = adjectiveResult.replacements;
    const text = adjectiveResult.text.replace(
      markerPattern,
      (match: string, base: string) => {
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
};
