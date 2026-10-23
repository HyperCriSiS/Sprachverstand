// Verbs with a dative object (`Wir danken Lehrer:innen` → `Lehrern`). The
// project name `Jugend hilft` is no verb phrase. `folgen` is left out: `Es
// folgen Berichte` has the plural as its subject.
export const dativeVerbSource = String.raw`(?<!Jugend\s)(?:danken|dankt|gratulieren|gratuliert|helfen|hilft|vertrauen|vertraut|begegnen|begegnet|zuhören)`;
export const dativeVerbPattern = new RegExp(String.raw`^${dativeVerbSource}$`, "iu");
const singularVerb = /^(?:dankt|gratuliert|hilft|vertraut|begegnet)$/iu;

// After the plural, a dative object of its own makes the plural the subject
// (`Heute helfen Lehrer:innen den Kindern`, `begegnen Besucher*innen der
// Kunst`); a zu-infinitive makes it the infinitive's object (`Wir helfen
// Lehrer:innen auszubilden`).
const otherObjectAhead =
  /^\s+(?:(?:dem|den|der|einem|einer|meinem|meiner|deinem|deiner|seinem|seiner|ihrem|ihrer|unserem|unserer|eurem|eurer|diesem|dieser|jedem|jeder|ihm|ihr|ihnen|Ihnen|uns|euch|mir|dir)(?![\p{L}\p{M}])|(?:\p{Ll}[\p{L}\p{M}]*\s+)?zu\s+\p{Ll}|\p{Ll}+zu\p{Ll}+en(?![\p{L}\p{M}]))/u;

export function verbObjectBlocked(after: string): boolean {
  return otherObjectAhead.test(after);
}

// A dative right before the verb is its object already (`Wem helfen …`,
// `, denen helfen …`).
const dativeBeforeVerb = /(?:^|[\s,])(?:wem|denen|dem|ihm|ihr|ihnen|uns|euch|mir|dir)\s*$/iu;
const subjectBeforeVerb = /(?:^|\s)(?:wir|ihr|sie|und)\s*$/iu;
// A clause opened by an adverbial or a question word has the subject after
// the verb (`In der Schulbibliothek helfen Audible-Mitarbeiter*innen, …`,
// `Seit 2014 helfen Samariter:innen …`).
const invertedClauseStart =
  /^(?:\d|(?:in|im|an|am|auf|aus|bei|beim|mit|nach|seit|von|vom|zu|zum|zur|über|unter|vor|hinter|neben|zwischen|durch|für|gegen|ohne|um|während|wegen|trotz|laut|dank|innerhalb|außerhalb|heute|hier|dort|jetzt|dann|dabei|dazu|darum|deshalb|deswegen|daher|damit|gemeinsam|oft|häufig|meist|immer|auch|so|gerade|zudem|außerdem|zusätzlich|wer|wem|wen|was|wie|wo|wann|warum|wobei|womit)(?![\p{L}\p{M}]))/iu;

// Whether the verb ending `textBeforeVerb` governs the plural after it.
export function verbGovernsPlural(verb: string, textBeforeVerb: string, after: string): boolean {
  if (verbObjectBlocked(after)) return false;
  if (singularVerb.test(verb)) return true;
  if (dativeBeforeVerb.test(textBeforeVerb)) return false;
  if (subjectBeforeVerb.test(textBeforeVerb)) return true;
  const clause = textBeforeVerb.slice(Math.max(0, textBeforeVerb.search(/[^.!?;:()]*$/u))).trim();
  return clause !== "" && !invertedClauseStart.test(clause);
}
