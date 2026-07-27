import type { Rule } from "../core/rule";

const locale = "de-DE";

const phraseReplacements = new Map<string, string>([
  ["mitarbeitende personen", "mitarbeiter"]
]);

const tokenReplacements = new Map<string, string>([
  ["mitarbeitende", "mitarbeiter"],
  ["teilnehmende", "teilnehmer"],
  ["nutzende", "nutzer"],
  ["studierende", "studenten"],
  ["forschende", "forscher"],
  ["lehrende", "lehrer"],
  ["lesende", "leser"],
  ["zuhörende", "zuhörer"]
]);

const phrasePattern =
  /(?<![\p{L}\p{M}])(mitarbeitende\s+personen)(?![\p{L}\p{M}])/giu;
const tokenPattern =
  /(?<![\p{L}\p{M}])(Mitarbeitende|Teilnehmende|Nutzende|Studierende|Forschende|Lehrende|Lesende|Zuhörende)(?![\p{L}\p{M}])/giu;

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
    let replacements = 0;

    const phrases = input.replace(phrasePattern, (match: string) => {
      const normalized = match.toLocaleLowerCase(locale).replace(/\s+/gu, " ");
      const replacement = phraseReplacements.get(normalized);
      if (!replacement) {
        return match;
      }

      replacements += 1;
      return applyTokenCase(match, replacement);
    });

    const text = phrases.replace(tokenPattern, (match: string) => {
      const replacement = tokenReplacements.get(match.toLocaleLowerCase(locale));
      if (!replacement) {
        return match;
      }

      replacements += 1;
      return applyTokenCase(match, replacement);
    });

    return { text, replacements };
  }
};
