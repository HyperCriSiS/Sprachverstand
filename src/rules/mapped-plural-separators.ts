import type { Rule } from "../core/rule";
import { transformGenderedPlural } from "./gendered-plural";
import { mapMappedPlural as mapLexiconPlural } from "./person-lexicon";

const locale = "de-DE";
const additionalPluralForms = new Map<string, string>([
  ["dirigent", "dirigenten"],
  ["dozent", "dozenten"],
  ["jüd", "juden"],
  ["solist", "solisten"]
]);

function applyTokenCase(source: string, replacement: string): string {
  const lowerSource = source.toLocaleLowerCase(locale);
  const upperSource = source.toLocaleUpperCase(locale);

  if (source === upperSource && source !== lowerSource) {
    return replacement.toLocaleUpperCase(locale);
  }

  const first = [...source][0];
  if (first && first === first.toLocaleUpperCase(locale)) {
    const characters = [...replacement];
    const firstReplacementCharacter = characters.shift();
    return firstReplacementCharacter
      ? firstReplacementCharacter.toLocaleUpperCase(locale) + characters.join("")
      : replacement;
  }

  return replacement;
}

export function mapMappedPlural(base: string): string | undefined {
  const normalizedBase = base.toLocaleLowerCase(locale);

  for (const [suffix, plural] of additionalPluralForms) {
    if (!normalizedBase.endsWith(suffix)) {
      continue;
    }

    const prefix = base.slice(0, -suffix.length);
    const sourceSuffix = base.slice(-suffix.length);
    return prefix + applyTokenCase(sourceSuffix, plural);
  }

  return mapLexiconPlural(base);
}

export const mappedPluralSeparatorsRule: Rule = {
  id: "plural.mapped-separator-innen",
  risk: "safe",

  apply(input) {
    return transformGenderedPlural(input, mapMappedPlural);
  }
};
