import type { Rule } from "../core/rule";
import { transformGenderedPlural } from "./gendered-plural";
import { mapKnownPlural } from "./known-plural-separators";
import { mapMappedPlural } from "./mapped-plural-separators";

const binnenIPluralPattern =
  /(?<![\p{L}\p{M}])([\p{L}\p{M}’'-]+)Innen(?![\p{L}\p{M}])/gu;

function mapPlural(base: string): string | undefined {
  return mapMappedPlural(base) ?? mapKnownPlural(base);
}

export const binnenIPluralRule: Rule = {
  id: "plural.binnen-i",
  risk: "safe",

  apply(input) {
    return transformGenderedPlural(input, mapPlural, binnenIPluralPattern);
  }
};
