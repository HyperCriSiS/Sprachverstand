import type { Rule, TransformResult } from "../core/rule";

const locale = "de-DE";

const participleReplacements = new Map<string, string>([
  ["mitarbeitende", "mitarbeiter"],
  ["teilnehmende", "teilnehmer"],
  ["nutzende", "nutzer"],
  ["studierende", "studenten"],
  ["forschende", "forscher"],
  ["lehrende", "lehrer"],
  ["lesende", "leser"],
  ["zuhörende", "zuhörer"],
  ["arbeitnehmende", "arbeitnehmer"],
  ["arbeitgebende", "arbeitgeber"],
  ["dozierende", "dozenten"],
  ["fördergebende", "förderer"],
  ["theatermachende", "theatermacher"]
]);

const participleSource = [
  "Mitarbeitende",
  "Teilnehmende",
  "Nutzende",
  "Studierende",
  "Forschende",
  "Lehrende",
  "Lesende",
  "Zuhörende",
  "Arbeitnehmende",
  "Arbeitgebende",
  "Dozierende",
  "Fördergebende",
  "Theatermachende"
].join("|");

const salutationPattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}])((?:sehr\s+geehrte|liebe)\s+)(${participleSource})(?:\s+Personen)?(?![\p{L}\p{M}])`,
  "giu"
);
const standalonePattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}])(${participleSource})(\s+Personen)?(?![\p{L}\p{M}])`,
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
const singularDeterminerPattern =
  /(?:^|\s)(?:eine|die|der|diese|dieser|jene|jener|welche|welcher|keine|meine|deine|seine|ihre|unsere|eure)\s*$/iu;
const followingNounPattern = /^\s+[\p{Lu}][\p{Ll}\p{M}-]+/u;

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

function replacementFor(participle: string): string | undefined {
  return participleReplacements.get(participle.toLocaleLowerCase(locale));
}

function transformSalutations(input: string): TransformResult {
  let replacements = 0;

  const text = input.replace(
    salutationPattern,
    (match: string, salutation: string, participle: string) => {
      const replacement = replacementFor(participle);
      if (!replacement) {
        return match;
      }

      replacements += 1;
      return salutation + applyTokenCase(participle, replacement);
    }
  );

  return { text, replacements };
}

function transformStandaloneParticiples(input: string): TransformResult {
  let replacements = 0;

  const text = input.replace(
    standalonePattern,
    (
      match: string,
      participle: string,
      persons: string | undefined,
      offset: number,
      source: string
    ) => {
      const replacement = replacementFor(participle);
      if (!replacement) {
        return match;
      }

      const before = source.slice(0, offset);
      const after = source.slice(offset + match.length);
      const startsWithLowercase =
        participle === participle.toLocaleLowerCase(locale);

      if (
        !persons &&
        (startsWithLowercase ||
          singularDeterminerPattern.test(before) ||
          followingNounPattern.test(after))
      ) {
        return match;
      }

      replacements += 1;
      return applyTokenCase(participle, replacement);
    }
  );

  return { text, replacements };
}

function transformParticiples(input: string): TransformResult {
  const salutations = transformSalutations(input);
  const standalone = transformStandaloneParticiples(salutations.text);

  return {
    text: standalone.text,
    replacements: salutations.replacements + standalone.replacements
  };
}

function transformWithLeadingContext(
  input: string,
  leadingContext: string
): TransformResult {
  if (!leadingSalutationPattern.test(leadingContext)) {
    return transformParticiples(input);
  }

  const match = leadingTokenPattern.exec(input);
  const participle = match?.[2];
  if (!match || !participle) {
    return transformParticiples(input);
  }

  const replacement = replacementFor(participle);
  if (!replacement) {
    return transformParticiples(input);
  }

  const leadingReplacement =
    match[1] +
    applyTokenCase(participle, replacement) +
    input.slice(match[0].length);
  const remaining = transformStandaloneParticiples(leadingReplacement);

  return {
    text: remaining.text,
    replacements: 1 + remaining.replacements
  };
}

export const salutationParticiplesRule: Rule = {
  id: "salutation.participial-forms",
  risk: "contextual",
  leadingContextCandidate,
  apply: transformParticiples,
  applyWithLeadingContext: transformWithLeadingContext
};
