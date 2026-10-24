import type { Rule, TransformResult } from "../core/rule";
import { mapKnownPlural } from "./known-plural-separators";
import { mapMappedPlural } from "./mapped-plural-separators";

// Regex literals with Unicode property escapes stay at module level: Pale
// Moon compiles such a literal again each time a function evaluates it.
const nestedCompoundCandidate = /innen[\p{L}\p{M}]+?(?:[:*_·•]|\/-?)in/iu;

/*
 * Verschachtelte Komposita mit zwei Markern: `Patient*innenvertreter*innen`.
 * Die Pluralregeln sehen das äußere Personenwort erst, nachdem der innere
 * Teil aufgelöst ist, und laufen nicht erneut. Diese Regel steht davor und
 * löst nur den inneren Teil auf (`Patientenvertreter*innen`), wenn das
 * entstehende äußere Wort lexikalisch bekannt ist. Den äußeren Marker
 * behandeln danach die üblichen Regeln einschließlich Dativ
 * (`mit … Patientenvertretern`). Keine Wiederholung der ganzen Regelkette.
 */
const nestedPattern =
  /(?<![\p{L}\p{M}­])([\p{L}\p{M}’'-]+?)(?:[:*_·•]|\/-?)innen([\p{L}\p{M}]+?)((?:[:*_·•]|\/-?)(?:innen|in))(?![\p{L}\p{M}])/giu;

function mapPlural(base: string): string | undefined {
  return mapKnownPlural(base) ?? mapMappedPlural(base);
}

function transformNestedCompounds(input: string): TransformResult {
  if (!nestedCompoundCandidate.test(input)) {
    return {text: input, replacements: 0};
  }
  let replacements = 0;
  const text = input.replace(
    nestedPattern,
    (match: string, innerBase: string, middle: string, outerMarker: string) => {
      // `Nutzer*innenkonto*innen`: das äußere Wort muss eine Person sein.
      const inner = mapPlural(innerBase);
      if (inner === undefined || mapPlural(inner + middle) === undefined) {
        return match;
      }
      replacements += 1;
      return inner + middle + outerMarker;
    }
  );
  return {text, replacements};
}

export const nestedCompoundPluralsRule: Rule = {
  id: "plural.nested-compound",
  risk: "safe",
  apply: transformNestedCompounds
};
