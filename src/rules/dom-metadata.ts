import type {Rule, RuleRisk} from "../core/rule";
import {markedLeadingCandidate, participleLeadingCandidate} from "./context-candidates";

function unavailable(): never {
  throw new Error("DOM rule metadata requires the local asynchronous transformer.");
}

// No lexicon or transformation patterns are loaded in the page renderer.
// A parity test keeps order, risk and contextual metadata in sync with rules.
const definitions: readonly (readonly [string, RuleRisk])[] = [
  ["singular.explicit-context", "safe"],
  ["singular.natural-family-forms", "safe"],
  ["adjective.substantivized-markers", "safe"],
  ["singular.unmarked-marker", "contextual"],
  ["singular.additional-person-forms", "contextual"],
  ["special.visible-gender-forms", "safe"],
  ["singular.explicit-double-form", "safe"],
  ["marker.inflected-stem-singular", "safe"],
  ["pronoun.explicit-pairs", "safe"],
  ["title.gendered-abbreviations", "safe"],
  ["salutation.participial-forms", "contextual"],
  ["neutral.person-terms", "contextual"],
  ["plural.double-forms", "safe"],
  ["plural.marked-dative-context", "safe"],
  ["plural.additional-person-forms", "safe"],
  ["plural.known-separator-innen", "safe"],
  ["plural.mapped-separator-innen", "safe"],
  ["plural.binnen-i", "safe"],
  ["marker.inflected-stem-plural", "safe"],
  ["job-ad.gender-suffixes", "contextual"]
];
export const domRuleMetadata: readonly Rule[] = definitions.map(([id, risk]) => ({
  id, risk, apply: unavailable,
  ...(id === "salutation.participial-forms" ? {
    leadingContextCandidate: participleLeadingCandidate,
    applyWithLeadingContext: unavailable
  } : {}),
  ...(id === "plural.marked-dative-context" ? {
    leadingContextCandidate: markedLeadingCandidate,
    leadingContextRequiresTrailingWhitespace: true,
    applyWithLeadingContext: unavailable
  } : {})
}));
