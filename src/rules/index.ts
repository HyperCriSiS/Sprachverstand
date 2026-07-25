import type { Rule } from "../core/rule";
import { binnenIPluralRule } from "./binnen-i";
import { doubleFormsRule } from "./double-forms";
import { knownPluralSeparatorsRule } from "./known-plural-separators";
import { mappedPluralSeparatorsRule } from "./mapped-plural-separators";
import { singularContextRule } from "./singular-context";
import { specialSingularFormsRule } from "./special-singular-forms";

export const defaultRules: readonly Rule[] = [
  singularContextRule,
  specialSingularFormsRule,
  doubleFormsRule,
  knownPluralSeparatorsRule,
  mappedPluralSeparatorsRule,
  binnenIPluralRule
];
