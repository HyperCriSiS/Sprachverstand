import type { Rule, TransformResult } from "../core/rule";

const locale = "de-DE";

const salutationReplacements = new Map<string, string>([
  ["mitarbeitende", "mitarbeiter"],
  ["teilnehmende", "teilnehmer"],
  ["nutzende", "nutzer"],
  ["studierende", "studenten"],
  ["forschende", "forscher"],
  ["lehrende", "lehrer"]
]);

const participleSource =
  String.raw`Mitarbeitende|Teilnehmende|Nutzende|Studierende|Forschende|Lehrende`;
const salutationPattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}])((?:sehr\s+geehrte|liebe)\s+)(${participleSource})(?:\s+Personen)?(?![\p{L}\p{M}])`,
  "giu"
);
const leadingContextCandidate = new RegExp(
  String.raw`^\s*(?:${participleSource})(?:\s+Personen)?(?![\p{L}\p{M}])`,
  "iu"
);
const leadingSalutationPattern = /(?:sehr\s+geehrte|liebe)\s*$/iu;
const leadingTokenPattern = new RegExp(
  String.raw`^(\s*)(${participleSource})(?:\s+Personen)?`,
  "iu"
);

function applyTokenCase(source: string, replacement: string): string {
  const lowerSource = source.toLocaleLowerCase(locale);
  const upperSource = source.toLocaleUpperCase(locale);

  if (source === upperSource && source !== lowerSource) {
    return replacement.toLocaleUpperCase(locale);
  }

  const characters = [...replacement];
  const firstReplacementCharacter = characters.shift();

  return firstReplacementCharacter
    ? firstReplacementCharacter.toLocaleUpperCase(locale) + characters.join("")
    : replacement;
}

function transformSalutations(input: string): TransformResult {
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

function transformWithLeadingContext(
  input: string,
  leadingContext: string
): TransformResult {
  const direct = transformSalutations(input);
  if (direct.replacements > 0 || !leadingSalutationPattern.test(leadingContext)) {
    return direct;
  }

  const match = leadingTokenPattern.exec(input);
  const participle = match?.[2];
  if (!match || !participle) {
    return direct;
  }

  const replacement = salutationReplacements.get(
    participle.toLocaleLowerCase(locale)
  );
  if (!replacement) {
    return direct;
  }

  return {
    text:
      match[1] +
      applyTokenCase(participle, replacement) +
      input.slice(match[0].length),
    replacements: 1
  };
}

export const salutationParticiplesRule: Rule = {
  id: "salutation.participial-forms",
  risk: "contextual",
  leadingContextCandidate,
  apply: transformSalutations,
  applyWithLeadingContext: transformWithLeadingContext
};
