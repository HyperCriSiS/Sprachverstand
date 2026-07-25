import type { Rule } from "../core/rule";
import { binnenIPluralRule } from "./binnen-i";
import { knownPluralSeparatorsRule } from "./known-plural-separators";
import { mappedPluralSeparatorsRule } from "./mapped-plural-separators";

export const defaultRules: readonly Rule[] = [
  knownPluralSeparatorsRule,
  mappedPluralSeparatorsRule,
  binnenIPluralRule
];
