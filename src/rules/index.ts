import type { Rule } from "../core/rule";
import { knownPluralSeparatorsRule } from "./known-plural-separators";
import { mappedPluralSeparatorsRule } from "./mapped-plural-separators";

export const defaultRules: readonly Rule[] = [
  knownPluralSeparatorsRule,
  mappedPluralSeparatorsRule
];
