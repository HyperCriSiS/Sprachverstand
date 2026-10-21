import type { Rule, TransformResult } from "../core/rule";
import {lazyPattern} from "../core/lazy-pattern";

const titleToken = String.raw`(?:Prof|Dr)(?:\.in|[:*_]in)`;
const feminineDeterminer =
  String.raw`(?:die|eine|keine|jede|diese|jene|welche|meine|deine|seine|ihre|unsere|eure|der|einer|keiner|jeder|dieser|jener|welcher|meiner|deiner|seiner|ihrer|unserer|eurer|zur)`;

const articlePattern = lazyPattern(
  String.raw`(?<![\p{L}\p{M}])(${feminineDeterminer})(\s+)(${titleToken})(?![\p{L}\p{M}])`,
  "giu"
);

const titleBeforeNamePattern = lazyPattern(
  String.raw`(?<![\p{L}\p{M}])(${titleToken})(?![\p{L}\p{M}])(?=\s+(?:(?:Prof|Dr)(?:\.in|[:*_]in|\.)|\p{Lu}[\p{L}\p{M}'’.-]+))`,
  "giu"
);

const standalonePattern = lazyPattern(
  String.raw`(?<![\p{L}\p{M}])(${titleToken})(?![\p{L}\p{M}])`,
  "giu"
);

function matchedBase(token: string): "Prof" | "Dr" {
  return token.slice(0, token.search(/[.:*_]/u)).toLocaleLowerCase("de-DE") ===
    "prof"
    ? "Prof"
    : "Dr";
}

function preserveCase(source: string, normal: string): string {
  const letters = source.replace(/[^\p{L}\p{M}]/gu, "");
  if (letters === letters.toLocaleUpperCase("de-DE")) {
    return normal.toLocaleUpperCase("de-DE");
  }

  if (letters === letters.toLocaleLowerCase("de-DE")) {
    return normal.toLocaleLowerCase("de-DE");
  }

  return normal;
}

function expandedTitle(token: string): string {
  return matchedBase(token) === "Prof"
    ? preserveCase(token, "Professorin")
    : preserveCase(token, "Doktorin");
}

function neutralTitle(token: string): string {
  return matchedBase(token) === "Prof"
    ? preserveCase(token, "Prof.")
    : preserveCase(token, "Dr.");
}

function replaceAndCount(
  input: string,
  pattern: RegExp,
  replace: (...matches: string[]) => string
): TransformResult {
  let replacements = 0;
  const text = input.replace(pattern, (...arguments_: unknown[]) => {
    replacements += 1;
    return replace(...(arguments_.slice(0, -2) as string[]));
  });

  return { text, replacements };
}

export const titleAbbreviationsRule: Rule = {
  id: "title.gendered-abbreviations",
  risk: "safe",

  apply(input) {
    if (!/in(?![a-z])/iu.test(input)) return {text: input, replacements: 0};
    let text = input;
    let replacements = 0;

    const articleResult = replaceAndCount(
      text,
      articlePattern(),
      (_match, determiner, whitespace, token) =>
        `${determiner}${whitespace}${expandedTitle(token)}`
    );
    text = articleResult.text;
    replacements += articleResult.replacements;

    const titleResult = replaceAndCount(
      text,
      titleBeforeNamePattern(),
      (_match, token) => neutralTitle(token)
    );
    text = titleResult.text;
    replacements += titleResult.replacements;

    const standaloneResult = replaceAndCount(
      text,
      standalonePattern(),
      (_match, token) => expandedTitle(token)
    );
    text = standaloneResult.text;
    replacements += standaloneResult.replacements;

    return { text, replacements };
  }
};
