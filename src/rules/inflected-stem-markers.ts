import type { Rule, TransformResult } from "../core/rule";
import { isExplicitPairToken } from "./explicit-pronouns";
import { mapKnownPlural } from "./known-plural-separators";
import { mapMappedPlural } from "./mapped-plural-separators";
import { mapMappedSingular } from "./person-lexicon";

/*
 * Marker hinter einer bereits flektierten maskulinen Form:
 * `Kollegen/-innen`, `Patienten*innen`, `Ärzte/innen`, `KollegenInnen`,
 * Dativ `Mitarbeitern/innen`, Singular `Psychologe/in` und obliquer
 * Singular `zum Assistenten/in`. Die maskuline Form steht schon im Text;
 * entfernt wird nur der Marker, und nur wenn das Lexikon genau diese Form
 * für eine Personenbezeichnung bildet. Unbekannte Stämme (`Kinderwagen/in`)
 * bleiben unverändert. Ausgeschlossen sind Wörter in Dateinamen, Pfaden und Adressen
 * (`…_Favoriten_in_Apolda.pdf`) und Schrägstrichreihen wie
 * `Fotografen*in/Videografen*in`, die sonst halb umgewandelt würden.
 */
const locale = "de-DE";
const separatorPattern =
  /(?<![\p{L}\p{M}\p{N}\u00AD_./\\@])(\p{Lu}[\p{L}\p{M}’'-]*?)(?:(?:[:*·•]|_(?=innen)|[/∕⁄／]-?)(innen|in)|\(-?(innen|in)\))(?![\p{L}\p{M}\p{N}_/]|-\p{Ll})/gu;
const binnenIPattern =
  /(?<![\p{L}\p{M}\p{N}\u00AD_./\\@])(\p{Lu}[\p{L}\p{M}’'-]*?\p{Ll})(Innen|In)(?![\p{L}\p{M}\p{N}_/]|-\p{Ll})/gu;

// Without the i flag; the lookahead only runs after a marker was found.
const candidatePattern =
  /(?:[:*_·•/∕⁄／(]-?(?:in|In|IN)|\p{Ll}In)(?:nen|NEN)?(?![\p{L}\p{M}])/u;

function same(left: string | undefined, right: string): boolean {
  return left !== undefined &&
    left.toLocaleLowerCase(locale) === right.toLocaleLowerCase(locale);
}

function mapPlural(base: string): string | undefined {
  return mapKnownPlural(base) ?? mapMappedPlural(base);
}

// `Kollegen`, `Ärzte`, `Senioren`: the lexicon plural of a shorter base.
// With `allowUnchanged`, also plurals equal to their base (`Teilnehmer`).
function isLexiconPlural(form: string, allowUnchanged = false): boolean {
  for (const cut of allowUnchanged ? [2, 1, 0] : [2, 1]) {
    const base = cut === 0 ? form : form.slice(0, -cut);
    if (base.length > 2 && same(mapPlural(base), form)) return true;
  }
  return false;
}

function isInflectedMasculine(form: string, ending: string): boolean {
  if (ending === "innen") {
    // A plural equal to its base (`Lehrer*innen`) stays with the plural
    // rules, which also add the dative `-n` (`mit Lehrern`).
    // Dativ Plural `Mitarbeitern`, `Ärzten`: Plural ohne -n plus -n.
    return isLexiconPlural(form) ||
      (form.endsWith("n") && !form.endsWith("nn") &&
        !/en$/u.test(form.slice(0, -1)) && isLexiconPlural(form.slice(0, -1), true));
  }
  // Singular: `Psychologe/in` (Nominativ auf -e) und `Assistenten/in`
  // (obliquer Kasus eines schwachen Nomens).
  if (form.endsWith("en")) {
    const base = form.slice(0, -2);
    return same(mapMappedSingular(base, "dative"), form) &&
      !same(mapMappedSingular(base, "nominative"), form);
  }
  return form.endsWith("e") &&
    same(mapMappedSingular(form.slice(0, -1), "nominative"), form);
}

// A marked word just before the noun (`Medizinische/r`, `zum/zur`,
// `engagierte/n`) must be a pair the pronoun rule resolves afterwards
// (`ein/e`, `des/der`); otherwise the phrase would stay half converted.
function hasUnresolvedPairBefore(input: string, offset: number): boolean {
  const phrase = /[^.,;!?()\n]*$/u.exec(input.slice(Math.max(0, offset - 64), offset))?.[0] ?? "";
  return phrase.split(/\s+/u).slice(-4).some(token =>
    /[:*_\/·•’‘]/u.test(token) && !isExplicitPairToken(token));
}

function transform(input: string, pattern: RegExp, wantedEnding: string): TransformResult {
  let replacements = 0;
  const text = input.replace(
    pattern,
    (match: string, form: string, ...rest: (string | number | undefined)[]) => {
      const offset = rest.at(-2) as number;
      const ending = rest.slice(0, -2)
        .find((value): value is string => typeof value === "string")
        ?.toLocaleLowerCase(locale);
      if (
        ending !== wantedEnding ||
        !isInflectedMasculine(form, ending) ||
        hasUnresolvedPairBefore(input, offset)
      ) {
        return match;
      }
      replacements += 1;
      return form;
    }
  );
  return {text, replacements};
}

function transformInflectedStemMarkers(input: string, wantedEnding: string): TransformResult {
  // Neutral text and the preposition `in` need neither scan.
  if (!candidatePattern.test(input)) return {text: input, replacements: 0};
  const separator = transform(input, separatorPattern, wantedEnding);
  const binnenI = transform(separator.text, binnenIPattern, wantedEnding);
  return {
    text: binnenI.text,
    replacements: separator.replacements + binnenI.replacements
  };
}

// Singular (`Psychologe/in`, `ein/e Kollege:in`) runs before the pair rule,
// which then resolves `ein/e`. Plural runs after the plural rules and only
// sees what they leave, so ordinary forms cost no extra lexicon lookups.
export const inflectedStemSingularRule: Rule = {
  id: "marker.inflected-stem-singular",
  risk: "safe",
  apply: (input) => transformInflectedStemMarkers(input, "in")
};

export const inflectedStemPluralRule: Rule = {
  id: "marker.inflected-stem-plural",
  risk: "safe",
  apply: (input) => transformInflectedStemMarkers(input, "innen")
};
