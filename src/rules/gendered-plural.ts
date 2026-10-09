import type { TransformResult } from "../core/rule";

/*
 * Der Genderteil darf am Anfang eines zusammengesetzten Wortes stehen:
 * "Nutzer:innenkonto" wird als "Nutzer:innen" + "konto" verarbeitet.
 * Die Wortgrenze vor dem Ausdruck verhindert Treffer mitten in einem Wort.
 * Beim Schrägstrich sind zusätzlich "/-innen" und die ältere Schreibweise
 * "/inne/n" erlaubt. Klammerformen und der gerade Apostroph werden nur bei
 * lexikalisch bekannten Personenstämmen verarbeitet.
 * Zusätzlich werden typografische Unicode-Schrägstriche und die optionale
 * Klammer-Bindestrichform erkannt. Ein Soft-Hyphen trennt keine Wortbasis.
 */
const separatorPluralPattern =
  /(?<![\p{L}\p{M}\u00AD])([\p{L}\p{M}’'-]+)(?:(?:[/∕⁄／]-?|[:*_·•.’‘'])innen|\(-?innen\)|[/∕⁄／]inne[/∕⁄／]n)/giu;

export type GenderedPluralMapper = (base: string) => string | undefined;

export function transformGenderedPlural(
  input: string,
  mapBase: GenderedPluralMapper,
  pattern: RegExp = separatorPluralPattern
): TransformResult {
  let replacements = 0;

  const text = input.replace(pattern, (
    match: string,
    base: string,
    offset: number,
    original: string
  ) => {
    // Uneindeutige Mischformen aus Singularartikel und markiertem Plural
    // vollständig erhalten, statt nur das Substantiv zu verändern.
    const vorangestellt = original.slice(0, offset);
    if (/(?:^|\s)(?:der|die|den|dem|des)[:*_/·•’‘](?:die|der|den|dem|des)\s+$/iu.test(vorangestellt)) {
      return match;
    }
    const replacement = mapBase(base);

    if (replacement === undefined) {
      return match;
    }

    replacements += 1;
    return replacement;
  });

  return { text, replacements };
}