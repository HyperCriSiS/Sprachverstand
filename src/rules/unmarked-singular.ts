import type { Rule } from "../core/rule";
import { mapKnownSingular } from "./known-plural-separators";
import { mapMappedSingular } from "./person-lexicon";

const markerPattern =
  /(?<![\p{L}\p{M}])([\p{L}\p{M}’'-]+)(?:(?:\/-?)|[:*_·•.’‘])in(?![\p{L}\p{M}])/giu;

function mapBase(base: string): string | undefined {
  return (
    mapMappedSingular(base, "nominative") ??
    mapKnownSingular(base, "nominative")
  );
}

export const unmarkedSingularRule: Rule = {
  id: "singular.unmarked-marker",
  risk: "contextual",

  apply(input) {
    let replacements = 0;
    const text = input.replace(markerPattern, (match: string, base: string) => {
      const replacement = mapBase(base);
      if (!replacement) {
        return match;
      }

      replacements += 1;
      return replacement;
    });

    return { text, replacements };
  }
};
