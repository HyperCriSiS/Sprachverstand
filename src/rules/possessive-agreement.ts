import type { TransformResult } from "../core/rule";

/*
 * A possessive after a converted generic `jede X*in` keeps the feminine
 * form: `dass jede Kund*in auch in ihrer Sprache` became „dass jeder Kunde
 * auch in ihrer Sprache“. Before the conversion an invisible mark is set
 * before each `ihr-` possessive that belongs to such a phrase in the same
 * clause; afterwards the possessive of a converted phrase takes the
 * masculine form and the mark is removed. Deliberately narrow:
 *   - only `jede`/`jeder`/`jede*r` with a marked singular noun,
 *   - before it in the clause only lowercase words (no other noun, no
 *     `sie`/`ihr` that could be the owner): `Die Firmen beraten jede Kund*in
 *     in ihren Filialen` stays,
 *   - between noun and possessive at most four lowercase words, and further
 *     possessives only as a list (`ihren Ort, ihre Rolle`).
 */
const mark = "";
const markedEnding = String.raw`(?:[:*_·•’‘]in|\/-?in|\(-?in\)|\p{Ll}In)`;
const generic = String.raw`(?<![\p{L}\p{M}])[Jj]ede(?:r|[:*_·•\/]-?r)?`;
const genericPhrase = new RegExp(String.raw`${generic}\s+(?:\p{Ll}[\p{L}\p{M}]*\s+)?\p{Lu}[\p{L}\p{M}-]*${markedEnding}(?![\p{L}\p{M}])`, "gu");
const ownerWord = /^(?:sie|ihr|ihnen|deren|dessen|und|oder|sowie|bzw)$/u;
const possessive = String.raw`ihr(?:e|en|em|er|es)?(?![\p{L}\p{M}:*_·•\/(])(?=\s+[„"‚‘]?\p{L})`;
const possessiveAfter = new RegExp(String.raw`^((?:\s+\p{Ll}[\p{L}\p{M}]*){0,4}\s+)(${possessive})`, "u");
const listedPossessive = new RegExp(String.raw`^(\s+[„"‚‘]?(?:\p{Ll}[\p{L}\p{M}]*\s+)?\p{Lu}[\p{L}\p{M}-]*[“"‘’]?,\s+)(${possessive})`, "u");
const convertedPhrase = new RegExp(String.raw`${generic}\s+(?:\p{Ll}[\p{L}\p{M}]*\s+)?(\S+)`, "gu");
const masculine = new Map([
  ["ihr", "sein"], ["ihre", "seine"], ["ihren", "seinen"],
  ["ihrem", "seinem"], ["ihrer", "seiner"], ["ihres", "seines"]
]);

// Another possible owner in this or the previous sentence keeps the
// possessive (`Die Schulleiterin heißt Anna. Jede Lehrer*in kennt ihre
// Telefonnummer`, `Maria bittet darum, dass jede Lehrer*in ihrer Tochter
// hilft`, `Die Eltern wünschen, dass …`, `Sie sagt …`).
const otherOwnerPronoun = /(?<![\p{L}\p{M}])(?:sie|Sie|ihr|ihre[nmrs]?|ihnen|Ihnen)(?![\p{L}\p{M}])/u;
const otherOwnerNoun =
  /(?<![\p{L}\p{M}])(?:\p{Lu}[\p{L}\p{M}-]*(?:erin|erinnen|innen|In|Innen|[:*_\/·•]in(?:nen)?)|Eltern|Kinder|Leute|Menschen|Frauen|Mütter|Töchter|Schwestern|Familien|Mädchen|Damen)(?![\p{L}\p{M}])/u;
const otherOwnerName =
  /(?:(?:^|[.!?:]\s+)\p{Lu}\p{Ll}+\s+(?:\p{Ll}+t|zufolge)|(?:heißt|namens|Frau|Herrn?)\s+\p{Lu}\p{Ll}+)(?![\p{L}\p{M}])/u;

function clauseAllowsGenericOwner(before: string): boolean {
  const clause = before.slice(Math.max(0, before.search(/[^,.!?;:]*$/u)));
  const sentenceStart = /(?:^|[.!?]\s*)$/u.test(before.slice(0, before.length - clause.length));
  const words = clause.trim().split(/\s+/u).filter(Boolean);
  if (!words.every((word, index) =>
    !ownerWord.test(word) && (/^\p{Ll}/u.test(word) || (index === 0 && sentenceStart)))) return false;
  const sentences = before.match(/[^.!?]*[.!?]+\s*[^.!?]*$/u)?.[0] ?? before;
  return !otherOwnerPronoun.test(sentences) && !otherOwnerNoun.test(sentences) && !otherOwnerName.test(sentences);
}

function lastConvertedOwner(before: string): boolean | undefined {
  let noun: string | undefined;
  for (const match of before.slice(-120).matchAll(convertedPhrase)) noun = match[1];
  if (noun === undefined) return undefined;
  return !/[:*_·•\/()’‘]|\p{Ll}In$/u.test(noun);
}

export function withPossessiveAgreement(
  input: string,
  transform: (input: string) => TransformResult
): TransformResult {
  if (!/[Jj]ede/u.test(input) || !/(?<![\p{L}\p{M}])ihr/u.test(input)) return transform(input);
  const positions: number[] = [];
  for (const match of input.matchAll(genericPhrase)) {
    if (!clauseAllowsGenericOwner(input.slice(0, match.index))) continue;
    let offset = match.index + match[0].length;
    const first = possessiveAfter.exec(input.slice(offset));
    if (!first || first[1]!.trim().split(/\s+/u).some((word) => ownerWord.test(word))) continue;
    offset += first[1]!.length;
    positions.push(offset);
    offset += first[2]!.length;
    for (let next = listedPossessive.exec(input.slice(offset)); next;
      next = listedPossessive.exec(input.slice(offset))) {
      offset += next[1]!.length;
      positions.push(offset);
      offset += next[2]!.length;
    }
  }
  if (positions.length === 0) return transform(input);
  let marked = input;
  for (const position of positions.reverse()) marked = marked.slice(0, position) + mark + marked.slice(position);
  const result = transform(marked);
  let replacements = result.replacements;
  const text = result.text.replace(new RegExp(String.raw`${mark}(${possessive})`, "gu"),
    (_match: string, word: string, offset: number, source: string) => {
      if (lastConvertedOwner(source.slice(0, offset)) !== true) return word;
      replacements += 1;
      return masculine.get(word) ?? word;
    });
  return {text: text.replaceAll(mark, ""), replacements};
}
