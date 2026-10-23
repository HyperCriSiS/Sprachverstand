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
  ["welche", "welcher"], ["die", "der"], ["eine", "ein"], ["jede", "jeder"], ["keine", "kein"], ["diese", "dieser"],
  ["meine", "mein"], ["deine", "dein"], ["seine", "sein"], ["ihre", "ihr"], ["unsere", "unser"], ["eure", "euer"]
]);
const accusative = new Map([
  ["welche", "welchen"], ["die", "den"], ["eine", "einen"], ["jede", "jeden"], ["keine", "keinen"], ["diese", "diesen"],
  ["meine", "meinen"], ["deine", "deinen"], ["seine", "seinen"], ["ihre", "ihren"], ["unsere", "unseren"], ["eure", "euren"]
]);
const strongNominative = new Set(["ein", "kein", "mein", "dein", "sein", "ihr", "unser", "euer"]);
// Either capitalization of the first letter (sentence starts, headings).
function capitalizable(words: readonly string[]): string {
  return words.map((word) => `[${word[0]}${word[0]!.toLocaleUpperCase(locale)}]${word.slice(1)}`).join("|");
}
const determiner = `(?:${capitalizable(["welche", "die", "eine", "jede", "keine", "diese", "meine", "deine", "seine", "ihre", "unsere", "eure"])})`;
// Adjectives in any ending (normalized by `phrase`), and indeclinable place
// adjectives (`eine Leipziger Philosoph/-in`).
const notAdjectives = "die|eine|keine|jede|diese|meine|deine|seine|ihre|unsere|eure|welche|beide|beiden|alle|allen|viele|vielen|einige|einigen|mehrere|mehreren|wenige|wenigen|sämtliche|sämtlichen|aber|oder|immer|wieder|hier|weiter|sehr|mehr|daher|bisher|früher|später|seither|außer|unter|über|hinter|wer|der|er|ihr|mir|dir|wir|unser|euer|jeder|jener|dieser|welcher|keiner|einer|deren|dessen|denen|einen|einem|eines";
const notAdjectiveSet = new Set(notAdjectives.split("|"));
// Place adjectives only from a list; a capitalized word on -er is
// otherwise a noun (`die beiden Berufsbilder Notfallsanitäter*in`).
const placeAdjectives = [
  "Leipziger", "Berliner", "Wiener", "Schweizer", "Kölner", "Münchner", "Hamburger", "Frankfurter", "Bremer",
  "Dresdner", "Grazer", "Stuttgarter", "Düsseldorfer", "Nürnberger", "Zürcher", "Basler", "Berner", "Linzer",
  "Salzburger", "Innsbrucker", "Bonner", "Mainzer", "Potsdamer", "Rostocker", "Kieler", "Lübecker", "Erfurter",
  "Magdeburger", "Freiburger", "Heidelberger", "Mannheimer", "Karlsruher", "Augsburger", "Regensburger",
  "Würzburger", "Bamberger", "Bielefelder", "Dortmunder", "Essener", "Bochumer", "Duisburger", "Wuppertaler",
  "Aachener", "Göttinger", "Braunschweiger", "Oldenburger", "Osnabrücker", "Paderborner", "Ulmer", "Tübinger",
  "Konstanzer", "Luzerner", "Klagenfurter", "Bregenzer", "Kasseler", "Hallenser", "Jenaer", "Weimarer"
].join("|");
// Words between determiner and noun: adjectives and adverbs, also
// coordinated (`die erste und bisher einzige deutsche Künstler:in`), and
// abbreviations (`eine hauptamtl. Lehrer*in`, `die z. B. neue …`,
// `eine Dipl.-Psych. Lehrer*in`). Determiners and pronouns end the phrase.
// Only adjective endings are inflected (`phrase`).
const attributeStop = "beide|beiden|alle|allen|viele|vielen|einige|einigen|mehrere|mehreren|wenige|wenigen|sämtliche|sämtlichen|die|der|den|dem|des|das|ein|eine|einen|einem|einer|eines|kein|keine|jede|jeder|diese|dieser|meine|deine|seine|ihre|unsere|eure|welche|er|sie|es|ihr|ihm|ihn|mir|dir|wir|uns|euch|ich|du|man|sich|zu|zum|zur|im|am|vom|beim|an|auf|aus|bei|durch|für|gegen|in|mit|nach|ohne|über|um|unter|von|vor|zwischen|dass|ob|wenn|weil|als|wie";
const abbreviationToken = String.raw`(?:z\.\s*B\.|u\.\s*a\.|\p{Ll}{1,10}\.|\p{Lu}\p{Ll}{1,6}\.(?:-\p{Lu}\p{Ll}{1,6}\.)?)`;
const attributes = String.raw`((?:(?:(?!(?:${attributeStop})\s)\p{Ll}[\p{L}\p{M}]*|(?:${placeAdjectives})|${abbreviationToken})\s+){0,6})`;
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
  // Names may follow the title (`Die … Fotograf:in Zanele Muholi dokumentiert`).
  String.raw`(^|[.!?]\s+)(${determiner})(\s+)${attributes}${marked}${end}(?=(?:\s+\p{Lu}\p{Ll}+){0,3}\s+([\p{Ll}]+)(?:\s+([\p{L}]+))?)`,
  "gu"
);
const copulaPattern = new RegExp(
  // Only adverbs between copula and phrase; a preposition (`ist für die …`)
  // governs its own case.
  String.raw`((?<![\p{L}\p{M}])(?:${copulas})\s+(?:(?:auch|nun|jetzt|immer|noch|schon|bereits|ebenfalls|zudem|hier|dort|nicht|stets|wieder|weiterhin)\s+){0,2})(${determiner})(\s+)${attributes}${marked}${end}`,
  "gu"
);
// (e) heading run into the following text in one node (`Ihre Arbeitgeber:in
// Das Diakoniewerk …`): a capitalized determiner at the start and a new
// sentence right after the noun.
const headingPattern = new RegExp(
  String.raw`^(\s*)(${determiner})(\s+)${attributes}${marked}(?=\s+(?:Das|Der|Die|Ein|Eine|Wir|Ich|Sie|Unser|Unsere|Ihr|Ihre|Bei|Mit|Im|In|Am|Als|Seit|Hier)\s)`,
  "u"
);
// (f) subject right after a singular finite verb in second position, with a
// prepositional phrase or adverb in front (`In der Praxis findet die
// Ärzt*in …`, `Dann griff die Referent*in …`); a fronted noun phrase could be
// the subject itself and is left alone.
const singularVerbs = [
  "ist", "war", "wäre", "sei", "hat", "hatte", "hätte", "wird", "wurde", "würde", "kann", "konnte",
  "könnte", "muss", "musste", "müsste", "soll", "sollte", "darf", "durfte", "dürfte", "will", "wollte",
  "möchte", "mag", "bekommt", "bekam", "erhält", "erhielt", "braucht", "brauchte", "kennt", "kannte",
  "sieht", "sah", "findet", "fand", "macht", "machte", "geht", "ging", "kommt", "kam", "bleibt", "blieb",
  "steht", "stand", "weiß", "wusste", "sagt", "sagte", "schreibt", "schrieb", "liest", "las",
  "arbeitet", "arbeitete", "hilft", "half", "zeigt", "zeigte", "trägt", "trug", "übernimmt", "übernahm",
  "entscheidet", "entschied", "spricht", "sprach", "greift", "griff", "leitet", "leitete", "beginnt",
  "begann", "berät", "beriet", "erklärt", "erklärte", "erzählt", "erzählte", "berichtet", "berichtete",
  "präsentiert", "präsentierte", "führt", "führte", "stellt", "stellte", "bietet", "bot"
].join("|");
const frontPrepositions = "In|Im|Am|An|Auf|Bei|Beim|Nach|Seit|Mit|Vor|Für|Während|Zum|Zur|Durch|Über|Unter|Neben|Aus|Vom|Von|Ab|" +
  "Trotz|Wegen|Laut|Dank|Statt|Ohne|Gegen|Bis|Innerhalb|Außerhalb|Gemäß|Hinter|Zwischen|Um|Entlang|Anlässlich|Aufgrund|Infolge|Mithilfe|Seitens";
const frontAdverbs = "Dann|Danach|Anschließend|Zunächst|Zuerst|Heute|Hier|Dort|Nun|Jetzt|Zudem|Außerdem|Dabei|Hierbei|Daher|Deshalb|Oft|Meist|Meistens|Häufig|Manchmal|Gemeinsam|Später|Bald|Morgen|Gestern|Schließlich|Abschließend|Davor|Damals|Inzwischen|Mittlerweile|Seitdem|" +
  "Auch|Nahtlos|Gleichzeitig|Zugleich|Zusätzlich|Ebenso|Allerdings|Jedoch|Trotzdem|Dennoch|Natürlich|Leider|Gerne|Immer|Nie|Selten|Erst|Bereits|Schon|Noch|Nur|Insbesondere|Oftmals|Anfangs|Zuletzt|Erstmals|Künftig|Bisher|Bislang|Somit|Also|Ebenfalls|Weiterhin|Daraufhin|Hinterher|Vorher|Nachher|Plötzlich|Endlich|Wieder|Stets|Darüber hinaus|Vor allem|" +
  String.raw`\p{Lu}\p{Ll}+(?:weise|lich|mals|dings|falls|wärts|end)`;
// A plural or bare noun phrase in front cannot be the subject of a singular
// verb, or (without article) is the fronted object: `Diese Fragen griff die
// Referent*in auf`, `Knöcherne Abrisse fixiert die Handchirurg*in`.
const frontPlural = String.raw`(?:(?:Diese|Solche|Alle|Viele|Beide|Einige|Mehrere|Manche|Zahlreiche|Weitere|Andere|Die)\s+(?:\p{Ll}[\p{L}\p{M}]*\s+){0,2}\p{Lu}[\p{L}\p{M}-]*(?:en|ern|nen)|(?:Solche|Alle|Viele|Beide|Einige|Mehrere|Manche|Zahlreiche)\s+(?:\p{Ll}[\p{L}\p{M}]*\s+){0,2}\p{Lu}[\p{L}\p{M}-]*|(?!(?:Diese|Jene|Jede|Eine|Keine|Meine|Deine|Seine|Ihre|Unsere|Eure|Welche|Manche|Solche|Die|Alle)\s)\p{Lu}\p{Ll}+e\s+\p{Lu}[\p{L}\p{M}-]*e)`;
// Words ending in -t that are no finite verbs (`Dann direkt die Ärzt*in
// kontaktieren`).
const nonVerbs = "nicht|jetzt|oft|erst|meist|zuletzt|selbst|sonst|fast|stets|bereits|längst|zumindest|zuerst|zunächst|weit|gut|leicht|recht|schlecht|direkt|exakt|komplett|korrekt|perfekt|bekannt|bereit|echt|laut|statt|anstatt|samt|nebst|seit|derzeit|jederzeit|zurzeit|weltweit|bundesweit|konkret|explizit|strikt|bunt|halt|sanft|zart|geht's|heut|bewusst|gewusst|zumeist|größt|meistgelesen";
// A singular finite verb: listed, or a third-person form on -t/-te, also
// after ss/ß (`veranlasst`, `lässt`, `heißt`).
const finiteVerb = String.raw`(?:${singularVerbs}|(?!(?:${nonVerbs})(?![\p{L}\p{M}]))\p{Ll}[\p{L}\p{M}]{2,}(?:[^\s\P{L}s]t|(?:ss|ß)t|te))`;
// A relative pronoun after a comma (`Personen, die zwar nicht …`) is none.
const determinerLeftBefore = new RegExp(String.raw`(?:^|(?<![,;])\s)(?:${capitalizable([
  "die", "der", "den", "dem", "des", "eine", "einer", "einen", "einem", "eines", "ein", "ihre", "seine",
  "meine", "deine", "unsere", "eure", "jede", "keine", "diese", "welche"
])})\s+(?:\p{Ll}[\p{L}\p{M}]*\s+){0,2}$`, "u");
// A marked attribute or determiner among the last words (`Technische*r`,
// `zukünftige/r`, `Ihr:e`, `Studentische/-r OP`): its phrase is resolved
// as a whole by the attribute rules, never the noun alone.
const markedWordBefore = /\S*[:*_·•\/]\S*\s+(?:\S+\s+){0,3}$/u;
const singularVerbSet = new Set(singularVerbs.split("|"));
const finiteVerbPattern = new RegExp(String.raw`^${finiteVerb}$`, "u");
const verbSecondPattern = new RegExp(
  String.raw`((?:^|[.!?]\s+)(?:(?:${frontPrepositions})(?:\s+[\p{L}\p{M}\d/-]+){1,5}?|(?:${frontAdverbs})(?:\s+(?:zur|zum|zu|mit|bei|nach|von|aus|im|in|am|an|auf)(?:\s+[\p{L}\p{M}\d-]+){1,2})?|${frontPlural})\s+${finiteVerb}(?:\s+(?:und|oder)\s+${finiteVerb})?\s+(?:(?:je|jeweils)\s+)?)(${determiner})(\s+)${attributes}${marked}${end}`,
  "gu"
);
// A fronted subordinate clause or quotation, then the verb: `Während …,
// sagt eine Arbeiter*in`, `„…“, berichtet eine Näher*in`.
const clauseFrontPattern = new RegExp(
  String.raw`((?:(?:^|[.!?]\s+)(?:Wenn|Während|Als|Nachdem|Da|Weil|Obwohl|Sobald|Bevor|Falls|Seit|Seitdem|Sofern|Solange|Ob|Wo|Wie)\s[^.!?;:]*?,|[“”"»«]\s*,)\s*${finiteVerb}\s+)(${determiner})(\s+)${attributes}${marked}${end}`,
  "gu"
);
// (k) subordinate clause: the first phrase after the conjunction is the
// subject (`wenn eine Verkäufer:in … verweigert`, `weil eine Theaterleitung
// oder eine Regisseur:in …`); after another subject it is the object (`dass
// der Vertrag die Arbeitnehmer:in …`, `wenn es keine Vertreter*in …`).
const conjunctions = "wenn|dass|ob|weil|falls|sobald|bevor|nachdem|während|obwohl|sofern|solange|damit|indem|sodass|wie|seit|seitdem";
const subordinateSubjectPattern = new RegExp(
  String.raw`((?<![\p{L}\p{M}])(?:${conjunctions})\s+(?:(?:eine|ein|die|der|das)\s+(?:\p{Ll}[\p{L}\p{M}]*\s+)?\p{Lu}[\p{L}\p{M}-]*[\p{Ll}]\s+(?:oder|und|bzw\.)\s+)?)(${determiner})(\s+)${attributes}${marked}${end}`,
  "gu"
);
const subordinateObjectPattern = new RegExp(
  String.raw`((?<![\p{L}\p{M}])(?:${conjunctions})\s+(?:(?:der|das|ein|eine|die|unser|unsere)\s+(?:\p{Ll}[\p{L}\p{M}]*\s+)?\p{Lu}[\p{L}\p{M}-]*\p{Ll}|es|er|man|wir|ich|du|Sie)\s+(?:(?:auch|nun|jetzt|immer|noch|schon|nicht|nur|gern|gerne|oft|dann)\s+)?)(${determiner})(\s+)${attributes}${marked}${end}`,
  "gu"
);
const prepositionWords = "an|auf|aus|bei|durch|für|gegen|in|mit|nach|ohne|über|um|unter|von|vor|zu|zwischen|hinter|neben|als|wie|und|oder|dass|ob|wenn|weil";
// (l) after verb and subject (`verpflichtet das Gesetz die Investor*in`,
// `wählt eine Jury die Preisträger:in`, `sehe ich die Redner:in`): object.
const postverbalSubjectPattern = new RegExp(
  String.raw`((?<![\p{L}\p{M}])(?:${finiteVerb}\s+(?:(?:das|ein|eine|die|unser|unsere|ihr|sein|dieses)\s+(?:\p{Ll}[\p{L}\p{M}]*\s+)?\p{Lu}[\p{L}\p{M}-]*\p{Ll}|ich|wir|du|er|man|Sie|es)|(?!(?:${prepositionWords})\s)\p{Ll}[\p{L}\p{M}]+\s+(?:ich|wir|du))\s+(?:(?:auch|nun|jetzt|immer|noch|schon|nicht|nur|gern|gerne|oft|dann|bereits|erneut)\s+)?)(${determiner})(\s+)${attributes}${marked}${end}`,
  "gu"
);
// (m) a company or person seeking someone: `Schloss Moosham sucht zur
// Verstärkung des Teams eine … Schlossmitarbeiter*in`.
const searchPattern = new RegExp(
  String.raw`((?<![\p{L}\p{M}])\p{Lu}[\p{L}\p{M}-]+\s+(?:sucht|suchen|suchte|suchten)\s+(?:[^\s,.;:!?]+\s+){0,6}?)(${determiner})(\s+)${attributes}${marked}${end}(?!\s+nach)`,
  "gu"
);
// (t) a fronted phrase before a plural verb and its subject pronoun is the
// object (`Ihre Stromanbieter:in können Sie … auswählen`); a singular verb
// (`Ihre Ärzt*in kann Sie beraten`) leaves it the subject.
const frontedObjectPattern = new RegExp(
  String.raw`((?:^|[.!?]\s+))(${determiner})(\s+)${attributes}${marked}${end}(?=\s+(?:\p{Ll}[\p{L}\p{M}]*en\s+(?:Sie|wir|ihr)|\p{Ll}[\p{L}\p{M}]*\s+(?:ich|du|wir|man))(?![\p{L}\p{M}]))`,
  "gu"
);
// (u) `es gibt` takes the accusative: `gibt es eine Projektentwickler*in`.
const existentialPattern = new RegExp(
  String.raw`((?<![\p{L}\p{M}])(?:gibt\s+es|gab\s+es|[Ee]s\s+gibt|[Ee]s\s+gab)\s+(?:(?:auch|nun|jetzt|immer|noch|schon|bereits|hier|dort|nur|meist|oft)\s+){0,2})(${determiner})(\s+)${attributes}${marked}${end}`,
  "gu"
);
// (v) the subject of a coordinated main clause: `… und die Therapeut*in
// kann den Muskel dehnen`. Only listed singular verbs directly after it.
const coordinatedClausePattern = new RegExp(
  String.raw`((?<![\p{L}\p{M}])(?:und|aber|doch|denn|sondern)\s+)(${determiner})(\s+)${attributes}${marked}${end}(?=\s+(?:${singularVerbs})(?![\p{L}\p{M}]))`,
  "gu"
);
// (n) prepositions that govern the accusative before `die/eine/…`, which
// cannot be dative: `über die Schulsozialarbeiter*in`, `an die Anbieter:in`,
// `für eine weitere Stammzellspender:in`.
const accusativePrepositionPattern = new RegExp(
  String.raw`((?<![\p{L}\p{M}])(?:[Aa]n|[Aa]uf|[Üü]ber|[Uu]nter|[Vv]or|[Hh]inter|[Nn]eben|[Ii]n|[Ff]ür|[Dd]urch|[Gg]egen|[Oo]hne|[Uu]m|[Ww]ider)\s+)(${determiner})(\s+)${attributes}${marked}${end}`,
  "gu"
);
// (s) a title without determiner after a category noun or abbreviation
// (`die Berufe Altenpfleger*in, …`, `die Ebene Leiter*in`, `DOSB
// Übungsleiter:in`) or before a name (`rund um Choreograf*in Alvin
// Collantes`): nominative, the citation form.
const categoryNouns = String.raw`\p{Lu}[\p{L}\p{M}-]*(?:[Bb]eruf|[Bb]erufe|[Bb]ild|[Bb]ilder|[Aa]ngebot|[Aa]ngebote|[Ee]bene|[Kk]ategorie|[Bb]ereich|[Bb]ereiche|[Ll]izenz|[Tt]itel|[Rr]olle|[Ss]telle|[Pp]rofil|[Aa]bschluss|[Zz]ertifikat|[Mm]arke|[Bb]ezeichnung|[Ff]unktion|[Pp]osition)|\p{Lu}{2,}|Beruf|Berufe|Ebene|Kategorie|Marke|Rolle|Stelle`;
const bareTitlePattern = new RegExp(
  String.raw`((?<![\p{L}\p{M}])(?:${categoryNouns})\s+)(\p{Lu}[\p{L}\p{M}’'-]*?)(?:(?:\/-?|[:*_·•])in|\(-?in\))(?=[\s,.;:!?®()]|$)`,
  "gu"
);
// Only after a preposition (`rund um Choreograf*in Alvin Collantes`), and
// only before a first and last name, not before a new sentence or phrase.
const titleBeforeNamePattern = new RegExp(
  String.raw`((?<![\p{L}\p{M}])(?:um|mit|von|bei|für|durch|an|und)\s+)(\p{Lu}[\p{L}\p{M}’'-]*?)(?:(?:\/-?|[:*_·•])in|\(-?in\))(?=\s+(?!(?:Die|Der|Das|Den|Dem|Des|Ein|Eine|Ihr|Ihre|Dein|Deine|Sein|Seine|Unser|Unsere|Wir|Sie|Ich|Er)\s)\p{Lu}\p{Ll}+\s+\p{Lu}\p{Ll}+(?:[\s,.;:!?]|$))`,
  "gu"
);
// (o) object of an infinitive clause (`, erneut eine Kolleg*in … zu
// begrüßen`, `oder eine … Gastautor*in einzuladen`); with `zu werden/sein`
// predicative nominative (`eine gute Arbeitgeber*in zu werden`).
const infinitivePattern = new RegExp(
  String.raw`((?:,\s*(?:(?:erneut|auch|noch|nur|jetzt|nun|endlich|wieder|gezielt|bewusst|ebenfalls)\s+)?|(?<![\p{L}\p{M}])(?:oder|und|sowie)\s+))(${determiner})(\s+)${attributes}${marked}${end}(?=((?:\s+[\p{L}\p{M}\d-]+){0,5}?)\s+(zu\s+\p{Ll}[\p{L}\p{M}]*en|\p{Ll}+zu\p{Ll}+en)\s*[,.;!?])`,
  "gu"
);
const infinitiveBlockers = /(?:^|\s)(?:hat|hatte|haben|ist|war|sind|scheint|versucht|beginnt|hofft|braucht|vermag|pflegt|weiß|plant|vergisst|bittet|droht|verspricht|wagt|lernt|bemüht|weigert|lehnt|kann|muss|soll|darf|will)(?=\s|$)/u;
// (p) predicative after a copula with words between (`ist für die
// Nachbehandlung Ihr Kinderarzt Ihre Ansprechpartner:in`, `Ist die Natur
// die bessere Chemiker*in?`). Not after a preposition, and not with `wird`
// (future: `wird er die Ärzt*in anrufen`).
const wideCopulaPattern = new RegExp(
  String.raw`((?<![\p{L}\p{M}])(?:ist|sind|war|waren|bleibt|blieb|Ist|Sind|War|Waren)\s+(?:[^\s,.;:!?„“"]+\s+){1,6}?)(?<!(?<![\p{L}\p{M}])(?:an|auf|aus|bei|durch|für|gegen|in|mit|nach|ohne|über|um|unter|von|vor|zu|zwischen|hinter|neben)\s+)(${determiner})(\s+)${attributes}${marked}${end}`,
  "gu"
);
// (w) a phrase directly before a clause-final copula or a subjunctive finite
// verb is nominative: `…, der eine Ärzt*in ist.`, `Wir hoffen, eine Ärzt*in
// werde eingeladen.`, `…, eine Ärzt*in sollte …`.
const beforeFinalCopulaPattern = new RegExp(
  String.raw`((?<![\p{L}\p{M}:*_\/·•-])(?<!(?<![\p{L}\p{M}])(?:${prepositionWords}|zum|zur|vom|beim|im|am|ins)\s+))(${determiner})(\s+)${attributes}${marked}${end}(?=\s+(?:(?:ist|sind|war|waren|wird|wurde|bleibt|blieb)\s*[,.;:!?]|(?:werde|würde|sei|wäre|sollte|könnte|müsste|dürfte|möge)(?![\p{L}\p{M}])))`,
  "gu"
);
// (x) a sentence-start subject with a relative clause before its verb:
// `Die Künstler*in, die dort arbeitet, kommt.`
const subjectBeforeRelativePattern = new RegExp(
  // The relative-agreement rule may have set its private-use mark after the noun.
  String.raw`((?:^|[.!?]\s+))(${determiner})(\s+)${attributes}${marked}${end}(?=[-]?,\s+(?:die|der|deren)\s[^,.;:!?]{1,80},\s+${finiteVerb}(?![\p{L}\p{M}]))`,
  "gu"
);
// (y) a menu or button label: phrase plus infinitive (`Die Ärzt*in
// kontaktieren`), the accusative object.
const labelPattern = new RegExp(
  String.raw`^(\s*)(${determiner})(\s+)${attributes}${marked}(\s+\p{Ll}[\p{L}\p{M}]*en\s*[.!]?\s*)$`,
  "u"
);
// A known masculine person after the phrase can be the subject itself
// (`Heute besucht die Ärzt*in der Patient.`): no case from position then.
const competingSubjectAfter =
  /^(?:\s+\p{Ll}[\p{L}\p{M}]*)?\s+(?:der|ein)\s+(?:\p{Ll}[\p{L}\p{M}]*\s+)?(\p{Lu}[\p{L}\p{M}-]*)(?![\p{L}\p{M}*:_\/·•(])/u;
// A copula closing the clause makes the phrase predicative (`dass er die
// Ärzt*in ist`, `dass er eine Lehrer*in genannt wird`).
const finalCopulaAfter =
  /^(?:\s+[^\s,.;:!?]+){0,3}?\s+(?:ist|sind|war|waren|wird|werden|wurde|wurden|bleibt|bleiben|heißt|gilt|genannt\s+wird|genannt\s+werden)\s*(?:[,.;:!?]|$)/u;
// (q) a bare singular as predicate: `Diakon*in werden`, `Pirat*in zu
// werden`, `nicht Psychotherapeut*in im Sinne … sind`, `bleibt … Präsident*in`.
const notBeforeBareNoun = String.raw`(?<![:*_·•\/()-]\p{Ll}{0,3}\s+)(?<!(?<![\p{L}\p{M}])(?:die|der|den|dem|des|das|eine|einer|einen|einem|eines|ein|kein|keine|keiner|keinem|keinen|ihre|ihrer|ihrem|ihren|seine|seiner|seinem|seinen|meine|meiner|meinem|meinen|deine|deiner|deinem|deinen|unsere|unserer|unserem|unseren|eure|jede|jeder|jedem|jeden|diese|dieser|diesem|diesen|${prepositionWords}|zum|zur|vom|beim|im|am|ins)\s+)`;
const barePredicatePattern = new RegExp(
  String.raw`((?<![\p{L}\p{M}])(?:nicht|bleibt|bleiben|blieb|ist|sind|war|waren)\s+(?:[^\s,.;:!?]+\s+){0,5}?)${notBeforeBareNoun}(\p{Lu}[\p{L}\p{M}’'-]*?)(?:(?:\/-?|[:*_·•])in|\(-?in\))${end}`,
  "gu"
);
const bareBeforeCopulaPattern = new RegExp(
  String.raw`((?<=\s))${notBeforeBareNoun}(\p{Lu}[\p{L}\p{M}’'-]*?)(?:(?:\/-?|[:*_·•])in|\(-?in\))${end}(?=(?:\s+[^\s,.;:!?]+){0,6}?\s+(?:zu\s+)?(?:werden|sein|bleiben|ist|sind|war|wird|wurde|geworden)(?![\p{L}\p{M}]))`,
  "gu"
);
// (r) a phrase coordinated with an inflected one takes its case: `einer
// möglichen Zeug*in oder eines Verräters`. Not the dative: `bis zum
// Eintreffen der Notärzt*in oder dem Beginn …` coordinates on another level.
// Never the second half of a pair (`dem:der User:in und dem …`).
const coordinatedCasePattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}:*_\/·•-])(einer|der|die|eine)(\s+)((?:\p{Ll}[\p{L}\p{M}]*e[n]?\s+){0,2})(\p{Lu}[\p{L}\p{M}’'-]*?)(?:(?:\/-?|[:*_·•])in|\(-?in\))${end}(?=\s+(?:oder|und|bzw\.|sowie)\s+(eines|des|einen|den)\s)`,
  "gu"
);
// (g) subject after a relative pronoun governed by a preposition, or after
// an oblique one (`über den die Patient*in verfügen kann`, `, dem die
// Ärzt*in hilft`). `, die/der/das die …` stays: the pronoun may be the
// subject.
const relativePattern = new RegExp(
  String.raw`((?:,\s*|(?<![\p{L}\p{M}])(?:an|auf|aus|bei|durch|für|gegen|in|mit|nach|ohne|über|um|unter|von|vor|zu|zwischen)\s+)(?:den|dem|denen|dessen|deren)\s+|,\s*(?:an|auf|aus|bei|durch|für|gegen|in|mit|nach|ohne|über|um|unter|von|vor|zu|zwischen)\s+(?:der|die|das)\s+)(${determiner})(\s+)${attributes}${marked}${end}`,
  "gu"
);
// (h) imperative copula: `Werden Sie unsere Freund*in!`
const imperativePattern = new RegExp(
  String.raw`((?:^|[.!?]\s+)(?:Werden|Bleiben|Seien)\s+Sie\s+)(${determiner})(\s+)${attributes}${marked}(?=\s*(?:[!.]|$))`,
  "gu"
);
// (i) object after a clause-initial subject pronoun and any finite verb
// (`Werden Sie die Ärzt*in anrufen?`, `Sie unterstützt eine Künstler*in`,
// `Rufen Sie die Ärzt*in an`). `die/eine` cannot be dative, so with the
// subject taken it is the accusative object; a copula keeps the nominative.
const pronounObjectPattern = new RegExp(
  String.raw`((?:^|[.!?:]\s+)(?:(?:Sie|Ich|Wir|Du|Er|Man)\s+\p{Ll}[\p{L}\p{M}]*|\p{Lu}\p{Ll}[\p{L}\p{M}]*\s+(?:Sie|ich|wir|du|er|man))(?:\s+(?!(?:dass|ob|wenn|weil|als|wie|und|oder|aber|denn|sondern|bis|damit|obwohl|während|nachdem|bevor)\s)[\p{L}\p{M}\d.]+){0,4}?\s+)(${determiner})(\s+)${attributes}${marked}${end}`,
  "gu"
);
const nonObjectVerbs = /(?:^|\s)(?:sind|ist|bin|bist|seid|sei|seien|war|waren|wäre|wären|bleiben|bleibt|bleibe|blieb|wird|werde|wirst|werden|wurde|wurden|würde|würden)(?=\s)/iu;
// (j) a fronted subject (`Der Verein`, `Das Projekt`) and a verb whose object
// is typically a person: `Das Projekt unterstützt die Künstler*in`. Verbs
// where the person is usually the agent (`leitet`, `betreut`) stay open.
const personObjectVerbs = "unterstützt|unterstützte|fördert|förderte|sucht|suchte|begleitet|begleitete|berät|beriet|informiert|informierte|ehrt|ehrte|würdigt|würdigte|porträtiert|porträtierte|beschäftigt|beschäftigte|stärkt|stärkte|entlastet|entlastete|schützt|schützte|vermittelt|vermittelte|qualifiziert|qualifizierte|auszeichnet|zeichnet|zeichnete|benötigt|braucht|begrüßt|begrüßte|lädt|lud|stellt|stellte|ernennt|ernannte|wählt|wählte";
const frontedSubjectPattern = new RegExp(
  String.raw`((?:^|[.!?]\s+)(?:Das|Der|Ein|Dieses|Dieser|Jedes|Jeder|Unser|Mein|Dein|Euer|Sein)\s+(?:\p{Ll}[\p{L}\p{M}]*\s+){0,2}\p{Lu}[\p{L}\p{M}-]*\s+(?:${personObjectVerbs})\s+(?:(?:auch|nun|jetzt|seit|ab|zudem|gezielt|aktiv|künftig)\s+){0,2})(${determiner})(\s+)${attributes}${marked}${end}`,
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
  // Source endings vary (`eine möglicher Überträger*in`); the stem takes the
  // ending the masculine determiner requires.
  const inflected = attributeText.replace(/(?<![\p{L}\p{M}.])\p{Ll}[\p{L}\p{M}]*(?:e|er|en|es|em)(?=\s)/gu, (written) => {
    if (notAdjectiveSet.has(written)) return written;
    const word = written.replace(/(?:er|en|es|em)$/u, "e");
    return grammaticalCase === "accusative" ? `${word}n` : strong ? `${word}r` : word;
  });
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
  const heading = headingPattern.exec(text);
  if (heading && /^\p{Lu}/u.test(heading[2]!)) {
    const [whole, lead, determinerWord, space, attributeText, base] = heading;
    const converted = phrase(determinerWord!, space!, attributeText!, base!, "nominative", mapNoun);
    if (converted) {
      text = lead + converted + text.slice(whole.length);
      replacements += 1;
    }
  }
  const convert = (pattern: RegExp, caseOf: (prefix: string, tail: string) => "nominative" | "accusative" | undefined) => {
    text = text.replace(pattern, (match: string, prefix: string, determinerWord: string, space: string,
      attributeText: string, base: string, ...rest: unknown[]) => {
      const offset = rest.find((value) => typeof value === "number") as number;
      const source = rest[rest.indexOf(offset) + 1] as string;
      const grammaticalCase = caseOf(prefix, source.slice(offset + match.length, offset + match.length + 80));
      if (!grammaticalCase) return match;
      const converted = phrase(determinerWord, space, attributeText, base, grammaticalCase, mapNoun);
      if (!converted) return match;
      replacements += 1;
      return prefix + converted;
    });
  };
  // `zu werden/sein` after the phrase makes it predicative.
  const predicative = (tail: string) =>
    /^(?:\s+[^\s,.;:!?]+){0,5}?\s+(?:zu\s+)?(?:werden|sein|bleiben)(?![\p{L}\p{M}])/u.test(tail);
  const competingSubject = (tail: string) => {
    const name = competingSubjectAfter.exec(tail)?.[1];
    return name !== undefined && mapNoun(name, "nominative") === name;
  };
  const label = labelPattern.exec(text);
  if (label && /^\p{Lu}/u.test(label[2]!)) {
    const [, lead, determinerWord, space, attributeText, base, tail] = label;
    const converted = phrase(determinerWord!, space!, attributeText!, base!, "accusative", mapNoun);
    if (converted) return {text: lead + converted + tail, replacements: 1};
  }
  for (const pattern of [verbSecondPattern, clauseFrontPattern, relativePattern, imperativePattern,
    subordinateSubjectPattern, coordinatedClausePattern, beforeFinalCopulaPattern, subjectBeforeRelativePattern]) {
    convert(pattern, (_prefix, tail) => competingSubject(tail) ? undefined : "nominative");
  }
  for (const pattern of [frontedObjectPattern, existentialPattern]) {
    convert(pattern, () => "accusative");
  }
  convert(wideCopulaPattern, () => "nominative");
  for (const pattern of [subordinateObjectPattern, postverbalSubjectPattern, searchPattern]) {
    convert(pattern, (prefix, tail) => nonObjectVerbs.test(prefix) ? undefined
      : predicative(tail) || finalCopulaAfter.test(tail) ? "nominative" : "accusative");
  }
  convert(accusativePrepositionPattern, (prefix, tail) =>
    /^um\s/iu.test(prefix) && predicative(tail) ? "nominative" : /^bis\s/iu.test(prefix) ? undefined : "accusative");
  text = text.replace(infinitivePattern, (match: string, prefix: string, determinerWord: string, space: string,
    attributeText: string, base: string, between: string, infinitive: string) => {
    if (infinitiveBlockers.test(between)) return match;
    const grammaticalCase = /^zu\s+(?:werden|sein|bleiben)$/u.test(infinitive) ? "nominative" : "accusative";
    const converted = phrase(determinerWord, space, attributeText, base, grammaticalCase, mapNoun);
    if (!converted) return match;
    replacements += 1;
    return prefix + converted;
  });
  text = text.replace(coordinatedCasePattern, (match: string, determinerWord: string, space: string,
    attributeText: string, base: string, target: string) => {
    const grammaticalCase: GrammaticalCase = /^(?:eines|des)$/u.test(target) ? "genitive"
      : /^(?:einem|dem)$/u.test(target) ? "dative" : "accusative";
    const definite = /^d/u.test(determinerWord);
    const masculine = (definite ? "d" : "ein") + ({genitive: "es", dative: "em", accusative: "en"} as Record<string, string>)[grammaticalCase];
    const noun = mapNoun(base, grammaticalCase);
    if (!noun) return match;
    replacements += 1;
    const inflected = attributeText.replace(/(?<![\p{L}\p{M}])\p{Ll}[\p{L}\p{M}]*e(?=\s)/gu, (word) => `${word}n`);
    return masculine + space + inflected + noun;
  });
  text = text.replace(frontedSubjectPattern, (match: string, prefix: string, determinerWord: string, space: string,
    attributeText: string, base: string) => {
    const converted = phrase(determinerWord, space, attributeText, base, "accusative", mapNoun);
    if (!converted) return match;
    replacements += 1;
    return prefix + converted;
  });
  text = text.replace(pronounObjectPattern, (match: string, prefix: string, determinerWord: string, space: string,
    attributeText: string, base: string, offset: number, source: string) => {
    // The pronoun is the subject, so the phrase is the accusative object, or
    // a predicative nominative with a copula: `Sind Sie die Ärzt*in?`,
    // `Wenn Sie die Ärzt*in sind`, `Wollen Sie eine Ärzt*in werden?`. A
    // future auxiliary with a full infinitive takes the object again:
    // `Werden Sie die Ärzt*in anrufen?`.
    const tail = source.slice(offset + match.length, offset + match.length + 80);
    // Any words before the infinitive (`Sie wird die Ärzt*in am Montag anrufen.`).
    const finalInfinitive = /^(?:\s+[^\s,.;:!?]+){0,4}?\s+(\p{Ll}[\p{L}\p{M}]*en)\s*(?:[.,;!?]|$)/u.exec(tail)?.[1];
    let grammaticalCase: "nominative" | "accusative" = "accusative";
    if (/^(?:\s+[^\s,.;:!?]+){0,2}?\s+(?:sind|ist|bin|bist|seid|sei|seien|waren|war|wären|wäre|werden|wird|wurden|wurde|bleiben|bleibt)(?:\s*[.,;!?]|\s*$)/u.test(tail) ||
        (finalInfinitive !== undefined && /^(?:werden|sein|bleiben)$/u.test(finalInfinitive))) {
      grammaticalCase = "nominative";
    } else if (nonObjectVerbs.test(prefix)) {
      const futureWithObject = /(?:^|\s)(?:wird|werde|wirst|werden|würde|würden)\s/iu.test(prefix) &&
        finalInfinitive !== undefined;
      if (!futureWithObject) grammaticalCase = "nominative";
    }
    const converted = phrase(determinerWord, space, attributeText, base, grammaticalCase, mapNoun);
    if (!converted) return match;
    replacements += 1;
    return prefix + converted;
  });
  text = text.replace(sentenceStartPattern,
    (match: string, prefix: string, determinerWord: string, space: string, attributeText: string,
      base: string, next: string, afterVerb: string | undefined, offset: number, source: string) => {
      if (competingSubject(source.slice(offset + match.length, offset + match.length + 80).replace(/^\s+\S+/u, ""))) return match;
      // `Ihre Stromanbieter:in können Sie … auswählen`: a subject pronoun after
      // the verb makes the fronted phrase the object. After a singular verb
      // (`Ihre Ärzt*in kann Sie beraten`) `Sie` is the object instead.
      const singularBeforeSie = afterVerb === "Sie" && !/en$/u.test(next) &&
        (singularVerbSet.has(next) || finiteVerbPattern.test(next));
      if (afterVerb && /^(?:ich|du|er|sie|es|wir|ihr|Sie|man)$/u.test(afterVerb) && !singularBeforeSie) return match;
      if (!finiteVerbsBeforeDer.has(next) && !finiteVerbPattern.test(next)) return match;
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
  // Bare titles last: a determiner phrase above takes precedence (`Welche
  // Sexarbeiter*in wird …`).
  for (const pattern of [barePredicatePattern, bareBeforeCopulaPattern, bareTitlePattern, titleBeforeNamePattern]) {
    text = text.replace(pattern, (match: string, prefix: string | undefined, base: string, offset: number, source: string) => {
      // Never the noun alone after a determiner left in place.
      const before = source.slice(Math.max(0, offset - 60), offset) + (prefix ?? "");
      if (determinerLeftBefore.test(before) || markedWordBefore.test(before)) return match;
      const noun = mapNoun(base, "nominative");
      if (!noun) return match;
      replacements += 1;
      return (prefix ?? "") + noun;
    });
  }
  return {text, replacements};
}

// A marked phrase coordinated after a converted genitive takes the
// genitive too: `die Rolle eines Wählers der Grünen oder einer
// Politiker*in`, `eines Trainers mit Migrationsgeschichte und einer
// Trainer*in ohne`. `einer`/`der` cannot start a new nominative or
// accusative here. A doubled form (`eines Lehrers und einer Lehrer*in`)
// stays as written.
const coordinatedGenitivePattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}:*_\/·•-])((?:eines|des)\s+(?:\p{Ll}[\p{L}\p{M}]*en\s+){0,2}(\p{Lu}[\p{L}\p{M}’'-]*?)(?:es|s)((?:\s+(?:der|des)\s+\p{Lu}[\p{L}\p{M}-]*|\s+(?:mit|ohne|aus|von)\s+(?:\p{Ll}[\p{L}\p{M}]*\s+)?\p{Lu}[\p{L}\p{M}-]*)?))(\s+(?:und|oder|sowie|bzw\.)\s+)(einer|der)(\s+)((?:\p{Ll}[\p{L}\p{M}]*en?\s+){0,2})${marked}${end}`,
  "gu"
);

export function transformCoordinatedGenitives(
  input: string,
  mapNoun: (base: string, grammaticalCase: GrammaticalCase) => string | undefined
): TransformResult {
  if (!/(?:eines|des)\s/u.test(input)) return {text: input, replacements: 0};
  let replacements = 0;
  const text = input.replace(coordinatedGenitivePattern, (match: string, head: string, first: string,
    attribute: string, conjunction: string, determinerWord: string, space: string, attributeText: string,
    base: string) => {
    if (!attribute && first === base) return match;
    const noun = mapNoun(base, "genitive");
    if (!noun) return match;
    replacements += 1;
    const inflected = attributeText.replace(/(?<![\p{L}\p{M}])\p{Ll}[\p{L}\p{M}]*e(?=\s)/gu, (word) => `${word}n`);
    return head + conjunction + applyCase(determinerWord, determinerWord.toLowerCase() === "der" ? "des" : "eines") +
      space + inflected + noun;
  });
  return {text, replacements};
}
