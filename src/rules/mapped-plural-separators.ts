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

function isTitleCasePart(part: string): boolean {
  const characters = [...part];
  const first = characters.shift();
  const remaining = characters.join("");

  return Boolean(
    first &&
      first === first.toLocaleUpperCase(locale) &&
      remaining === remaining.toLocaleLowerCase(locale)
  );
}

function applyTokenCase(source: string, replacement: string): string {
  const lowerSource = source.toLocaleLowerCase(locale);
  const upperSource = source.toLocaleUpperCase(locale);

  if (source === upperSource && source !== lowerSource) {
    return replacement.toLocaleUpperCase(locale);
  }

  const sourceParts = source.split("-");
  const replacementParts = replacement.split("-");
  if (
    sourceParts.length > 1 &&
    sourceParts.length === replacementParts.length &&
    sourceParts.every(isTitleCasePart)
  ) {
    return replacementParts
      .map((part) => {
        const characters = [...part];
        const first = characters.shift();
        return first
          ? first.toLocaleUpperCase(locale) +
              characters.join("").toLocaleLowerCase(locale)
          : part;
      })
      .join("-");
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

  const mapped = mapLexiconPlural(base);
  return mapped === undefined ? undefined : applyTokenCase(base, mapped);
}

export const mappedPluralSeparatorsRule: Rule = {
  id: "plural.mapped-separator-innen",
  risk: "safe",

  apply(input) {
    return transformGenderedPlural(input, mapMappedPlural);
  }
};
