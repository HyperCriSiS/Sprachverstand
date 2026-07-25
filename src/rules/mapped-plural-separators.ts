import type { Rule } from "../core/rule";
import { transformGenderedPlural } from "./gendered-plural";
import { mapMappedPlural } from "./person-lexicon";

export { mapMappedPlural } from "./person-lexicon";

export const mappedPluralSeparatorsRule: Rule = {
  id: "plural.mapped-separator-innen",
  risk: "safe",

  apply(input) {
    return transformGenderedPlural(input, mapMappedPlural);
  }
};
