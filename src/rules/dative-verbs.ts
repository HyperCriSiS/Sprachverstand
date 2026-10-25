import { prepositionSource, sentenceStartBefore } from "./clause-structure";

// Verbs with a dative object (`Wir danken Lehrer:innen` → `Lehrern`). The
// project name `Jugend hilft` is no verb phrase. `folgen` governs the plural
// only after a subject of its own: `Es folgen Berichte` has the plural as its
// subject.
export const dativeVerbSource = String.raw`(?<!Jugend\s)(?:danken|dankt|gratulieren|gratuliert|helfen|hilft|vertrauen|vertraut|begegnen|begegnet|zuhören|folgen|folgt|erzählen|erzählt)`;
export const dativeVerbPattern = new RegExp(String.raw`^${dativeVerbSource}$`, "iu");
const singularVerb = /^(?:dankt|gratuliert|hilft|vertraut|begegnet|folgt)$/iu;
const subjectOnlyVerb = /^folg/iu;

// After the plural, a dative object of its own makes the plural the subject
// (`Heute helfen Lehrer:innen den Kindern`, `begegnen Besucher*innen der
// Kunst`).
const otherObjectAhead =
  /^\s+(?:dem|den|der|einem|einer|meinem|meiner|deinem|deiner|seinem|seiner|ihrem|ihrer|unserem|unserer|eurem|eurer|diesem|dieser|jedem|jeder|ihm|ihr|ihnen|Ihnen|uns|euch|mir|dir)(?![\p{L}\p{M}])/u;
// A zu-infinitive makes the plural the infinitive's object (`Wir helfen
// Lehrer:innen auszubilden`, `… gut auszubilden`).
const infinitiveAhead =
  /^\s+(?:(?:in|mit|ohne|zur|zum)\s+\p{Lu}[\p{L}\p{M}]*\s+|\p{Ll}[\p{L}\p{M}]*\s+){0,4}(?:zu\s+\p{Ll}|\p{Ll}+zu\p{Ll}+en(?![\p{L}\p{M}]))/u;

export function verbObjectBlocked(after: string): boolean {
  return infinitiveAhead.test(after) || otherObjectAhead.test(after);
}

// A dative right before the verb is its object already (`Wem helfen …`,
// `, denen helfen …`).
// After a preposition the pronoun belongs to it (`Einige von uns helfen …`).
const dativeBeforeVerb = /(?:^|[\s,])(?<!(?:von|mit|bei|zu|aus|nach|für|gegen|ohne|um|unter|neben)\s)(?:wem|denen|dem|ihm|ihr|ihnen|uns|euch|mir|dir)\s*$/iu;
const pronounBeforeVerb = /(?:^|\s)(?:(?:wir|ihr|sie)(?:\s+(?:alle|beide|gemeinsam|selbst))?|die\s+(?:einen|anderen|meisten))\s*$/iu;
// Coordinated subjects (`Peter und Anna folgen …`, `Eltern und Kinder helfen …`).
const coordinatedSubjectBeforeVerb = /(?:^|[.!?:;]\s+)\p{Lu}\p{Ll}+\s+und\s+\p{Lu}\p{Ll}+\s*$/u;
const andBeforeVerb = /(?:^|\s)und\s*$/iu;
// A sentence end is a dot, `!` or `?` before whitespace, not after an
// abbreviation or initial (`In St. Gallen`, `Auf www.example.com`).
const clauseBoundaryPattern =
  /(?<!(?:^|[\s(])(?:St|Dr|Prof|Nr|Str|ca|bzw|vgl|etc|usw|evtl|ggf|inkl|zzgl|Abs|Art|Bd|Mio|Mrd|z\.\s?B|u\.\s?a|\p{Lu}))[.!?](?=\s|$)|[;:()]/gu;

function clauseBefore(text: string): string {
  let start = 0;
  for (const match of text.matchAll(clauseBoundaryPattern)) start = match.index + match[0].length;
  return text.slice(start);
}
// A clause opened by an adverbial or a question word has the subject after
// the verb (`In der Schulbibliothek helfen Audible-Mitarbeiter*innen, …`,
// `Seit 2014 helfen Samariter:innen …`, `Vielleicht helfen Lehrer:innen …`).
// So does a clause opened by a dative or accusative (`Den Kindern helfen …`,
// `Jeden Tag helfen …`, `Kleinen Kindern helfen …`).
const invertedClauseStart = new RegExp(
  String.raw`^(?:\d|(?:${prepositionSource}|heute|gestern|morgen|selten|manchmal|meistens|mitunter|stets|nie|niemals|ständig|zuweilen|bisweilen|wieder|erneut|hier|dort|jetzt|nun|dann|danach|anschließend|später|zuerst|zunächst|bald|dabei|dazu|darum|deshalb|deswegen|daher|damit|dennoch|trotzdem|jedoch|allerdings|vielleicht|gemeinsam|oft|häufig|meist|immer|auch|so|gerade|zudem|außerdem|zusätzlich|ebenfalls|sogar|den|dem|jeden|jedem|diesen|diesem|einem|letzten|nächsten|wer|wem|wen|was|wie|wo|wann|warum|wobei|womit)(?![\p{L}\p{M}])|\p{L}+en\s+\p{Lu}[\p{L}\p{M}-]*n(?![\p{L}\p{M}])|\p{L}+(?:lich|weise|mals)(?![\p{L}\p{M}]))`,
  "iu"
);
const prepositionWord = new RegExp(String.raw`^(?:${prepositionSource})$`, "iu");
// A noun phrase right before the verb is its subject (`Auch die Eltern
// helfen …`, `In Berlin tätige Eltern helfen …`), unless a preposition
// opens it (`In der Schulbibliothek helfen …`).
const subjectDeterminer = /^(?:die|diese|alle|viele|einige|manche|meine|deine|seine|ihre|unsere|eure|keine|beide|mehrere|zwei|drei|vier|fünf|zehn|\d+)$/iu;
const focusParticle = /^(?:auch|nur|sogar|selbst|gerade|besonders|insbesondere|allem)$/iu;
const nounWord = /^\p{Lu}[\p{L}\p{M}-]*$/u;
const attributiveAdjective = /^\p{Ll}[\p{L}\p{M}-]*(?:e|en)$/u;
// At the clause start the adjective is capitalized (`Engagierte Eltern …`).
const clauseStartAdjective = /^\p{Lu}\p{Ll}+e$/u;
// Lowercase words and numbers may stand between a preposition and its noun
// (`Für fast alle Kinder`, `In mehr als drei Schulen`); a pronoun or a noun
// is the preposition's object (`Mit uns befreundete Eltern`, `In Berlin
// tätige Eltern`).
const prepositionObjectWord = /^(?:\p{Lu}|uns$|euch$|ihnen$|ihm$|ihr$|mir$|dir$|dem$|der$|den$)/u;

function prepositionOpens(words: string[], index: number): boolean {
  for (let i = index; i >= 0; i--) {
    if (prepositionWord.test(words[i]!)) return true;
    if (prepositionObjectWord.test(words[i]!)) return false;
  }
  return false;
}

function nounSubjectBeforeVerb(clause: string): boolean {
  const words = clause.split(/\s+/u).filter(Boolean);
  let index = words.length - 1;
  if (index < 0 || !nounWord.test(words[index]!)) return false;
  index--;
  let adjectives = 0;
  while (index >= 0 && !subjectDeterminer.test(words[index]!) &&
    (attributiveAdjective.test(words[index]!) || (index === 0 && clauseStartAdjective.test(words[index]!)))) {
    adjectives++;
    index--;
  }
  const determiner = index >= 0 && subjectDeterminer.test(words[index]!);
  if (determiner) index--;
  const previous = index >= 0 ? words[index]! : undefined;
  if (prepositionOpens(words, index)) return false;
  if (determiner) return true;
  // Without a determiner a weak `-en` belongs to a dative (`Kleinen
  // Kindern helfen …`); a bare noun needs a focus particle before it or
  // the clause start (`Eltern folgen …`, not `Es folgen …`).
  if (adjectives > 0) return words[index + 1]!.endsWith("e");
  if (previous === undefined) return !invertedClauseStart.test(clause) && !nonSubjectStart.test(clause);
  return focusParticle.test(previous);
}

// An attribute after the subject (`Die Eltern der Kinder folgen …`, `Die
// Eltern aus Berlin folgen …`, `Einige von uns helfen …`).
const trailingAttribute = /\s+(?:(?:der|des)\s+(?:\p{Ll}[\p{L}\p{M}]*\s+)?\p{Lu}[\p{L}\p{M}-]*|(?:aus|von|in|bei|mit)\s+[\p{L}\p{M}-]+)$/u;
const nonSubjectStart = /^(?:es|er|sie|das|dies|dieses|man|ich|du|wir|ihr)$/iu;

function subjectBeforeVerb(clause: string): boolean {
  if (nounSubjectBeforeVerb(clause)) return true;
  const stripped = clause.replace(trailingAttribute, "");
  return stripped !== clause && nounSubjectBeforeVerb(stripped);
}

// Whether the verb ending `textBeforeVerb` governs the plural after it.
export function verbGovernsPlural(verb: string, textBeforeVerb: string, after: string): boolean {
  if (infinitiveAhead.test(after)) return false;
  if (singularVerb.test(verb)) return true;
  if (dativeBeforeVerb.test(textBeforeVerb)) return false;
  const clause = clauseBefore(textBeforeVerb).trim();
  // With its own subject before the verb, a following `der Schule` is a
  // genitive attribute (`Wir helfen Lehrer:innen der Schule`).
  if (pronounBeforeVerb.test(textBeforeVerb) || coordinatedSubjectBeforeVerb.test(textBeforeVerb) ||
    subjectBeforeVerb(clause)) return true;
  if (subjectOnlyVerb.test(verb) || otherObjectAhead.test(after)) return false;
  if (andBeforeVerb.test(textBeforeVerb)) return true;
  return clause !== "" && !invertedClauseStart.test(clause);
}

// `zwischen` and `neben` take the accusative with a verb of placing (`Wir
// stellen uns zwischen Lehrer:innen`, `… neben Schüler:innen zu setzen`).
const twoWayPreposition = /^(?:zwischen|neben)$/iu;
// Only inflected verb forms: `stellenweise` is no verb.
const placingVerb = String.raw`(?:(?:stell|setz|leg|rück|dräng|schieb|platzier|reih)(?:e|st|t|en|et|te|test|ten|tet)?|tret(?:e|en|et)?|tritt|trittst|trat|traten|schob|schoben)(?![\p{L}\p{M}])`;
// `Wir legen los zwischen …` places nothing.
const placingVerbBefore = new RegExp(String.raw`(?:^|\s)${placingVerb}(?!\s+los(?![\p{L}\p{M}]))(?:\s+[^\s.!?;:,]+){0,3}\s*$`, "iu");
// The verb after the phrase belongs to it, not to a coordinated predicate
// (`Wir stehen zwischen Lehrer:innen und stellen Fragen`).
const placingVerbAfter = new RegExp(String.raw`^(?:\s+(?!(?:und|oder|sowie|aber)\s)[^\s.!?;:,]+){0,4}?\s+(?:zu\s+)?(?:hin|hinein|dazu|zurück)?${placingVerb}`, "iu");
// The object of the placing verb right before the preposition (`Wir stellen
// den Stuhl zwischen Lehrer:innen`).
const placedObjectBefore = new RegExp(String.raw`(?:^|\s)${placingVerb}\s+(?:den|das|die|einen|ein|eine|ihren|seinen|unseren|meinen|deinen|euren)\s+(?:\p{Ll}[\p{L}\p{M}]*\s+)?\p{Lu}[\p{L}\p{M}-]*\s*$`, "iu");
const clauseBeforePattern = /[^.!?;:,]*$/u;
// After a noun the preposition is its attribute (`Kooperation zwischen
// Landwirt:innen …`), always a dative.
const nounBeforePreposition = /(?:^|\s)\p{Lu}[\p{L}\p{M}-]*\s*$/u;

export function directionalTwoWayPreposition(preposition: string, before: string, after: string): boolean {
  if (!twoWayPreposition.test(preposition)) return false;
  const clause = clauseBeforePattern.exec(before)?.[0] ?? before;
  if (nounBeforePreposition.test(clause) && !sentenceStartBefore.test(before.replace(/\S+\s*$/u, ""))) {
    return placedObjectBefore.test(clause);
  }
  return placingVerbBefore.test(clause) || placingVerbAfter.test(after.slice(0, 80));
}
