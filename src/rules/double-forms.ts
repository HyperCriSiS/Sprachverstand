import type { Rule } from "../core/rule";
import { mapKnownPlural } from "./known-plural-separators";
import { mapMappedPlural } from "./mapped-plural-separators";

type GenderedStyle = "feminine" | "separator" | "binnen-i";

interface GenderedCandidate {
  readonly masculine: string;
  readonly style: GenderedStyle;
}

const locale = "de-DE";
const word = String.raw`[\p{L}\p{M}’'-]+(?:(?:[:*_/·•])innen)?`;
const doubleFormPattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}])(${word})(\s+(?:und|oder|beziehungsweise|bzw\.)\s+|\s*[&/_]\s*)(${word})(?![\p{L}\p{M}])`,
  "giu"
);
const separatorPattern =
  /^([\p{L}\p{M}’'-]+)(?:[:*_/·•])innen$/iu;
const binnenIPattern = /^([\p{L}\p{M}’'-]+)Innen$/u;
const femininePattern = /^([\p{L}\p{M}’'-]+)innen$/iu;

function mapBase(base: string): string | undefined {
  return mapMappedPlural(base) ?? mapKnownPlural(base);
}

function parseGenderedCandidate(wordValue: string): GenderedCandidate | undefined {
  const separatorMatch = separatorPattern.exec(wordValue);
  if (separatorMatch?.[1]) {
    const masculine = mapBase(separatorMatch[1]);
    return masculine ? { masculine, style: "separator" } : undefined;
  }

  const binnenIMatch = binnenIPattern.exec(wordValue);
  if (binnenIMatch?.[1]) {
    const masculine = mapBase(binnenIMatch[1]);
    return masculine ? { masculine, style: "binnen-i" } : undefined;
  }

  const feminineMatch = femininePattern.exec(wordValue);
  if (feminineMatch?.[1]) {
    const masculine = mapBase(feminineMatch[1]);
    return masculine ? { masculine, style: "feminine" } : undefined;
  }

  return undefined;
}

function sameWord(left: string, right: string): boolean {
  return (
    left.toLocaleLowerCase(locale) === right.toLocaleLowerCase(locale)
  );
}

function toDativePlural(plural: string): string {
  const lowerPlural = plural.toLocaleLowerCase(locale);

  if (lowerPlural.endsWith("n") || lowerPlural.endsWith("s")) {
    return plural;
  }

  const upperPlural = plural.toLocaleUpperCase(locale);
  const ending = plural === upperPlural && plural !== lowerPlural ? "N" : "n";
  return plural + ending;
}

function matchesMasculineSurface(
  canonicalPlural: string,
  surface: string
): boolean {
  return (
    sameWord(canonicalPlural, surface) ||
    sameWord(toDativePlural(canonicalPlural), surface)
  );
}

function collapsePair(left: string, right: string): string | undefined {
  const normalizedLeft = left.toLocaleLowerCase(locale);
  const normalizedRight = right.toLocaleLowerCase(locale);

  if (
    (normalizedLeft === "bauern" && normalizedRight === "bäuerinnen") ||
    (normalizedRight === "bauern" && normalizedLeft === "bäuerinnen")
  ) {
    return normalizedLeft === "bauern" ? left : right;
  }

  const leftCandidate = parseGenderedCandidate(left);
  const rightCandidate = parseGenderedCandidate(right);

  if (
    leftCandidate &&
    !rightCandidate &&
    matchesMasculineSurface(leftCandidate.masculine, right)
  ) {
    return right;
  }

  if (
    rightCandidate &&
    !leftCandidate &&
    matchesMasculineSurface(rightCandidate.masculine, left)
  ) {
    return left;
  }

  if (
    leftCandidate &&
    rightCandidate &&
    leftCandidate.style !== rightCandidate.style &&
    sameWord(leftCandidate.masculine, rightCandidate.masculine)
  ) {
    return leftCandidate.masculine;
  }

  return undefined;
}

export const doubleFormsRule: Rule = {
  id: "plural.double-forms",
  risk: "safe",

  apply(input) {
    let replacements = 0;

    const text = input.replace(
      doubleFormPattern,
      (match: string, left: string, _connector: string, right: string) => {
        const replacement = collapsePair(left, right);

        if (replacement === undefined) {
          return match;
        }

        replacements += 1;
        return replacement;
      }
    );

    return { text, replacements };
  }
};
