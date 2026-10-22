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

// Marker inside the first half of a hyphenated adjective:
// `Medizinisch:e-Technische:r` is `Medizinisch-Technische:r`; the first
// half never inflects. Only when both halves use the same marker.
const innerAdjectivePattern =
  /(?<![\p{L}\p{M}])(\p{L}[\p{L}\p{M}]*?(?:isch|lich|ig|al|iv))([:*_·•])e-(\p{L}[\p{L}\p{M}]*e)\2(?=[rn](?![\p{L}\p{M}]))/gu;

function isKnownStem(stem: string): boolean {
  return (mapKnownPlural(stem) ?? mapMappedPlural(stem)) !== undefined;
}

// The inflected masculine form before the marker: `zum/r Assistenten/in`,
// `Medizinpädagoge/-in`, `Rechtssekretäre/innen`, `Patienten*innen`. It is
// written back to the stem form (`Assistent/in`, `Rechtssekretär/innen`)
// only when the lexicon's masculine plural of that stem is exactly the
// written form (or its dative -n), so the regular rules decide the case.
const inflectedMarkerPattern =
  /(?<![\p{L}\p{M}_])(\p{Lu}[\p{L}\p{M}’'-]*?\p{Ll})([:*_·•]|\/-?)(innen|in)(?![\p{L}\p{M}_])/gu;
const determinerContextBefore =
  /(?:^|\s)(?:(?:als|zum|zur|vom|beim|im|am|dem|den|des|einem|einen|eines|ein|der|die|eine|einer|jede[mnrs]?|meine?[mnrs]?|deine?[mnrs]?|seine?[mnrs]?|ihre?[mnrs]?|unsere?[mnrs]?)(?:\s*[\/*:_·]\s*-?\p{L}*)?|von der|bei der|zu der)\s+(?:[\p{L}\p{M}*:_\/·-]+\s+){0,2}$/iu;
// A singular needs a determiner or preposition before it (up to two
// attributes); without one its case is open (`Fotografen*in/Videografen*in`).
const singularContextBefore =
  /(?:^|\s)(?:\S*[\/*:_·]\S*|zum|zur|vom|beim|im|am|als|dem|den|des|einem|einen|eines|ein|der|die|eine|einer|mit|von|bei|zu|für)\s+(?:[\p{L}\p{M}*:_\/·-]+\s+){0,2}$/iu;

function stemForInflected(word: string): string | undefined {
  const lower = word.toLocaleLowerCase("de-DE");
  for (const cut of [2, 1]) {
    const stem = word.slice(0, -cut);
    if (stem.length < 3) continue;
    const plural = (mapMappedPlural(stem) ?? mapKnownPlural(stem))?.toLocaleLowerCase("de-DE");
    if (!plural || plural === stem.toLocaleLowerCase("de-DE")) continue;
    if (plural === lower || `${plural}n` === lower) return stem;
  }
  return undefined;
}

function repairInflectedMarkers(input: string): TransformResult {
  let replacements = 0;
  const text = input.replace(inflectedMarkerPattern,
    (match: string, word: string, separator: string, ending: string, offset: number, source: string) => {
      if (isKnownStem(word)) return match;
      // Slash series (`Fotografen*in/Videografen*in`): both or none.
      if (source[offset + match.length] === "/" || source[offset - 1] === "/") return match;
      if (ending === "in" && !singularContextBefore.test(source.slice(Math.max(0, offset - 80), offset))) return match;
      const stem = stemForInflected(word);
      if (!stem) return match;
      replacements += 1;
      // A determiner (pair) before a singular: the stem form lets the singular
      // rules convert the whole phrase (`zum/r … Assistent/in` → „zum …
      // Assistenten“). Otherwise the author's inflected masculine part stays
      // and only the marker goes (`Ärzten/innen` keeps its dative,
      // `anerkannte/n Heilpädagogen/in`).
      if (ending === "in" &&
          determinerContextBefore.test(source.slice(Math.max(0, offset - 80), offset))) {
        return stem + separator + ending;
      }
      return word;
    });
  return {text, replacements};
}

function transformMarkerSourceRepairs(input: string): TransformResult {
  let replacements = 0;
  if (/[:*_·•]e-/u.test(input)) {
    input = input.replace(innerAdjectivePattern,
      (_match: string, first: string, separator: string, second: string) => {
        replacements += 1;
        return `${first}-${second}${separator}`;
      });
  }
  if (/\p{Ll}(?:[:*_·•]|\/-?)in/u.test(input)) {
    const inflected = repairInflectedMarkers(input);
    input = inflected.text;
    replacements += inflected.replacements;
  }
  if (!/in-nen|[:*_·•]in[:*_·•]in|\p{L}-\//u.test(input)) return {text: input, replacements};
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
