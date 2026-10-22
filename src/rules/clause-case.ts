import type { TransformResult } from "../core/rule";
import type { GrammaticalCase } from "./person-lexicon";
import { finiteVerbsBeforeDer } from "./finite-verbs-before-der";

/*
 * Ambiguous determiner + marked singular (`die/eine/Ihre/Jede … Lehrer*in`)
 * where the clause decides the case:
 *   (a) the whole text is the phrase, a heading (`Ihre Arbeitgeber:in`,
 *       `Unsere Ansprechpartner*in im Personalmarketing`): nominative;
 *   (b) sentence start followed by a finite verb (`Jede Teilnehmer*in
 *       erhält`): nominative;
 *   (c) after a copula (`… ist eine Mitarbeiter*in`): nominative;
 *   (d) a transitive verb with its subject pronoun right before or after it
 *       (`Wir suchen ab Oktober eine Mitarbeiter:in`, `suchen wir … eine …`,
 *       `Laden Sie eine … ein`): accusative.
 * Everything else keeps the protection of the ambiguous determiner.
 */
const locale = "de-DE";
const nominative = new Map([
  ["die", "der"], ["eine", "ein"], ["jede", "jeder"], ["keine", "kein"], ["diese", "dieser"],
  ["meine", "mein"], ["deine", "dein"], ["seine", "sein"], ["ihre", "ihr"], ["unsere", "unser"], ["eure", "euer"]
]);
const accusative = new Map([
  ["die", "den"], ["eine", "einen"], ["jede", "jeden"], ["keine", "keinen"], ["diese", "diesen"],
  ["meine", "meinen"], ["deine", "deinen"], ["seine", "seinen"], ["ihre", "ihren"], ["unsere", "unseren"], ["eure", "euren"]
]);
const strongNominative = new Set(["ein", "kein", "mein", "dein", "sein", "ihr", "unser", "euer"]);
// Either capitalization of the first letter (sentence starts, headings).
function capitalizable(words: readonly string[]): string {
  return words.map((word) => `[${word[0]}${word[0]!.toLocaleUpperCase(locale)}]${word.slice(1)}`).join("|");
}
const determiner = `(?:${capitalizable(["die", "eine", "jede", "keine", "diese", "meine", "deine", "seine", "ihre", "unsere", "eure"])})`;
const attributes = String.raw`((?:\p{Ll}[\p{L}\p{M}]*e\s+){0,2})`;
const marked = String.raw`(\p{Lu}[\p{L}\p{M}’'-]*?)(?:(?:\/-?|[:*_·•])in|\(-?in\))`;
const end = String.raw`(?![\p{L}\p{M}-])`;
const copulas = "ist|sind|war|waren|wird|wurde|bleibt|blieb";
const subjectPronouns = `${capitalizable(["ich", "du", "er", "wir", "ihr", "man"])}|Sie`;
const accusativeVerbs = capitalizable([
  "suche", "suchen", "sucht", "brauchen", "braucht", "benötigen", "benötigt", "haben", "hat",
  "bekommst", "bekommen", "bekommt", "erhalten", "erhältst", "finden", "findest", "kennen", "kennst",
  "laden", "lädt", "stellen", "stellt", "begrüßen", "begrüßt", "unterstützen", "unterstützt",
  "fragen", "fragt", "kontaktieren", "kontaktiert", "informieren", "informiert", "beauftragen",
  "ernennen", "wählen", "wählt", "beschäftigen", "beschäftigt", "einstellen", "engagieren"
]);

const standalonePattern = new RegExp(
  String.raw`^(\s*)(${determiner})(\s+)${attributes}${marked}((?:\s+(?:im|in|am|an|für|bei|beim|von|vom|aus|zur|zum|der|des)\s+[^.!?,;:\n]{1,40})?\s*[.!?:]?\s*)$`,
  "iu"
);
const sentenceStartPattern = new RegExp(
  String.raw`(^|[.!?]\s+)(${determiner})(\s+)${attributes}${marked}${end}(?=\s+([\p{Ll}]+)(?:\s+([\p{L}]+))?)`,
  "gu"
);
const copulaPattern = new RegExp(
  // Only adverbs between copula and phrase; a preposition (`ist für die …`)
  // governs its own case.
  String.raw`((?<![\p{L}\p{M}])(?:${copulas})\s+(?:(?:auch|nun|jetzt|immer|noch|schon|bereits|ebenfalls|zudem|hier|dort|nicht|stets|wieder|weiterhin)\s+){0,2})(${determiner})(\s+)${attributes}${marked}${end}`,
  "gu"
);
const accusativePattern = new RegExp(
  String.raw`((?<![\p{L}\p{M}])(?:(?:${subjectPronouns})\s+(?:${accusativeVerbs})|(?:${accusativeVerbs})\s+(?:${subjectPronouns}))(?:\s+[\p{L}\p{M}\d.]+){0,4}?\s+)(${determiner})(\s+)${attributes}${marked}${end}`,
  "gu"
);

function applyCase(source: string, replacement: string): string {
  return source[0] === source[0]?.toLocaleUpperCase(locale)
    ? replacement[0]!.toLocaleUpperCase(locale) + replacement.slice(1)
    : replacement;
}

function phrase(
  determinerWord: string, space: string, attributeText: string, base: string,
  grammaticalCase: "nominative" | "accusative",
  mapNoun: (base: string, grammaticalCase: GrammaticalCase) => string | undefined
): string | undefined {
  const lower = determinerWord.toLocaleLowerCase(locale);
  const masculine = (grammaticalCase === "nominative" ? nominative : accusative).get(lower);
  const noun = mapNoun(base, grammaticalCase);
  if (!masculine || !noun) return undefined;
  const strong = grammaticalCase === "nominative" && strongNominative.has(masculine);
  const inflected = attributeText.replace(/\p{Ll}[\p{L}\p{M}]*e(?=\s)/gu, (word) =>
    grammaticalCase === "accusative" ? `${word}n` : strong ? `${word}r` : word);
  return applyCase(determinerWord, masculine) + space + inflected + noun;
}

export function transformClauseCase(
  input: string,
  mapNoun: (base: string, grammaticalCase: GrammaticalCase) => string | undefined
): TransformResult {
  let replacements = 0;
  let text = input;
  const standalone = standalonePattern.exec(text);
  // Only a capitalized determiner marks a heading; a lowercase phrase can be
  // an inline fragment of a longer sentence (`<em>eine Patient*in</em>`).
  if (standalone && /^\p{Lu}/u.test(standalone[2]!)) {
    const [, lead, determinerWord, space, attributeText, base, tail] = standalone;
    const converted = phrase(determinerWord!, space!, attributeText!, base!, "nominative", mapNoun);
    if (converted) return {text: lead + converted + tail, replacements: 1};
  }
  text = text.replace(sentenceStartPattern,
    (match: string, prefix: string, determinerWord: string, space: string, attributeText: string,
      base: string, next: string, afterVerb: string | undefined) => {
      // `Ihre Stromanbieter:in können Sie … auswählen`: a subject pronoun after
      // the verb makes the fronted phrase the object.
      if (afterVerb && /^(?:ich|du|er|sie|es|wir|ihr|Sie|man)$/u.test(afterVerb)) return match;
      if (!finiteVerbsBeforeDer.has(next) && !/^(?:erhält|kommt|arbeitet|leitet|bietet|beginnt|unterrichtet|berät|begleitet|übernimmt|trägt|stellt|hilft|zeigt|spricht)$/u.test(next)) return match;
      const converted = phrase(determinerWord, space, attributeText, base, "nominative", mapNoun);
      if (!converted) return match;
      replacements += 1;
      return prefix + converted;
    });
  text = text.replace(copulaPattern, (match: string, prefix: string, determinerWord: string, space: string,
    attributeText: string, base: string) => {
    const converted = phrase(determinerWord, space, attributeText, base, "nominative", mapNoun);
    if (!converted) return match;
    replacements += 1;
    return prefix + converted;
  });
  text = text.replace(accusativePattern, (match: string, prefix: string, determinerWord: string, space: string,
    attributeText: string, base: string) => {
    if (/[,;]/u.test(prefix)) return match;
    const converted = phrase(determinerWord, space, attributeText, base, "accusative", mapNoun);
    if (!converted) return match;
    replacements += 1;
    return prefix + converted;
  });
  return {text, replacements};
}
