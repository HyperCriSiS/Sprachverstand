import type { TransformResult } from "../core/rule";
import { sentenceStartBefore } from "./clause-structure";
import { mapKnownPlural } from "./known-plural-separators";
import { mapMappedPlural } from "./mapped-plural-separators";

// Regex literals with Unicode property escapes stay at module level: Pale
// Moon compiles such a literal again each time a function evaluates it.
const ihrCandidate = /(?<![\p{L}\p{M}])ihr/u;

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

// Another possible owner in this or the two previous sentences keeps the
// possessive (`Die Schulleiterin heißt Anna. Jede Lehrer*in kennt ihre
// Telefonnummer`, `Maria bittet darum, dass jede Lehrer*in ihrer Tochter
// hilft`, `Die Eltern wünschen, dass …`, `Sie sagt …`, `Die Tante wartet.`,
// `Anna kam gestern.`). `eigene` binds the possessive to the subject (`Die
// Lehrerin wartet. Jede Lehrer*in kennt ihre eigene Telefonnummer`).
const otherOwnerPronoun = /(?<![\p{L}\p{M}])(?:sie|Sie|ihr|ihre[nmrs]?|ihnen|Ihnen)(?![\p{L}\p{M}])/u;
const otherOwnerNoun =
  /(?<![\p{L}\p{M}])(?:\p{Lu}[\p{L}\p{M}-]*(?:innen|In|Innen|[:*_\/·•]in(?:nen)?)|\p{Lu}[\p{L}\p{M}-]*\p{Ll}in(?<!(?:Term|Mediz|Magaz|Benz|Berl|Kam|Vitam|Diszipl|Mart|Pingu|Rub|Delf|Cous|Bass|Kass|Ruß|Insul|Nikot|Glob|Lanol|Paraff|Vasel|Musl|Dent|Kreat|Kerat|Aspir|Lat|Sp|Rosmar|Kev|Marv|Just|Erw|Edw|Benjam|Calv|Alv|Quent|Florent|Valent|Konstant|August)in|ein|ain)|Eltern|Kinder|Leute|Menschen|Frauen|Mütter|Töchter|Schwestern|Familien|Mädchen|Damen|Frau|Mutter|Tochter|Schwester|Tante|Oma|Großmutter|Nichte|Cousine|Dame)(?![\p{L}\p{M}])/u;
// Common male first names and cities own no feminine `ihre` (`Peter wartet.`,
// `Berlin ist groß.`).
const maleNamesAndPlaces = [
  "Peter", "Martin", "Thomas", "Michael", "Andreas", "Stefan", "Stephan", "Christian", "Markus", "Marcus",
  "Frank", "Jürgen", "Klaus", "Hans", "Uwe", "Wolfgang", "Daniel", "Tobias", "Sebastian", "Florian",
  "Alexander", "Jan", "Jens", "Jörg", "Matthias", "Bernd", "Dieter", "Günter", "Werner", "Karl", "Paul",
  "Lukas", "Felix", "Max", "Jonas", "Leon", "Ben", "Tim", "Tom", "Simon", "David", "Johannes", "Philipp",
  "Moritz", "Niklas", "Julian", "Robert", "Ralf", "Rainer", "Holger", "Sven", "Dirk", "Oliver", "Torsten",
  "Thorsten", "Kai", "Mario", "Marco", "Erik", "Christoph", "Georg", "Heinz", "Horst", "Manfred", "Josef",
  "Kevin", "Marvin", "Dennis", "Patrick", "Fabian", "Jonathan", "Elias", "Noah", "Finn",
  "Paris", "London", "Rom", "Essen", "Bonn", "Mainz", "Kiel", "Ulm", "Trier", "Potsdam", "Erfurt",
  "Berlin", "Hamburg", "München", "Köln", "Frankfurt", "Stuttgart", "Wien", "Zürich", "Bern", "Leipzig",
  "Dresden", "Bremen", "Hannover", "Düsseldorf", "Graz", "Linz", "Basel", "Salzburg", "Nürnberg"
].join("|");
const notName = String.raw`(?!(?:Es|Er|Das|Dies|Dieses|Der|Die|Den|Dem|Ein|Eine|Hier|Heute|Jetzt|Nun|Man|Wir|Ich|Du|Dann|So|Da|Dort|Alles|Nichts|Auch|Aber|Doch|Noch|Immer|Oft|Bald|Morgen|Gestern|Danach|Damit|Dabei|Deshalb|Leider|Zudem|Jeder|Jede|Jedes|Wer|Was|Wie|Wo|Wann|Warum|Draußen|Drinnen|Niemand|Jemand|Keiner|Keine|Alle|Viele|Manche|Einige|Vielleicht|Trotzdem|Dennoch|Zuerst|Später|Inzwischen)\s|\p{Lu}\p{Ll}+(?:lich|weise|mals|ens)\s|(?:${maleNamesAndPlaces})\s)`;
// Frequent female first names without a feminine ending.
const femaleNames = [
  "Ingrid", "Judith", "Miriam", "Ruth", "Esther", "Edith", "Elisabeth", "Sarah", "Hannah", "Leah", "Rachel",
  "Karin", "Kerstin", "Katrin", "Jasmin", "Carolin", "Doris", "Iris", "Agnes", "Gudrun", "Sigrid", "Astrid",
  "Birgit", "Margit", "Gertrud", "Irmgard", "Waltraud", "Hildegard", "Ingeborg", "Mechthild", "Carmen",
  "Ellen", "Helen", "Karen", "Kristin", "Christin", "Evelyn", "Marion", "Liv", "Elif", "Zeynep", "Dolores",
  "Mercedes", "Isabel", "Annegret", "Rosemarie", "Brunhild", "Lilith"
].join("|");
// A name with a verb counts with a feminine ending (also `Edeltraud`,
// `Gerlind`), as a listed female name
// or as a unisex name (`Anna kam`, `Ingrid wartet`, `Kim wartet`); `Kevin`,
// `Justin` or `Paris` own no `ihre`.
const otherOwnerName = new RegExp(
  String.raw`(?:(?:^|[.!?:]\s+)${notName}(?:\p{Lu}\p{Ll}*(?:a|e|y|ette|elle|ine|ina|traud|trud|gard|hild|lind|run|rid|git|grit)|${femaleNames}|Kim|Robin|Alex|Chris|Charlie|Sam|Toni|Mika)\s+(?:\p{Ll}+te?|kam|war|ging|sah|rief|schrieb|blieb|lief|fuhr|las|saß|stand|fand|gab|nahm|sprach|zufolge)|(?:heißt|namens|Frau|Herrn?)\s+\p{Lu}\p{Ll}+)(?![\p{L}\p{M}])`, "u");
// A feminine or plural subject with its verb (`Die Schule ist neu.`,
// `Berliner Schulen sind bekannt.`).
// Plurals also bare or with an adjective (`Schulen sind geschlossen.`,
// `Unsere neuen Schulen sind bekannt.`).
const otherOwnerSubject = /(?:^|[.!?:]\s+)(?:(?:Die|Diese|Unsere|Ihre|Eine)\s+(?:\p{Ll}+e[nr]?\s+)?\p{Lu}\p{Ll}+\s+(?:\p{Ll}+t|ist|war|sind|waren)|(?:\p{Lu}\p{Ll}+(?:s|er)\s+)?\p{Lu}\p{Ll}+(?:en|n|e|er|s)\s+(?:sind|waren|haben|hatten))(?![\p{L}\p{M}])/u;
// A plural verb on -en with persons as subject (`Die männlichen Kollegen
// warten.`); things own no possessive here (`Die Pflanzen wachsen.`).
const pluralSubjectPattern =
  /(?:^|[.!?:]\s+)(?:Die|Diese|Unsere|Ihre|Alle|Viele)\s+(?:\p{Ll}+e[nr]?\s+)?(\p{Lu}\p{Ll}+)\s+\p{Ll}+en(?![\p{L}\p{M}])/gu;

function personPluralSubject(text: string): boolean {
  for (const match of text.matchAll(pluralSubjectPattern)) {
    const noun = match[1]!;
    if ([noun, noun.slice(0, -1), noun.slice(0, -2)].some((stem) =>
      (mapKnownPlural(stem) ?? mapMappedPlural(stem)) !== undefined)) return true;
  }
  return false;
}
const ownPossessiveAhead = /^\s*eigen(?:e|en|em|er|es)?(?![\p{L}\p{M}])/u;
const clauseStartPattern = /[^,.!?;:]*$/u;
const lowercaseWord = /^\p{Ll}/u;
const markedOwner = /[:*_·•\/()’‘]|\p{Ll}In$/u;

// The current sentence and the three before it. A loop instead of a
// pattern: nested repetition over long texts backtracks polynomially.
function recentSentences(before: string): string {
  let ends = 0;
  for (let index = before.length - 1; index >= 0; index--) {
    const char = before[index]!;
    if ((char === "." || char === "!" || char === "?") && !".!?".includes(before[index - 1] ?? "") && ++ends > 3) {
      return before.slice(index + 1);
    }
  }
  return before;
}

function clauseAllowsGenericOwner(before: string, ownPossessive: boolean): boolean {
  const clause = before.slice(Math.max(0, before.search(clauseStartPattern)));
  const sentenceStart = sentenceStartBefore.test(before.slice(0, before.length - clause.length));
  const words = clause.trim().split(/\s+/u).filter(Boolean);
  if (!words.every((word, index) =>
    !ownerWord.test(word) && (lowercaseWord.test(word) || (index === 0 && sentenceStart)))) return false;
  if (ownPossessive) return true;
  const sentences = recentSentences(before);
  return !otherOwnerPronoun.test(sentences) && !otherOwnerNoun.test(sentences) &&
    !otherOwnerName.test(sentences) && !otherOwnerSubject.test(sentences) && !personPluralSubject(sentences);
}

function lastConvertedOwner(before: string): boolean | undefined {
  let noun: string | undefined;
  for (const match of before.slice(-120).matchAll(convertedPhrase)) noun = match[1];
  if (noun === undefined) return undefined;
  return !markedOwner.test(noun);
}

export function withPossessiveAgreement(
  input: string,
  transform: (input: string) => TransformResult
): TransformResult {
  if (!/[Jj]ede/u.test(input) || !ihrCandidate.test(input)) return transform(input);
  const positions: number[] = [];
  for (const match of input.matchAll(genericPhrase)) {
    let offset = match.index + match[0].length;
    const first = possessiveAfter.exec(input.slice(offset));
    if (!first || first[1]!.trim().split(/\s+/u).some((word) => ownerWord.test(word))) continue;
    const ownPossessive = ownPossessiveAhead.test(input.slice(offset + first[0].length));
    if (!clauseAllowsGenericOwner(input.slice(0, match.index), ownPossessive)) continue;
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
