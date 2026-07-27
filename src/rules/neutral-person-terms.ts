import type { Rule } from "../core/rule";

const locale = "de-DE";

const replacements = new Map<string, string>([
  ["mitarbeitende personen", "mitarbeiter"],
  ["benutzungshandbuch", "benutzerhandbuch"]
]);

const contextualPattern =
  /(?<![\p{L}\p{M}])(mitarbeitende\s+personen|Benutzungshandbuch)(?![\p{L}\p{M}])/giu;

function applyTokenCase(source: string, replacement: string): string {
  const lower = source.toLocaleLowerCase(locale);
  const upper = source.toLocaleUpperCase(locale);

  if (source === upper && source !== lower) {
    return replacement.toLocaleUpperCase(locale);
  }

  const first = [...source][0];
  if (first && first === first.toLocaleUpperCase(locale)) {
    return replacement[0]?.toLocaleUpperCase(locale) + replacement.slice(1);
  }

  return replacement;
}

export const neutralPersonTermsRule: Rule = {
  id: "neutral.person-terms",
  risk: "contextual",

  apply(input) {
    let replacementsCount = 0;

    const text = input.replace(contextualPattern, (match: string) => {
      const normalized = match
        .toLocaleLowerCase(locale)
        .replace(/\s+/gu, " ");
      const replacement = replacements.get(normalized);
      if (!replacement) {
        return match;
      }

      replacementsCount += 1;
      return applyTokenCase(match, replacement);
    });

    return { text, replacements: replacementsCount };
  }
};
