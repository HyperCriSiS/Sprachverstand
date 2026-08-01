import type { Rule } from "../core/rule";
import { binnenIPluralRule } from "./binnen-i";
import { doubleFormsRule } from "./double-forms";
import { explicitPronounsRule } from "./explicit-pronouns";
import { jobAdSuffixesRule } from "./job-ad-suffixes";
import { knownPluralSeparatorsRule } from "./known-plural-separators";
import { mappedPluralSeparatorsRule } from "./mapped-plural-separators";
import { neutralPersonTermsRule } from "./neutral-person-terms";
import { salutationParticiplesRule } from "./salutation-participles";
import { singularContextRule } from "./singular-context";
import { singularDoubleFormsRule } from "./singular-double-forms";
import {
  additionalPersonPluralRule,
  additionalPersonSingularRule
} from "./additional-person-forms";
import { specialGenderFormsRule } from "./special-gender-forms";
import { specialSingularFormsRule } from "./special-singular-forms";
import { substantivizedAdjectivesRule } from "./substantivized-adjectives";
import { titleAbbreviationsRule } from "./title-abbreviations";
import { unmarkedSingularRule } from "./unmarked-singular";

export const defaultRules: readonly Rule[] = [
  singularContextRule,
  specialSingularFormsRule,
  substantivizedAdjectivesRule,
  unmarkedSingularRule,
  additionalPersonSingularRule,
  specialGenderFormsRule,
  singularDoubleFormsRule,
  explicitPronounsRule,
  titleAbbreviationsRule,
  salutationParticiplesRule,
  neutralPersonTermsRule,
  doubleFormsRule,
  additionalPersonPluralRule,
  knownPluralSeparatorsRule,
  mappedPluralSeparatorsRule,
  binnenIPluralRule,
  jobAdSuffixesRule
];
