import type { Rule, TransformResult } from "../core/rule";
import {
  mapKnownInflectedSingularPair,
  mapKnownSingularPair
} from "./known-plural-separators";
import {
  mapMappedInflectedSingularPair,
  mapMappedSingularPair,
  type GrammaticalCase
} from "./person-lexicon";

interface DeterminerPair {
  readonly feminine: string;
  readonly masculine: string;
  readonly grammaticalCase: GrammaticalCase;
}

const locale = "de-DE";
const word = String.raw`[\p{L}\p{M}’'-]+`;
const connector = String.raw`(?:\s*(?:/|&)\s*|\s+(?:und|oder|bzw\.|beziehungsweise)\s+)`;
const singularDoubleFormPattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}])(${word})(${connector})(${word})(?![\p{L}\p{M}])`,
  "giu"
);
const determinerPairs: DeterminerPair[] = [];

function addDeterminerPair(
  feminine: string,
  masculine: string,
  grammaticalCase: GrammaticalCase
): void {
  determinerPairs.push({ feminine, masculine, grammaticalCase });
}

addDeterminerPair("die", "der", "nominative");
addDeterminerPair("die", "den", "accusative");
addDeterminerPair("der", "dem", "dative");
addDeterminerPair("der", "des", "genitive");
addDeterminerPair("eine", "ein", "nominative");
addDeterminerPair("eine", "einen", "accusative");
addDeterminerPair("einer", "einem", "dative");
addDeterminerPair("einer", "eines", "genitive");
addDeterminerPair("keine", "kein", "nominative");
addDeterminerPair("keine", "keinen", "accusative");
addDeterminerPair("keiner", "keinem", "dative");
addDeterminerPair("keiner", "keines", "genitive");
addDeterminerPair("jede", "jeder", "nominative");
addDeterminerPair("jede", "jeden", "accusative");
addDeterminerPair("jeder", "jedem", "dative");
addDeterminerPair("jeder", "jedes", "genitive");
addDeterminerPair("welche", "welcher", "nominative");
addDeterminerPair("welche", "welchen", "accusative");
addDeterminerPair("welcher", "welchem", "dative");
addDeterminerPair("welcher", "welches", "genitive");
addDeterminerPair("diese", "dieser", "nominative");
addDeterminerPair("diese", "diesen", "accusative");
addDeterminerPair("dieser", "diesem", "dative");
addDeterminerPair("dieser", "dieses", "genitive");

function addPossessivePairs(
  feminineNominativeAccusative: string,
  feminineDativeGenitive: string,
  masculineNominative: string,
  masculineAccusative: string,
  masculineDative: string,
  masculineGenitive: string
): void {
  addDeterminerPair(
    feminineNominativeAccusative,
    masculineNominative,
    "nominative"
  );
  addDeterminerPair(
    feminineNominativeAccusative,
    masculineAccusative,
    "accusative"
  );
  addDeterminerPair(feminineDativeGenitive, masculineDative, "dative");
  addDeterminerPair(feminineDativeGenitive, masculineGenitive, "genitive");
}

addPossessivePairs("meine", "meiner", "mein", "meinen", "meinem", "meines");
addPossessivePairs("deine", "deiner", "dein", "deinen", "deinem", "deines");
addPossessivePairs("seine", "seiner", "sein", "seinen", "seinem", "seines");
addPossessivePairs("ihre", "ihrer", "ihr", "ihren", "ihrem", "ihres");
addPossessivePairs(
  "unsere",
  "unserer",
  "unser",
  "unseren",
  "unserem",
  "unseres"
);
addPossessivePairs("eure", "eurer", "euer", "euren", "eurem", "eures");

const determinerAlternation = [
  ...new Set(
    determinerPairs.flatMap((pair) => [pair.feminine, pair.masculine])
  )
]
  .sort((left, right) => right.length - left.length)
  .join("|");
const inflectedPhrasePattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}])(${determinerAlternation})(\s+)(${word})(${connector})(${determinerAlternation})(\s+)(${word})(?![\p{L}\p{M}])`,
  "giu"
);

function isRejectedPair(left: string, right: string): boolean {
  const normalizedLeft = left.toLocaleLowerCase(locale);
  const normalizedRight = right.toLocaleLowerCase(locale);

  return (
    (normalizedLeft === "bauer" && normalizedRight === "bauerin") ||
    (normalizedLeft === "bauerin" && normalizedRight === "bauer")
  );
}

function mapPair(left: string, right: string): string | undefined {
  if (isRejectedPair(left, right)) {
    return undefined;
  }

  return (
    mapMappedSingularPair(left, right) ?? mapKnownSingularPair(left, right)
  );
}

function transformInflectedPhrases(input: string): TransformResult {
  let replacements = 0;
  const text = input.replace(
    inflectedPhrasePattern,
    (
      match: string,
      leftDeterminer: string,
      leftWhitespace: string,
      leftNoun: string,
      _connector: string,
      rightDeterminer: string,
      rightWhitespace: string,
      rightNoun: string
    ) => {
      const normalizedLeftDeterminer = leftDeterminer.toLocaleLowerCase(locale);
      const normalizedRightDeterminer = rightDeterminer.toLocaleLowerCase(locale);

      for (const pair of determinerPairs) {
        if (
          normalizedLeftDeterminer === pair.feminine &&
          normalizedRightDeterminer === pair.masculine
        ) {
          const masculineNoun =
            mapMappedInflectedSingularPair(
              leftNoun,
              rightNoun,
              pair.grammaticalCase
            ) ??
            mapKnownInflectedSingularPair(
              leftNoun,
              rightNoun,
              pair.grammaticalCase
            );
          if (masculineNoun) {
            replacements += 1;
            return rightDeterminer + rightWhitespace + masculineNoun;
          }
        }

        if (
          normalizedLeftDeterminer === pair.masculine &&
          normalizedRightDeterminer === pair.feminine
        ) {
          const masculineNoun =
            mapMappedInflectedSingularPair(
              rightNoun,
              leftNoun,
              pair.grammaticalCase
            ) ??
            mapKnownInflectedSingularPair(
              rightNoun,
              leftNoun,
              pair.grammaticalCase
            );
          if (masculineNoun) {
            replacements += 1;
            return leftDeterminer + leftWhitespace + masculineNoun;
          }
        }
      }

      return match;
    }
  );
  return { text, replacements };
}

function transformSingularDoubleForms(input: string): TransformResult {
  let replacements = 0;

  const text = input.replace(
    singularDoubleFormPattern,
    (match: string, left: string, _connector: string, right: string) => {
      const masculine = mapPair(left, right);

      if (!masculine) {
        return match;
      }

      replacements += 1;
      return masculine;
    }
  );

  return { text, replacements };
}

export const singularDoubleFormsRule: Rule = {
  id: "singular.explicit-double-form",
  risk: "safe",

  apply(input) {
    const phraseResult = transformInflectedPhrases(input);
    const wordResult = transformSingularDoubleForms(phraseResult.text);
    return {
      text: wordResult.text,
      replacements: phraseResult.replacements + wordResult.replacements
    };
  }
};
