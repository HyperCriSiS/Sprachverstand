import type { Rule } from "../core/rule";
import { binnenIPluralRule } from "./binnen-i";
import { doubleFormsRule } from "./double-forms";
import { knownPluralSeparatorsRule } from "./known-plural-separators";
import { mappedPluralSeparatorsRule } from "./mapped-plural-separators";
import { singularContextRule } from "./singular-context";

export const defaultRules: readonly Rule[] = [
  singularContextRule,
  doubleFormsRule,
  knownPluralSeparatorsRule,
  mappedPluralSeparatorsRule,
  binnenIPluralRule
];
