import type { Rule, TransformResult } from "../core/rule";
import {
  mapKnownPlural,
  mapKnownSingular
} from "./known-plural-separators";
import {
  mapMappedSingular,
  type GrammaticalCase
} from "./person-lexicon";

interface DeterminerForm {
  readonly masculine: string;
  readonly grammaticalCase: GrammaticalCase;
}

const locale = "de-DE";
const separators = [":", "*", "_", "/", "·", "•", ".", "’", "‘"] as const;
const determinerForms = new Map<string, DeterminerForm>();

function addDeterminer(
  left: string,
  right: string,
  masculine: string,
  grammaticalCase: GrammaticalCase,
  reverse = false
): void {
  for (const separator of separators) {
    determinerForms.set(`${left}${separator}${right}`, {
      masculine,
      grammaticalCase
    });

    if (reverse) {
      determinerForms.set(`${right}${separator}${left}`, {
        masculine,
        grammaticalCase
      });
    }
  }
}

function addPossessiveDeterminers(
  base: string,
  inflectedBase = `${base}e`,
  accusative = `${base}en`,
  dative = `${base}em`,
  genitiveMasculine = `${base}es`,
  genitiveFeminine = `${base}er`
): void {
  addDeterminer(base, "e", base, "nominative");
  addDeterminer(inflectedBase, "n", accusative, "accusative");
  addDeterminer(inflectedBase, "m", dative, "dative");
  addDeterminer(
    genitiveMasculine,
    genitiveFeminine,
    genitiveMasculine,
    "genitive"
  );
}

addDeterminer("der", "die", "der", "nominative", true);
addDeterminer("den", "die", "den", "accusative", true);
addDeterminer("dem", "der", "dem", "dative", true);
addDeterminer("des", "der", "des", "genitive", true);
addDeterminer("ein", "e", "ein", "nominative");
addDeterminer("eine", "n", "einen", "accusative");
addDeterminer("einem", "einer", "einem", "dative");
addDeterminer("eines", "einer", "eines", "genitive");
addDeterminer("kein", "e", "kein", "nominative");
addDeterminer("keine", "n", "keinen", "accusative");
addDeterminer("keine", "m", "keinem", "dative");
addDeterminer("keines", "keiner", "keines", "genitive");
addDeterminer("jede", "r", "jeder", "nominative");
addDeterminer("jede", "n", "jeden", "accusative");
addDeterminer("jede", "m", "jedem", "dative");
addDeterminer("jedes", "jeder", "jedes", "genitive");
addDeterminer("welche", "r", "welcher", "nominative");
addDeterminer("welche", "n", "welchen", "accusative");
addDeterminer("welche", "m", "welchem", "dative");
addDeterminer("welches", "welcher", "welches", "genitive");
addDeterminer("diese", "r", "dieser", "nominative");
addDeterminer("diese", "n", "diesen", "accusative");
addDeterminer("diese", "m", "diesem", "dative");
addDeterminer("dieses", "dieser", "dieses", "genitive");

addPossessiveDeterminers("mein");
addPossessiveDeterminers("dein");
addPossessiveDeterminers("sein");
addPossessiveDeterminers("ihr");
addPossessiveDeterminers("unser");
addPossessiveDeterminers(
  "euer",
  "eure",
  "euren",
  "eurem",
  "eures",
  "eurer"
);

addDeterminer("sein", "ihr", "sein", "nominative", true);
addDeterminer("seinen", "ihren", "seinen", "accusative", true);
addDeterminer("seinem", "ihrem", "seinem", "dative", true);
addDeterminer("seines", "ihres", "seines", "genitive", true);

const determinerToken = String.raw`[\p{L}\p{M}:*_/·•.’‘-]+`;
const nounBase = String.raw`[\p{L}\p{M}’'-]+`;
const separatorSingularPattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}])(${determinerToken})(\s+)(${nounBase})(?:(?:\/-?)|[:*_·•.’‘])in(?![\p{L}\p{M}])`,
  "giu"
);
const binnenISingularPattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}])(${determinerToken})(\s+)(${nounBase})In(?![\p{L}\p{M}])`,
  "gu"
);

function applyTokenCase(source: string, replacement: string): string {
  const letters = source.replace(/[^\p{L}\p{M}]/gu, "");
  const lowerLetters = letters.toLocaleLowerCase(locale);
  const upperLetters = letters.toLocaleUpperCase(locale);

  if (letters === upperLetters && letters !== lowerLetters) {
    return replacement.toLocaleUpperCase(locale);
  }

  const firstLetter = [...letters][0];
  if (firstLetter && firstLetter === firstLetter.toLocaleUpperCase(locale)) {
    const replacementCharacters = [...replacement];
    const firstReplacementCharacter = replacementCharacters.shift();

    return firstReplacementCharacter
      ? firstReplacementCharacter.toLocaleUpperCase(locale) +
          replacementCharacters.join("")
      : replacement;
  }

  return replacement;
}

function mapSingular(
  base: string,
  grammaticalCase: GrammaticalCase
): string | undefined {
  return (
    mapMappedSingular(base, grammaticalCase) ??
    mapKnownSingular(base, grammaticalCase) ??
    (grammaticalCase === "genitive" ? undefined : mapKnownPlural(base))
  );
}

function transformPattern(input: string, pattern: RegExp): TransformResult {
  let replacements = 0;

  const text = input.replace(
    pattern,
    (
      match: string,
      determiner: string,
      whitespace: string,
      base: string
    ) => {
      const normalizedDeterminer = determiner
        .toLocaleLowerCase(locale)
        .replaceAll("/-", "/");
      const determinerForm = determinerForms.get(normalizedDeterminer);

      if (!determinerForm) {
        return match;
      }

      const noun = mapSingular(base, determinerForm.grammaticalCase);
      if (!noun) {
        return match;
      }

      replacements += 1;
      return (
        applyTokenCase(determiner, determinerForm.masculine) +
        whitespace +
        noun
      );
    }
  );

  return { text, replacements };
}

export const singularContextRule: Rule = {
  id: "singular.explicit-context",
  risk: "safe",

  apply(input) {
    const separatorResult = transformPattern(input, separatorSingularPattern);
    const binnenIResult = transformPattern(
      separatorResult.text,
      binnenISingularPattern
    );

    return {
      text: binnenIResult.text,
      replacements:
        separatorResult.replacements + binnenIResult.replacements
    };
  }
};
