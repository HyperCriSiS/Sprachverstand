import type { Rule } from "../core/rule";

const locale = "de-DE";

const salutationReplacements = new Map<string, string>([
  ["mitarbeitende", "mitarbeiter"],
  ["teilnehmende", "teilnehmer"],
  ["nutzende", "nutzer"],
  ["studierende", "studenten"],
  ["forschende", "forscher"],
  ["lehrende", "lehrer"]
]);

const salutationPattern =
  /(?<![\p{L}\p{M}])((?:sehr\s+geehrte|liebe)\s+)(Mitarbeitende|Teilnehmende|Nutzende|Studierende|Forschende|Lehrende)(?![\p{L}\p{M}])/giu;

function applyTokenCase(source: string, replacement: string): string {
  const lowerSource = source.toLocaleLowerCase(locale);
  const upperSource = source.toLocaleUpperCase(locale);

  if (source === upperSource && source !== lowerSource) {
    return replacement.toLocaleUpperCase(locale);
  }

  const firstSourceCharacter = [...source][0];
  if (
    firstSourceCharacter &&
    firstSourceCharacter === firstSourceCharacter.toLocaleUpperCase(locale)
  ) {
    const characters = [...replacement];
    const firstReplacementCharacter = characters.shift();

    return firstReplacementCharacter
      ? firstReplacementCharacter.toLocaleUpperCase(locale) + characters.join("")
      : replacement;
  }

  return replacement;
}

export const salutationParticiplesRule: Rule = {
  id: "salutation.participial-forms",
  risk: "contextual",

  apply(input) {
    let replacements = 0;

    const text = input.replace(
      salutationPattern,
      (match: string, salutation: string, participle: string) => {
        const replacement = salutationReplacements.get(
          participle.toLocaleLowerCase(locale)
        );

        if (!replacement) {
          return match;
        }

        replacements += 1;
        return salutation + applyTokenCase(participle, replacement);
      }
    );

    return { text, replacements };
  }
};
