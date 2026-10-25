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
const clauseStartPattern = /[^.!?;:()]*$/u;
const prepositionSource = String.raw`in|im|an|am|auf|aus|bei|beim|mit|nach|seit|von|vom|zu|zum|zur|über|unter|vor|hinter|neben|zwischen|durch|für|gegen|ohne|um|während|wegen|trotz|laut|dank|innerhalb|außerhalb`;
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
  const clause = textBeforeVerb.slice(Math.max(0, textBeforeVerb.search(clauseStartPattern))).trim();
  // With its own subject before the verb, a following `der Schule` is a
  // genitive attribute (`Wir helfen Lehrer:innen der Schule`).
  if (pronounBeforeVerb.test(textBeforeVerb) || coordinatedSubjectBeforeVerb.test(textBeforeVerb) ||
    subjectBeforeVerb(clause)) return true;
  if (subjectOnlyVerb.test(verb) || otherObjectAhead.test(after)) return false;
  if (andBeforeVerb.test(textBeforeVerb)) return true;
  return clause !== "" && !invertedClauseStart.test(clause);
}

// A main clause with its verb already before the list and another finite
// verb right after it: the list starts a new clause as its subject (`Wir
// sehen den Wagen, Lehrer:innen und Schüler:innen kommen später`). With an
// auxiliary or modal before, the final verb is its infinitive (`Wir wollen mit
// Kindern, Lehrer:innen und Schüler:innen arbeiten`).
// Words on -t/-en/-e that are no finite verb.
const notFiniteVerb = String.raw`(?!(?:nicht|jetzt|zuletzt|oft|bereits|bereit|erst|meist|zumindest|selbst|gut|weit|seit|sonst|längst|zuerst|insgesamt|gemeinsam|stets|direkt|leicht|recht|sehr|zusammen|herzlichst?|dort|statt|samt|nebst|unten|oben|hinten|vorne|mitten|neben|zwischen|binnen|innen|außen|gegen|ohne|nach|unter|über|gestern|morgen|seiten|mit|bis|den|dem|der|die|das|des|ein|eine|einen|einem|einer|eines|keine|keinen|meine|seine|ihre|unsere|diese|diesen|jene|jede|jeden|alle|allen|viele|vielen|einige|einigen|wenige|wenigen|beide|beiden|weitere|weiteren|andere|anderen|eigene|eigenen|ganze|ganzen|heute|hier|gerne|gern|ebenfalls|also|ihnen|uns|euch|ihm|ihr)(?![\p{L}\p{M}]))`;
const mainClauseBeforeList = new RegExp(String.raw`(?:^|[.!?]\s+)(?:(?:Die|Der|Das|Den|Ein|Eine|Diese|Dieser|Unsere|Ihre|Seine|Meine|Alle|Viele|Einige|Beide)\s+(?:\p{Ll}[\p{L}\p{M}]*\s+){0,2}\p{Lu}[\p{L}\p{M}-]*|(?!(?:In|Im|Mit|Bei|Von|Vom|Aus|Nach|Seit|Zu|Zum|Zur|Auf|An|Am|Für|Über|Unter|Neben|Zwischen|Durch|Gegen|Ohne|Um|Vor|Hinter|Dank|Laut|Wegen|Trotz|Gemeinsam|Zusammen|Die|Der|Das|Den|Dem|Des|Ein|Eine|Einen|Einem|Einer|Eines|Diese|Dieser|Unsere|Ihre|Seine|Meine|Alle|Viele|Einige|Beide|Jede|Jeder|Keine)\s)\p{Lu}[\p{L}\p{M}-]*)\s+(?:(?:wir|ich|sie|er|es|man|ihr|du)\s+)?${notFiniteVerb}(?!\p{Ll}[\p{L}\p{M}]*(?:iv|isch|lich|ig|al|ell|ar|är|bar|sam|haft|los|ös)en?\s)\p{Ll}[\p{L}\p{M}]*(?:en|t|e)\s+[^.!?;:]*$`, "u");
// A relative or subordinate clause inside puts its verb last.
const subordinateInClause = /(?:,\s*(?:die|der|das|denen|deren|dessen|welche|welcher|wo)|(?:^|[\s,])(?:dass|weil|wenn|ob|als|damit|obwohl|um))\s/iu;
const auxiliaryInClause = /(?:^|\s)(?:will|willst|wollt|wollen|kann|kannst|könnt|können|muss|musst|müsst|müssen|soll|sollst|sollt|sollen|darf|darfst|dürft|dürfen|möchte|möchtest|möchtet|möchten|werde|wirst|wird|werdet|werden|wurde|wurden|würde|würden|habe|hast|hat|habt|haben|hatte|hatten|bin|bist|ist|seid|sind|war|warst|wart|waren|sollten|könnten|müssten)(?=\s)/u;
// A finite verb, not an adverb or function word, not an adjective before its
// noun (`neuen Raum`), not an infinitive before a modal (`diskutieren
// wollten`) or with `zu`.
const finiteVerbAfterList = new RegExp(String.raw`^\s+${notFiniteVerb}(?!\p{Ll}+zu\p{Ll}+en(?![\p{L}\p{M}]))(?:\p{Ll}[\p{L}\p{M}]{2,}(?:en|t)|sind|ist)(?![\p{L}\p{M}])(?!\s+(?:will|wollen|wollten|kann|können|konnten|muss|müssen|mussten|soll|sollen|sollten|darf|dürfen|durften|möchte|möchten|werden|wurden|wurde|wird|haben|hatten|hat|sind|waren|worden|lassen|zu)(?![\p{L}\p{M}]))(?!\s+\p{Lu})`, "u");

export function listStartsNewClause(before: string, after: string): boolean {
  const clause = mainClauseBeforeList.exec(before)?.[0];
  return clause !== undefined && !auxiliaryInClause.test(clause) && !subordinateInClause.test(clause) &&
    finiteVerbAfterList.test(after);
}

// `zwischen` and `neben` take the accusative with a verb of placing (`Wir
// stellen uns zwischen Lehrer:innen`, `… neben Schüler:innen zu setzen`).
const twoWayPreposition = /^(?:zwischen|neben)$/iu;
const placingVerb = String.raw`(?:stell|setz|leg|tret|tritt|trat|rück|dräng|schieb|schob|platzier|reih)\p{Ll}*`;
const placingVerbBefore = new RegExp(String.raw`(?:^|\s)${placingVerb}(?:\s+[^\s.!?;:,]+){0,3}\s*$`, "iu");
const placingVerbAfter = new RegExp(String.raw`^(?:\s+[^\s.!?;:,]+){0,4}?\s+(?:zu\s+)?(?:hin|hinein|dazu|zurück)?${placingVerb}(?![\p{L}\p{M}])`, "iu");
const clauseBeforePattern = /[^.!?;:,]*$/u;
// After a noun the preposition is its attribute (`Kooperation zwischen
// Landwirt:innen …`), always a dative.
const nounBeforePreposition = /(?:^|\s)\p{Lu}[\p{L}\p{M}-]*\s*$/u;
const sentenceStartBefore = /(?:^|[.!?]\s*)$/u;

export function directionalTwoWayPreposition(preposition: string, before: string, after: string): boolean {
  if (!twoWayPreposition.test(preposition)) return false;
  const clause = clauseBeforePattern.exec(before)?.[0] ?? before;
  if (nounBeforePreposition.test(clause) && !sentenceStartBefore.test(before.replace(/\S+\s*$/u, ""))) return false;
  return placingVerbBefore.test(clause) || placingVerbAfter.test(after.slice(0, 80));
}
