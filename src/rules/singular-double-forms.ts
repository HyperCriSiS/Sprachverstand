import type { Rule, TransformResult } from "../core/rule";
import { mapKnownSingularPair } from "./known-plural-separators";
import { mapMappedSingularPair } from "./person-lexicon";

const locale = "de-DE";
const word = String.raw`[\p{L}\p{M}’'-]+`;
const connector = String.raw`(?:\s*(?:/|&)\s*|\s+(?:und|oder|bzw\.|beziehungsweise)\s+)`;
const singularDoubleFormPattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}])(${word})(${connector})(${word})(?![\p{L}\p{M}])`,
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
  apply: transformSingularDoubleForms
};
