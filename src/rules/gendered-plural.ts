import type { TransformResult } from "../core/rule";

const genderedPluralPattern =
  /(?<![\p{L}\p{M}])([\p{L}\p{M}’'-]+)(?:[:*_/·•])innen(?![\p{L}\p{M}])/giu;

export type GenderedPluralMapper = (base: string) => string | undefined;

export function transformGenderedPlural(
  input: string,
  mapBase: GenderedPluralMapper
): TransformResult {
  let replacements = 0;

  const text = input.replace(
    genderedPluralPattern,
    (match: string, base: string) => {
      const replacement = mapBase(base);

      if (replacement === undefined) {
        return match;
      }

      replacements += 1;
      return replacement;
    }
  );

  return { text, replacements };
}
