import type { Rule, TransformResult } from "../core/rule";
import { mapKnownPlural } from "./known-plural-separators";
import { mapMappedPlural } from "./mapped-plural-separators";

/*
 * Drei Ausgangsfehler, die sonst halb, falsch oder gar nicht umgewandelt wurden:
 * - Zeilentrennung im Marker: `Schüler*in-nen` wurde zu „Schüler-nen“.
 * - Bindestrich vor dem Schrägstrich: `Schüler-/innen` blieb unverändert.
 * - Doppelter Marker: `Praktikant*in*in` wurde zu „Praktikant*in“,
 *   `Kolleg*in*innen` zu „Kollege*innen“.
 * Repariert wird nur bei lexikalisch bekanntem Stamm; die eigentliche
 * Umwandlung (Kasus, Dativ, Schutz) übernehmen danach die üblichen Regeln.
 * Keine allgemeine Rechtschreibkorrektur.
 */
const hyphenatedPattern =
  /(?<![\p{L}\p{M}])([\p{L}\p{M}’'-]*?\p{L})([:*_·•]|\/-?)in-nen(?![\p{L}\p{M}])/gu;
// Hyphen before the slash marker: `Schüler-/innen`, `Fachinformatiker-/in`.
const hyphenSlashPattern =
  /(?<![\p{L}\p{M}])([\p{L}\p{M}’'-]*?\p{L})-(\/-?)(innen|in)(?![\p{L}\p{M}])/gu;
const doubledPattern =
  /(?<![\p{L}\p{M}])([\p{L}\p{M}’'-]*?\p{L})([:*_·•])in\2(in|innen)(?![\p{L}\p{M}])/gu;

function isKnownStem(stem: string): boolean {
  return (mapKnownPlural(stem) ?? mapMappedPlural(stem)) !== undefined;
}

function transformMarkerSourceRepairs(input: string): TransformResult {
  if (!/in-nen|[:*_·•]in[:*_·•]in|\p{L}-\//u.test(input)) return {text: input, replacements: 0};
  let replacements = 0;
  const repair = (match: string, stem: string, separator: string, ending: string): string => {
    if (!isKnownStem(stem)) return match;
    replacements += 1;
    return stem + separator + ending;
  };
  const text = input
    .replace(hyphenatedPattern, (match: string, stem: string, separator: string) =>
      repair(match, stem, separator, "innen"))
    .replace(hyphenSlashPattern, (match: string, stem: string, separator: string, ending: string) =>
      repair(match, stem, separator, ending))
    .replace(doubledPattern, (match: string, stem: string, separator: string, ending: string) =>
      repair(match, stem, separator, ending));
  return {text, replacements};
}

export const markerSourceRepairsRule: Rule = {
  id: "marker.source-repairs",
  risk: "safe",
  apply: transformMarkerSourceRepairs
};
