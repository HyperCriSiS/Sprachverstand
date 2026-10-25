// Word classes and clause boundaries shared by the case rules. A rule that
// asks whether a word is a finite verb, where a sentence starts or whether a
// list opens a new clause asks here, so a correction reaches every rule.
//
// Regex literals with Unicode property escapes stay at module level: Pale
// Moon compiles such a literal again each time a function evaluates it.

// Number words counting a noun (`mit rund zehn Lehrern`).
export const numberWordSource = "zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|zwanzig|dreißig|vierzig|fünfzig|hundert|tausend";

// Prepositions opening a phrase of their own.
const prepositions = [
  "in", "im", "an", "am", "auf", "aus", "bei", "beim", "mit", "nach", "seit", "von", "vom", "zu", "zum", "zur",
  "über", "unter", "vor", "hinter", "neben", "zwischen", "durch", "für", "gegen", "ohne", "um", "ab", "bis",
  "während", "wegen", "trotz", "statt", "laut", "dank", "gemäß", "entlang", "innerhalb", "außerhalb",
  "anlässlich", "aufgrund", "infolge", "mithilfe", "seitens"
];
export const prepositionSource = prepositions.join("|");
// At the start of a sentence (`In der Praxis …`).
export const capitalizedPrepositionSource = prepositions
  .map((word) => word[0]!.toLocaleUpperCase("de-DE") + word.slice(1)).join("|");

// Finite modals and auxiliaries; with one in the clause its full verb stands
// at the end (`Wir wollen mit Kindern … arbeiten`).
export const finiteAuxiliarySource = "will|willst|wollt|wollen|kann|kannst|könnt|können|muss|musst|müsst|müssen|soll|sollst|sollt|sollen|darf|darfst|dürft|dürfen|möchte|möchtest|möchtet|möchten|werde|wirst|wird|werdet|werden|wurde|wurden|würde|würden|habe|hast|hat|habt|haben|hatte|hatten|bin|bist|ist|seid|sind|war|warst|wart|waren|sollten|könnten|müssten";
// Infinitives of modals and auxiliaries: verbs, never adjectives on -en.
export const auxiliaryInfinitives = ["haben", "können", "müssen", "sollen", "wollen", "dürfen", "werden", "möchten"];

// Subordinating conjunctions; the clause they open puts its verb last.
export const subordinatorSource = "wenn|dass|ob|weil|falls|sobald|bevor|nachdem|während|obwohl|sofern|solange|damit|indem|sodass|wie|seit|seitdem";

// An adjective may stand before the coordinated noun (`mit Kollegen aus
// Kantonen und erfahrenen Vertreter*innen`), but no finite verb (`mit den
// Kindern und besuchen Lehrer:innen`): only adjective endings or common
// short adjectives.
export const coordinatedAdjective = String.raw`(?:(?!(?:(?:be|er|dar|her|vor|ein|aus|zu|an|fest|ab)?stellen|(?:ver|mit|ein|auf|zu|aus)?teilen|entmenschlichen|ermöglichen|veröffentlichen|verdeutlichen|verwirklichen|beschäftigen|berücksichtigen|bestätigen|ermutigen|befähigen|beseitigen|bewältigen|benötigen|kündigen|würdigen|entschuldigen|vereinigen)(?![\p{L}\p{M}]))\p{Ll}[\p{L}\p{M}]*(?:ig|lich|isch|sch|al|ell|iv|ar|är|er|ern|ent|ant|ert|t|st|nd|haft|los|sam|bar|ös|en|eur|stark|il)en|\p{Ll}{3,}reichen|jungen|neuen|großen|kleinen|freien|guten|hohen|vielen|wenigen|einigen|beiden|langen|ganzen|fremden|lieben|wilden|starken|frühen|späten|tollen|schönen|kranken|gesunden|treuen|klugen|engen|strengen|jüngeren|älteren)`;

// Nothing but whitespace back to the start of the text or a sentence end.
export const sentenceStartBefore = /(?:^|[.!?]\s*)$/u;

// Words on -t/-te/-en/-e that are no finite verb (`Dann direkt die Ärzt*in
// kontaktieren`).
export const nonVerbWordSource = "nicht|jetzt|zuletzt|oft|bereits|bereit|erst|meist|zumindest|selbst|gut|weit|seit|sonst|längst|zuerst|insgesamt|gemeinsam|stets|direkt|leicht|recht|sehr|zusammen|herzlichst?|dort|statt|samt|nebst|unten|oben|hinten|vorne|mitten|neben|zwischen|binnen|innen|außen|gegen|ohne|nach|unter|über|gestern|morgen|seiten|mit|bis|den|dem|der|die|das|des|ein|eine|einen|einem|einer|eines|keine|keinen|meine|seine|ihre|unsere|diese|diesen|jene|jede|jeden|alle|allen|viele|vielen|einige|einigen|wenige|wenigen|beide|beiden|weitere|weiteren|andere|anderen|eigene|eigenen|ganze|ganzen|heute|hier|gerne|gern|ebenfalls|also|ihnen|uns|euch|ihm|ihr|fast|zunächst|schlecht|exakt|komplett|korrekt|perfekt|bekannt|echt|laut|anstatt|derzeit|jederzeit|zurzeit|weltweit|bundesweit|konkret|explizit|strikt|bunt|halt|sanft|zart|geht's|heut|bewusst|gewusst|zumeist|größt|meistgelesen|erneut|sofort|zuweilen|bisweilen|eben|gleichzeitig|zugleich|bislang|hinterher|vorher|nachher|jeweils|zuvor";
// Adverbs by their form (`stellenweise`, `mehrmals`, `europaweit`,
// `unbedingt`, `unentwegt`).
const adverbForm = String.raw`\p{Ll}*(?:weise|mals|wärts|seits|weit|zeit)|un(?!ter)\p{Ll}+t`;
export const notFiniteVerb = String.raw`(?!(?:${nonVerbWordSource}|${adverbForm})(?![\p{L}\p{M}]))`;

// A main clause with its verb already before the list and another finite
// verb right after it: the list starts a new clause as its subject (`Wir
// sehen den Wagen, Lehrer:innen und Schüler:innen kommen später`). With an
// auxiliary or modal before, the final verb is its infinitive (`Wir wollen mit
// Kindern, Lehrer:innen und Schüler:innen arbeiten`).
const mainClauseBeforeList = new RegExp(String.raw`(?:^|[.!?]\s+)(?:(?:Die|Der|Das|Den|Ein|Eine|Diese|Dieser|Unsere|Ihre|Seine|Meine|Alle|Viele|Einige|Beide)\s+(?:\p{Ll}[\p{L}\p{M}]*\s+){0,2}\p{Lu}[\p{L}\p{M}-]*|(?!(?:${capitalizedPrepositionSource}|Gemeinsam|Zusammen|Die|Der|Das|Den|Dem|Des|Ein|Eine|Einen|Einem|Einer|Eines|Diese|Dieser|Unsere|Ihre|Seine|Meine|Alle|Viele|Einige|Beide|Jede|Jeder|Keine)\s)\p{Lu}[\p{L}\p{M}-]*)\s+(?:(?:wir|ich|sie|er|es|man|ihr|du)\s+)?${notFiniteVerb}(?!\p{Ll}[\p{L}\p{M}]*(?:iv|isch|lich|ig|al|ell|ar|är|bar|sam|haft|los|ös)en?\s)\p{Ll}[\p{L}\p{M}]*(?:en|t|e)\s+[^.!?;:]*$`, "u");
// A relative or subordinate clause inside puts its verb last.
const subordinateInClause = new RegExp(String.raw`(?:,\s*(?:die|der|das|denen|deren|dessen|welche|welcher|wo)|(?:^|[\s,])(?:${subordinatorSource}|als|um))\s`, "iu");
const auxiliaryInClause = new RegExp(String.raw`(?:^|\s)(?:${finiteAuxiliarySource})(?=\s)`, "u");
// A finite verb, not an adverb or function word, not an adjective before its
// noun (`neuen Raum`), not an infinitive before a modal (`diskutieren
// wollten`) or with `zu`. A verb may have its object right after it (`geben
// Bücher ab`, `helfen Kindern`).
const finiteVerbAfterList = new RegExp(String.raw`^\s+${notFiniteVerb}(?!\p{Ll}+zu\p{Ll}+en(?![\p{L}\p{M}]))(?!${coordinatedAdjective}\s+\p{Lu})(?:\p{Ll}[\p{L}\p{M}]{2,}(?:en|t)|sind|ist)(?![\p{L}\p{M}])(?!\s+(?:will|wollen|wollten|kann|können|konnten|muss|müssen|mussten|soll|sollen|sollten|darf|dürfen|durften|möchte|möchten|werden|wurden|wurde|wird|haben|hatten|hat|sind|waren|worden|lassen|zu)(?![\p{L}\p{M}]))`, "u");

export function listStartsNewClause(before: string, after: string): boolean {
  const clause = mainClauseBeforeList.exec(before)?.[0];
  return clause !== undefined && !auxiliaryInClause.test(clause) && !subordinateInClause.test(clause) &&
    finiteVerbAfterList.test(after);
}
