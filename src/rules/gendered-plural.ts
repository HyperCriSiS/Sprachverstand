import type { TransformResult } from "../core/rule";

/*
 * Der Genderteil darf am Anfang eines zusammengesetzten Wortes stehen:
 * "Nutzer:innenkonto" wird als "Nutzer:innen" + "konto" verarbeitet.
 * Die Wortgrenze vor dem Ausdruck verhindert Treffer mitten in einem Wort.
 */
const separatorPluralPattern =
  /(?<![\p{L}\p{M}])([\p{L}\p{M}’'-]+)(?:[:*_/·•])innen/giu;

export type GenderedPluralMapper = (base: string) => string | undefined;

export function transformGenderedPlural(
  input: string,
  mapBase: GenderedPluralMapper,
  pattern: RegExp = separatorPluralPattern
): TransformResult {
  let replacements = 0;

  const text = input.replace(pattern, (match: string, base: string) => {
    const replacement = mapBase(base);

    if (replacement === undefined) {
      return match;
    }

    replacements += 1;
    return replacement;
  });

  return { text, replacements };
}
