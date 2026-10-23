import type { Rule, TransformResult } from "../core/rule";
import { acceptContextResult } from "../core/leading-context-edit";
import { markedSingularLeadingCandidate } from "./context-candidates";
import { withPossessiveAgreement } from "./possessive-agreement";

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
// The words between noun and comma must not start a new conjunct: in
// `Händler:in und alle, die …` the clause belongs to `alle`.
const betweenWord = String.raw`\s+(?!(?:und|oder|sowie|bzw|alle|allen|andere|anderen|viele|vielen|weitere|weiteren|sonstige)(?![\p{L}\p{M}]))\p{Ll}[\p{L}\p{M}-]*`;
const relativeAhead = String.raw`(?:${betweenWord}){0,2},\s+(?:deren|die|der)\s`;
const markBefore = new RegExp(String.raw`(?<=\p{L}${markedEnding})(?=${relativeAhead})`, "gu");
const markedPronoun = new RegExp(String.raw`([^${mark}]{0,6})${mark}((?:${betweenWord}){0,2},\s+)(deren|die|der)(?:(\s+(?:oder|bzw\.|\/)\s+)(deren|dessen|die|der))?(\s+)([\p{L}\p{M}]*)`, "gu");
// `, die … zu übernehmen`: a noun phrase in an infinitive clause, not a
// relative pronoun (`verpflichtet sich, die … Kosten zu übernehmen`).
// No finite verb may come before the infinitive; a relative clause has one
// (`, die sowohl … tätig ist und zu …`).
const infinitiveClauseAhead =
  /^(?:(?!\s(?:ist|sind|war|hat|haben|hatte|wird|werden|kann|können|muss|müssen|soll|sollen|will|wollen|möchte|darf|\p{Ll}[\p{L}\p{M}]*(?:[^\s\P{L}s]t|te))(?=[\s,.;:!?]))[^,.;:!?])*?(?:\s+zu\s+\p{Ll}[\p{L}\p{M}]*en|\s+\p{Ll}+zu\p{Ll}+en)\s*(?:[,.;:!?]|$)/u;
// `Die Ausbildung zum/zur Krankenpflegehelfer/in, die wir anbieten`: after
// `zum`/`zur`/`als` the noun names a role; the clause belongs to the post.
// `die Rückfrage de*r Kolleg*in, die war gut`: a genitive attribute after a
// noun; the clause usually continues the head noun, not the person.
// Pair forms count too (`Entscheidung der*des Therapeut*in, die …`).
const genitiveAttributeBefore =
  /\p{Lu}\p{Ll}[\p{L}\p{M}-]*\s+(?:der|des|einer|eines|ihrer|ihres|seiner|seines|(?:de|der|des|ein|eine|einer|eines|ihre|ihrer|seine|seiner)[:*_·•\/][\p{L}\p{M}*:_·•\/-]*[rs])\s+(?:\p{Ll}[\p{L}\p{M}*:_·•]*\s+)?[\p{L}\p{M}’'*:_\/·•()-]+$/u;
const roleTitleBefore =/(?:^|\s)(?:zum|zur|als|zum\/zur|zur\/zum)\s+(?:\p{Ll}[\p{L}\p{M}*:_\/·-]*\s+)?[\p{L}\p{M}’'*:_\/·•()-]+$/iu;
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
    roleTitleBefore.test(input.slice(Math.max(0, offset - 80), offset)) ||
      genitiveAttributeBefore.test(input.slice(Math.max(0, offset - 80), offset)) ? "" : mark);
  if (marked === input) return transform(input);
  const result = transform(marked);
  let replacements = result.replacements;
  const text = result.text.replace(markedPronoun,
    (match: string, before: string, between: string, pronoun: string, pairSeparator: string | undefined,
      pairPronoun: string | undefined, space: string, next: string, offset: number, source: string) => {
      const unchanged = before + between + pronoun + (pairSeparator ?? "") + (pairPronoun ?? "") + space + next;
      if (stillMarked.test(before)) return unchanged;
      // `die oder der …`: the pair keeps its masculine member.
      if (pairPronoun) {
        const masculine = [pronoun, pairPronoun].find((word) => word === "der" || word === "dessen");
        if (!masculine) return unchanged;
        replacements += 1;
        return before + between + masculine + space + next;
      }
      if (pronoun !== "deren" && infinitiveClauseAhead.test(source.slice(offset + match.length - next.length - space.length))) {
        return unchanged;
      }
      const relative = masculineRelative(pronoun, next);
      if (!relative) return unchanged;
      replacements += 1;
      return before + between + relative + space + next;
    });
  return {text: text.replaceAll(mark, ""), replacements};
}

export function withRelativeAgreementRule(rule: Rule): Rule {
  const apply = rule.apply.bind(rule);
  return {...rule, apply: (input) => withPossessiveAgreement(input,
    (marked) => withRelativeAgreement(marked, apply))};
}

// A marked singular at the start of an inline element (`mit der
// <em>Patient*in</em>`): its article lives in the previous text node. The
// rule sees both; a result that changes the context is kept only when the
// caller accepts that context edit („mit dem Patienten“), otherwise it is
// dropped instead of half converting the phrase („mit der Patient“).
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
      if (!result.text.startsWith(leadingContext)) {
        const text = acceptContextResult(leadingContext, input, result.text);
        return text === undefined ? {text: input, replacements: 0} : {text, replacements: result.replacements};
      }
      return {text: result.text.slice(leadingContext.length), replacements: result.replacements};
    }
  };
}
