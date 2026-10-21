import {beforeEach, expect, vi} from "vitest";
import {defaultRules} from "../src/rules";
import {isBuiltInTransformCandidate} from "../src/rules/transform-candidate";

// Keep every existing positive rule/context fixture as a counterexample to
// an overly narrow renderer prefilter, including future lexicon additions.
const originals = defaultRules.map(rule => ({rule, apply: rule.apply,
  context: rule.applyWithLeadingContext}));

beforeEach(() => {
  for (const {rule, apply, context} of originals) {
    vi.spyOn(rule, "apply").mockImplementation(input => {
      const result = apply(input);
      if (result.replacements > 0) {
        expect(isBuiltInTransformCandidate(input), `${rule.id}: ${input}`).toBe(true);
      }
      return result;
    });
    if (context) {
      vi.spyOn(rule, "applyWithLeadingContext").mockImplementation((input, leading) => {
        const result = context(input, leading);
        if (result.replacements > 0) {
          expect(isBuiltInTransformCandidate(input), `${rule.id}: ${input}`).toBe(true);
        }
        return result;
      });
    }
  }
});
