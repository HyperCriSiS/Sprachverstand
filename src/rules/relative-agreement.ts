import type { Rule, TransformResult } from "../core/rule";
import { markedSingularLeadingCandidate } from "./context-candidates";

/*
 * A relative pronoun after a converted marked singular keeps the feminine
 * form: `von einer Künstler:in begleitet, deren Praxis` became „von einem
 * Künstler begleitet, deren Praxis“. Before the conversion an invisible mark
 * is set after each marked singular that a relative clause follows (at most
 * two words and a comma in between); afterwards the pronoun of a converted
 * noun takes the masculine form and the mark is removed. An unconverted noun
 * keeps its pronoun unchanged.
 *   deren → dessen
 *   der (dative) + subject pronoun → dem
 *   die + subject pronoun → den (accusative), + object pronoun, participle
 *       or adverb → der (nominative); otherwise unchanged (`die Fragen …`
 *       allows both readings).
 */
const mark = "";
const markedEnding = String.raw`(?:[:*_·•’‘]in|\/-?in|\(-?in\)|\p{Ll}In)`;
const relativeAhead = String.raw`(?:\s+\p{Ll}[\p{L}\p{M}-]*){0,2},\s+(?:deren|die|der)\s`;
const markBefore = new RegExp(String.raw`(?<=\p{L}${markedEnding})(?=${relativeAhead})`, "gu");
const markedPronoun = new RegExp(String.raw`([^${mark}]{0,6})${mark}((?:\s+\p{Ll}[\p{L}\p{M}-]*){0,2},\s+)(deren|die|der)(\s+)([\p{L}\p{M}]*)`, "gu");
// `Die Ausbildung zum/zur Krankenpflegehelfer/in, die wir anbieten`: after
// `zum`/`zur`/`als` the noun names a role; the clause belongs to the post.
const roleTitleBefore = /(?:^|\s)(?:zum|zur|als|zum\/zur|zur\/zum)\s+(?:\p{Ll}[\p{L}\p{M}*:_\/·-]*\s+)?[\p{L}\p{M}’'*:_\/·•()-]+$/iu;
const stillMarked = new RegExp(String.raw`${markedEnding}$`, "u");
// `es` is left out: in `die es sich leisten kann` the relative is the subject.
const subjectPronouns = new Set(["ich", "du", "er", "wir", "ihr", "man"]);
const objectPronouns = new Set(["mir", "dir", "ihm", "uns", "euch", "ihnen", "Ihnen", "sich", "mich", "dich"]);
const notNominativeStarts = new Set([
  "sie", "Sie", "der", "die", "das", "den", "dem", "des", "ein", "eine", "einen",
  "einem", "einer", "eines", "kein", "keine", "ihr", "ihre", "sein", "seine"
]);

function masculineRelative(pronoun: string, next: string): string | undefined {
  if (pronoun === "deren") return "dessen";
  if (pronoun === "der") return subjectPronouns.has(next) ? "dem" : undefined;
  if (subjectPronouns.has(next)) return "den";
  if (objectPronouns.has(next)) return "der";
  return /^\p{Ll}/u.test(next) && !notNominativeStarts.has(next) ? "der" : undefined;
}

export function withRelativeAgreement(
  input: string,
  transform: (input: string) => TransformResult
): TransformResult {
  if (!/,\s+(?:deren|die|der)\s/u.test(input)) return transform(input);
  const marked = input.replace(markBefore, (_empty: string, offset: number) =>
    roleTitleBefore.test(input.slice(Math.max(0, offset - 80), offset)) ? "" : mark);
  if (marked === input) return transform(input);
  const result = transform(marked);
  let replacements = result.replacements;
  const text = result.text.replace(markedPronoun,
    (match: string, before: string, between: string, pronoun: string, space: string, next: string) => {
      const relative = stillMarked.test(before) ? undefined : masculineRelative(pronoun, next);
      if (!relative) return before + between + pronoun + space + next;
      replacements += 1;
      return before + between + relative + space + next;
    });
  return {text: text.replaceAll(mark, ""), replacements};
}

export function withRelativeAgreementRule(rule: Rule): Rule {
  const apply = rule.apply.bind(rule);
  return {...rule, apply: (input) => withRelativeAgreement(input, apply)};
}

// A marked singular at the start of an inline element (`mit der
// <em>Patient*in</em>`): its article lives in the previous text node, which
// a rule cannot rewrite. The rule sees both; a result that would have to
// change the context is dropped instead of half converting the phrase
// („mit der Patient“).
export function withLeadingContextRule(rule: Rule): Rule {
  return {
    ...rule,
    leadingContextCandidate: markedSingularLeadingCandidate,
    leadingContextRequiresTrailingWhitespace: true,
    applyWithLeadingContext(input, leadingContext) {
      // Soft-hyphen segments (`Theater\u00adwissen\u00adschaftler*in`) continue a
      // word; only a separate preceding word can be the article.
      if (!/\s$/u.test(leadingContext)) return rule.apply(input);
      const result = rule.apply(leadingContext + input);
      if (!result.text.startsWith(leadingContext)) return {text: input, replacements: 0};
      return {text: result.text.slice(leadingContext.length), replacements: result.replacements};
    }
  };
}
