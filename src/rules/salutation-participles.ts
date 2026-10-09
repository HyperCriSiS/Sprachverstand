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
// Auch bei zwischenliegenden Adjektiven und Adverbien bleibt ein
// singularisches Bezugswort vor einem substantivierten Partizip geschützt.
const extendedSingularPrefixPattern =
  /(?:^|\s)(?:eine|die|der|diese|dieser|jene|jener|welche|welcher|keine|meine|deine|seine|ihre|unsere|eure)\s+(?:[\p{L}\p{M}-]+\s+){1,6}$/iu;
const singularRolePrefixPattern = /(?:^|\s)als\s*$/iu;

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
    (match: string, salutation: string, participle: string, offset: number, source: string) => {
      // Anreden können auch attributive Adjektive einleiten.
      // Das folgende Substantiv bzw. Kleinschreibung schützt diese Fälle.
      if (
        participle === participle.toLocaleLowerCase(locale) ||
        followingNounPattern.test(source.slice(offset + match.length))
      ) {
        return match;
      }

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
          extendedSingularPrefixPattern.test(before) ||
          singularRolePrefixPattern.test(before) ||
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
  const contextual = transformContextualParticiples(input);
  const salutations = transformSalutations(contextual.text);
  const standalone = transformStandaloneParticiples(salutations.text);

  return {
    text: standalone.text,
    replacements: contextual.replacements + salutations.replacements + standalone.replacements
  };
}

function transformWithLeadingContext(
  input: string,
  leadingContext: string
): TransformResult {
  if (!leadingSalutationPattern.test(leadingContext)) {
    // Für Soft-Hyphen- und Inline-Textsegmente den vorangestellten
    // Artikel in der Flexion berücksichtigen, ohne ihn selbst umzuschreiben.
    const combined = transformContextualParticiples(leadingContext + input);
    if (
      combined.replacements > 0 &&
      combined.text.startsWith(leadingContext)
    ) {
      const remainder = transformParticiples(
        combined.text.slice(leadingContext.length)
      );
      return {
        text: remainder.text,
        replacements: combined.replacements + remainder.replacements
      };
    }
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


// Die kontextuelle Flexion ist nur für bereits gelistete Personenwörter
// freigegeben. Keine Ableitung für beliebige Partizip-Endungen.
const participleStemSource = [...participleReplacements.keys()]
  .map((form) => form.slice(0, -1))
  .sort((left, right) => right.length - left.length)
  .join("|");

const contextualParticiplePattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}])((?:(?:mit|bei|von|zu|aus|nach|seit)\s+den|die|den|der|dem|ein|eine|einen|einem|eines))(\s+)(${participleStemSource})(en|er|e)(?![\p{L}\p{M}-])`,
  "giu"
);

const weakMasculineSingulars = new Set(["studierende", "dozierende"]);

function transformContextualParticiples(input: string): TransformResult {
  let replacements = 0;
  const text = input.replace(
    contextualParticiplePattern,
    (
      match: string,
      determiner: string,
      whitespace: string,
      stem: string,
      ending: string,
      offset: number,
      source: string
    ) => {
      const term = (stem + "e").toLocaleLowerCase(locale);
      const plural = participleReplacements.get(term);
      if (!plural) return match;

      // Kleingeschriebene Partizipien sind regelmäßig Adjektive.
      // Ein nachfolgendes großgeschriebenes Substantiv wird geschützt.
      const start = [...stem][0];
      if (
        !start ||
        start === start.toLocaleLowerCase(locale) ||
        followingNounPattern.test(source.slice(offset + match.length))
      ) {
        return match;
      }

      const weak = weakMasculineSingulars.has(term);
      const masculine = weak ? plural.slice(0, -2) : plural;
      const feminine = masculine + "in";
      const normalizedDeterminer = determiner.toLocaleLowerCase(locale)
        .replace(/\s+/gu, " ");
      const normalizedEnding = ending.toLocaleLowerCase(locale);
      let replacement: string | undefined;

      if (/^(?:mit|bei|von|zu|aus|nach|seit) den$/u.test(normalizedDeterminer)) {
        if (normalizedEnding === "en") {
          replacement = /[ns]$/u.test(plural) ? plural : plural + "n";
        }
      } else if (normalizedDeterminer === "die") {
        if (normalizedEnding === "en") replacement = plural;
        if (normalizedEnding === "e") replacement = feminine;
      } else if (normalizedDeterminer === "der" && normalizedEnding === "e") {
        replacement = masculine;
      } else if (normalizedDeterminer === "ein" && normalizedEnding === "er") {
        replacement = masculine;
      } else if (normalizedDeterminer === "eine" && normalizedEnding === "e") {
        replacement = feminine;
      } else if (
        ["dem", "einem", "einen"].includes(normalizedDeterminer) &&
        normalizedEnding === "en"
      ) {
        replacement = weak ? plural : masculine;
      } else if (
        normalizedDeterminer === "eines" &&
        normalizedEnding === "en"
      ) {
        replacement = weak ? plural : masculine + "s";
      } else if (
        normalizedDeterminer === "den" &&
        normalizedEnding === "en" &&
        weak
      ) {
        // Bei starken Maskulina könnte "den Mitarbeitenden" auch
        // Akkusativ Singular sein: ohne eindeutigere Signale schützen.
        replacement = plural;
      }

      if (!replacement) return match;
      replacements += 1;
      return determiner + whitespace + applyTokenCase(stem, replacement);
    }
  );

  return { text, replacements };
}

export const salutationParticiplesRule: Rule = {
  id: "salutation.participial-forms",
  risk: "contextual",
  leadingContextCandidate,
  apply: transformParticiples,
  applyWithLeadingContext: transformWithLeadingContext
};