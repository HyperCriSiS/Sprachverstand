import type { Rule, TransformResult } from "../core/rule";
import { mapMappedPlural } from "./mapped-plural-separators";
import { mapKnownPlural } from "./known-plural-separators";

// Nur lexikalisch bekannte, markierte Pluralformen werden in eindeutig
// dativischen Wortgruppen mit der passenden Dativendung versehen.
// Die gewohnte allgemeine Pluralregel bleibt für alle anderen Kontexte zuständig.
const dativePhrasePattern =
  /(?<![\p{L}\p{M}])((?:mit|bei|von|zu|aus|nach|seit|den)\s+(?:(?:[\p{L}\p{M}-]+en)\s+){0,3})([\p{L}\p{M}’'-]+)((?:(?:[/∕⁄／]-?|[:*_·•.’‘'])innen|\(-?innen\)|[/∕⁄／]inne[/∕⁄／]n))(?![\p{L}\p{M}-])(?:([ \t]+und[ \t]+)([\p{L}\p{M}’'-]+)((?:(?:[/∕⁄／]-?|[:*_·•.’‘'])innen|\(-?innen\)|[/∕⁄／]inne[/∕⁄／]n))(?![\p{L}\p{M}-]))?/giu;

function mapDativePlural(base: string): string | undefined {
  const plural = mapMappedPlural(base) ?? mapKnownPlural(base);
  if (plural === undefined) return undefined;
  // Reguläre Dativplurale enden auf -n; die vorhandenen -n/-s-Plurale
  // bekommen keine zusätzliche Endung.
  if (/[ns]$/iu.test(plural)) return plural;
  const uppercase = plural === plural.toLocaleUpperCase("de-DE");
  return plural + (uppercase ? "N" : "n");
}

// Aufzählungen werden nur bei eindeutigem Dativauslöser als Ganzes flexiert.
const markedWord = String.raw`[\p{L}\p{M}’'-]+(?:(?:[/∕⁄／]-?|[:*_·•.’‘'])innen|\(-?innen\)|[/∕⁄／]inne[/∕⁄／]n)`;
const dativeEnumerationPattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}])((?:mit|bei|von|zu|aus|nach|seit|den)\s+)((?:${markedWord}[ \t]*,[ \t]*)+${markedWord}[ \t]+und[ \t]+${markedWord})(?![\p{L}\p{M}-])`,
  "giu"
);
const markedWordPattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}])([\p{L}\p{M}’'-]+)((?:[/∕⁄／]-?|[:*_·•.’‘'])innen|\(-?innen\)|[/∕⁄／]inne[/∕⁄／]n)`,
  "giu"
);
const dativeLeadingContextPattern =
  /(?:^|[\s(])((?:mit|bei|von|zu|aus|nach|seit|den)\s+(?:(?:[\p{L}\p{M}-]+en)\s+){0,3})$/iu;
const markedLeadingCandidate = new RegExp(String.raw`^\s*${markedWord}`, "iu");

function transformDativeEnumeration(input: string): TransformResult {
  let replacements = 0;
  const text = input.replace(
    dativeEnumerationPattern,
    (original: string, prefix: string, list: string) => {
      const basen = [...list.matchAll(markedWordPattern)];
      const flektiert = basen.map((match) => mapDativePlural(match[1] ?? ""));
      if (basen.length < 3 || flektiert.some((wort) => wort === undefined)) {
        return original;
      }
      let index = 0;
      const ausgabe = list.replace(markedWordPattern, () => flektiert[index++] ?? "");
      replacements += basen.length;
      return prefix + ausgabe;
    }
  );
  return { text, replacements };
}

function transformMarkedDativePlural(input: string): TransformResult {
  const aufzählung = transformDativeEnumeration(input);
  let replacements = aufzählung.replacements;
  const text = aufzählung.text.replace(
    dativePhrasePattern,
    (
      original: string,
      prefix: string,
      first: string,
      _firstMarker: string,
      conjunction: string | undefined,
      second: string | undefined,
      secondMarker: string | undefined
    ) => {
      const mappedFirst = mapDativePlural(first);
      if (mappedFirst === undefined) return original;
      replacements += 1;
      if (!conjunction || !second || !secondMarker) {
        return prefix + mappedFirst;
      }
      const mappedSecond = mapDativePlural(second);
      if (mappedSecond === undefined) {
        return prefix + mappedFirst + conjunction + second + secondMarker;
      }
      replacements += 1;
      return prefix + mappedFirst + conjunction + mappedSecond;
    }
  );
  return { text, replacements };
}

export const markedDativePluralRule: Rule = {
  id: "plural.marked-dative-context",
  risk: "safe",
  apply: transformMarkedDativePlural,
  leadingContextCandidate: markedLeadingCandidate,
  applyWithLeadingContext(input, leadingContext) {
    const auslöser = dativeLeadingContextPattern.exec(leadingContext)?.[1];
    if (!auslöser) return transformMarkedDativePlural(input);

    const result = transformMarkedDativePlural(auslöser + input);
    if (!result.text.startsWith(auslöser)) return transformMarkedDativePlural(input);
    return { text: result.text.slice(auslöser.length), replacements: result.replacements };
  }
};