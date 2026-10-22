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
  ["die", "der"], ["eine", "ein"], ["jede", "jeder"], ["keine", "kein"], ["diese", "dieser"],
  ["meine", "mein"], ["deine", "dein"], ["seine", "sein"], ["ihre", "ihr"], ["unsere", "unser"], ["eure", "euer"]
]);
const accusative = new Map([
  ["die", "den"], ["eine", "einen"], ["jede", "jeden"], ["keine", "keinen"], ["diese", "diesen"],
  ["meine", "meinen"], ["deine", "deinen"], ["seine", "seinen"], ["ihre", "ihren"], ["unsere", "unseren"], ["eure", "euren"]
]);
const strongNominative = new Set(["ein", "kein", "mein", "dein", "sein", "ihr", "unser", "euer"]);
// Either capitalization of the first letter (sentence starts, headings).
function capitalizable(words: readonly string[]): string {
  return words.map((word) => `[${word[0]}${word[0]!.toLocaleUpperCase(locale)}]${word.slice(1)}`).join("|");
}
const determiner = `(?:${capitalizable(["die", "eine", "jede", "keine", "diese", "meine", "deine", "seine", "ihre", "unsere", "eure"])})`;
const attributes = String.raw`((?:\p{Ll}[\p{L}\p{M}]*e\s+){0,2})`;
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
  String.raw`(^|[.!?]\s+)(${determiner})(\s+)${attributes}${marked}${end}(?=\s+([\p{Ll}]+)(?:\s+([\p{L}]+))?)`,
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
const frontPrepositions = "In|Im|Am|An|Auf|Bei|Beim|Nach|Seit|Mit|Vor|Für|Während|Zum|Zur|Durch|Über|Unter|Neben|Aus|Vom|Von|Ab";
const frontAdverbs = "Dann|Danach|Anschließend|Zunächst|Zuerst|Heute|Hier|Dort|Nun|Jetzt|Zudem|Außerdem|Dabei|Hierbei|Daher|Deshalb|Oft|Meist|Meistens|Häufig|Manchmal|Gemeinsam|Später|Bald|Morgen|Gestern|Danach|Schließlich|Abschließend|Später|Davor|Damals|Inzwischen|Mittlerweile|Seitdem";
const verbSecondPattern = new RegExp(
  String.raw`((?:^|[.!?]\s+)(?:(?:${frontPrepositions})(?:\s+[\p{L}\p{M}\d-]+){1,4}?|${frontAdverbs})\s+(?:${singularVerbs})\s+)(${determiner})(\s+)${attributes}${marked}${end}`,
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
  const inflected = attributeText.replace(/\p{Ll}[\p{L}\p{M}]*e(?=\s)/gu, (word) =>
    grammaticalCase === "accusative" ? `${word}n` : strong ? `${word}r` : word);
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
  for (const pattern of [verbSecondPattern, relativePattern, imperativePattern]) {
    text = text.replace(pattern, (match: string, prefix: string, determinerWord: string, space: string,
      attributeText: string, base: string) => {
      const converted = phrase(determinerWord, space, attributeText, base, "nominative", mapNoun);
      if (!converted) return match;
      replacements += 1;
      return prefix + converted;
    });
  }
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
    const finalInfinitive = /^(?:\s+\p{Ll}[\p{L}\p{M}]*){0,3}?\s+(\p{Ll}[\p{L}\p{M}]*en)\s*(?:[.,;!?]|$)/u.exec(tail)?.[1];
    let grammaticalCase: "nominative" | "accusative" = "accusative";
    if (/^(?:\s+\p{Ll}[\p{L}\p{M}]*){0,2}?\s+(?:sind|ist|bin|bist|seid|sei|seien|waren|war|wären|wäre|werden|wird|wurden|wurde|bleiben|bleibt)(?:\s*[.,;!?]|\s*$)/u.test(tail) ||
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
      base: string, next: string, afterVerb: string | undefined) => {
      // `Ihre Stromanbieter:in können Sie … auswählen`: a subject pronoun after
      // the verb makes the fronted phrase the object.
      if (afterVerb && /^(?:ich|du|er|sie|es|wir|ihr|Sie|man)$/u.test(afterVerb)) return match;
      if (!finiteVerbsBeforeDer.has(next) && !/^(?:erhält|kommt|arbeitet|leitet|bietet|beginnt|unterrichtet|berät|begleitet|übernimmt|trägt|stellt|hilft|zeigt|spricht)$/u.test(next)) return match;
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
  return {text, replacements};
}
