import type { Rule, TransformResult } from "../core/rule";
import { mapKnownPlural } from "./known-plural-separators";
import { mapMappedPlural } from "./mapped-plural-separators";
import { mapSingular } from "./singular-context";
import { isDisabledLoanword } from "./loanword-person-forms";
import { dativeVerbPattern, dativeVerbSource, directionalTwoWayPreposition, verbGovernsPlural } from "./dative-verbs";
import { auxiliaryInfinitives, coordinatedAdjective, listStartsNewClause } from "./clause-structure";

/*
 * Drei Ausgangsfehler, die sonst halb, falsch oder gar nicht umgewandelt wurden:
 * - Zeilentrennung im Marker: `Schüler*in-nen` wurde zu „Schüler-nen“.
 * - Bindestrich vor dem Schrägstrich: `Schüler-/innen` blieb unverändert.
 * - Doppelter Marker: `Praktikant*in*in` wurde zu „Praktikant*in“,
 *   `Kolleg*in*innen` zu „Kollege*innen“.
 * Repariert wird nur bei lexikalisch bekanntem Stamm; die eigentliche
 * Umwandlung (Kasus, Dativ, Schutz) übernehmen danach die üblichen Regeln.
 * Keine allgemeine Rechtschreibkorrektur.
 */
const hyphenatedPattern =
  /(?<![\p{L}\p{M}])([\p{L}\p{M}’'-]*?\p{L})([:*_·•]|\/-?)in-nen(?![\p{L}\p{M}])/gu;
// Hyphen before the slash marker: `Schüler-/innen`, `Fachinformatiker-/in`.
const hyphenSlashPattern =
  /(?<![\p{L}\p{M}])([\p{L}\p{M}’'-]*?\p{L})-(\/-?)(innen|in)(?![\p{L}\p{M}])/gu;
const doubledPattern =
  /(?<![\p{L}\p{M}])([\p{L}\p{M}’'-]*?\p{L})([:*_·•])in\2(in|innen)(?![\p{L}\p{M}])/gu;

// Marker inside the first half of a hyphenated adjective:
// `Medizinisch:e-Technische:r` is `Medizinisch-Technische:r`; the first
// half never inflects. Only when both halves use the same marker.
const innerAdjectivePattern =
  /(?<![\p{L}\p{M}])(\p{L}[\p{L}\p{M}]*?(?:isch|lich|ig|al|iv))([:*_·•])e-(\p{L}[\p{L}\p{M}]*e)\2(?=[rn](?![\p{L}\p{M}]))/gu;

function isKnownStem(stem: string): boolean {
  return (mapKnownPlural(stem) ?? mapMappedPlural(stem)) !== undefined;
}

// The inflected masculine form before the marker: `zum/r Assistenten/in`,
// `Medizinpädagoge/-in`, `Rechtssekretäre/innen`, `Patienten*innen`. It is
// written back to the stem form (`Assistent/in`, `Rechtssekretär/innen`)
// only when the lexicon's masculine plural of that stem is exactly the
// written form (or its dative -n), so the regular rules decide the case.
const inflectedMarkerPattern =
  /(?<![\p{L}\p{M}_])(\p{Lu}[\p{L}\p{M}’'-]*?\p{Ll})([:*_·•]|\/-?)(innen|in)(?![\p{L}\p{M}_])/gu;
// No `i` flag (it would make `\p{Ll}` caseless); determiners may start a
// sentence (`Als Medizinische/r …`).
const determinerContextBefore = new RegExp(String.raw`(?:^|\s)(?:(?:${[
  "als", "zum", "zur", "vom", "beim", "im", "am", "dem", "den", "des", "einem", "einen", "eines", "ein",
  "der", "die", "eine", "einer", "jede[mnrs]?", "meine?[mnrs]?", "deine?[mnrs]?", "seine?[mnrs]?",
  "ihre?[mnrs]?", "unsere?[mnrs]?"
].map((word) => `[${word[0]}${word[0]!.toUpperCase()}]${word.slice(1)}`).join("|")})(?:\s*[\/*:_·]\s*-?\p{L}*)?|[Vv]on der|[Bb]ei der|[Zz]u der)\s+(?:(?:\p{Ll}[\p{L}\p{M}*:_\/·-]*|\p{Lu}[\p{L}\p{M}-]*?(?:e|en|es|em|er)(?:[*:_\/·]-?\p{Ll}{0,2})?)\s+){0,2}$`, "u");
// A singular needs a determiner or preposition before it (up to two
// attributes); without one its case is open (`Fotografen*in/Videografen*in`).
const singularContextBefore =
  /(?:^|\s)(?:\S*[\/*:_·]\S*|zum|zur|vom|beim|im|am|als|dem|den|des|einem|einen|eines|ein|der|die|eine|einer|mit|von|bei|zu|für)\s+(?:[\p{L}\p{M}*:_\/·-]+\s+){0,2}$/iu;

function stemForInflected(word: string): {stem: string; compound: boolean} | undefined {
  const lower = word.toLocaleLowerCase("de-DE");
  for (const cut of [2, 1]) {
    const stem = word.slice(0, -cut);
    if (stem.length < 3) continue;
    const plural = (mapMappedPlural(stem) ?? mapKnownPlural(stem))?.toLocaleLowerCase("de-DE");
    if (plural && plural !== stem.toLocaleLowerCase("de-DE") &&
        (plural === lower || `${plural}n` === lower)) return {stem, compound: false};
  }
  // A compound the plural lexicon does not list, written as its masculine
  // nominative (`Medizinpädagoge/-in` from `Medizinpädagog`).
  const stem = word.slice(0, -1);
  if (stem.length >= 3 && word.endsWith("e") &&
      mapSingular(stem, "nominative")?.toLocaleLowerCase("de-DE") === lower) return {stem, compound: true};
  return undefined;
}

function repairInflectedMarkers(input: string): TransformResult {
  let replacements = 0;
  const text = input.replace(inflectedMarkerPattern,
    (match: string, word: string, separator: string, ending: string, offset: number, source: string) => {
      if (isKnownStem(word)) return match;
      // Slash series (`Fotografen*in/Videografen*in`): both or none.
      if (source[offset + match.length] === "/" || source[offset - 1] === "/") return match;
      // A job title with `(m/w/d)` after it is singular, too.
      const jobTitle = /^\s*\((?:[mwdfxi]\s*\/\s*){1,3}[mwdfxi]\)/iu.test(source.slice(offset + match.length));
      if (ending === "in" && !singularContextBefore.test(source.slice(Math.max(0, offset - 80), offset)) &&
          !jobTitle) return match;
      const found = stemForInflected(word);
      if (!found) return match;
      const {stem} = found;
      const determinerBefore = determinerContextBefore.test(source.slice(Math.max(0, offset - 80), offset));
      // The compound fallback only where nothing else resolves the phrase:
      // after a determiner or as a job title; a marked attribute before it
      // (`anerkannte/-r Heilpädagoge/-in`) is resolved by the attribute rules.
      if (found.compound && !(ending === "in" && (determinerBefore || jobTitle))) return match;
      replacements += 1;
      // A determiner (pair) before a singular: the stem form lets the singular
      // rules convert the whole phrase (`zum/r … Assistent/in` → „zum …
      // Assistenten“). Otherwise the author's inflected masculine part stays
      // and only the marker goes (`Ärzten/innen` keeps its dative,
      // `anerkannte/n Heilpädagogen/in`).
      if (ending === "in" && determinerBefore) {
        return stem + separator + ending;
      }
      return word;
    });
  return {text, replacements};
}

/*
 * Marked forms the person rules never see as words:
 * - a compound after the marker (`Jugendleiter*in-Card`, `Täter*in-Opfer-
 *   Umkehr`, `Steinmetz*in- bzw. …`): the masculine first part with its
 *   linking form (`Kollegen-`, `Patienten-`);
 * - a word after `«…»-` or a suspended hyphen (`«…»-Leseanimator:in`,
 *   `Komponisten und -InterpretInnen`);
 * - plurals on -er without lexicon entry (`Widerstandkämpfer:innen`,
 *   `Ü60-Frankfurter*innen`, dative `-n` after a dative context);
 * - abbreviations (`StB*innen`, `MdB*innen`).
 */
const compoundMarkerPattern =
  /(?<![\p{L}\p{M}’'_])(\p{Lu}[\p{L}\p{M}’']*?\p{Ll})(?:[:*_·•]|\/-?)in-(?=[\p{Lu}\d]|\s+(?:bzw\.|und|oder|sowie)\s)/gu;
const weakLinking = /(?:ent|ant|ist|at|graf|graph|nom|soph|log|ot)$/u;

function compoundFirstPart(base: string): string | undefined {
  const nominative = mapSingular(base, "nominative");
  if (!nominative) return undefined;
  if (nominative.endsWith("e")) return `${nominative}n`;
  const accusative = mapSingular(base, "accusative");
  return accusative === `${nominative}en` && weakLinking.test(nominative) ? accusative : nominative;
}

const quotedPrefixPattern =
  /([»“"]-|(?<=\s)-)(\p{Lu}[\p{L}\p{M}’']*?\p{Ll})(?:(?:[:*_·•]|\/-?)(in|innen)|(Innen))(?![\p{L}\p{M}])/gu;
// Not after a soft hyphen inside a word, not before a compound hyphen.
const plainErPluralPattern =
  /(?<![\p{L}\p{M}’'_­])([\p{L}\p{M}\d’'-]*\p{L}er)(n?)(?:(?:[:*_·•]|\/-?)innen|Innen)(?![\p{L}\p{M}-])/gu;
// -ier has the plural -iere (`Passagier`, `Pionier`); adjectives and
// participles used as nouns end in -e/-en (`Sachverständige`).
const notPlainEr = /(?:ier|(?:ig|lich|isch|end|bar|sam|haft|los|iert|ordnet|stellt|setzt|tragt|wandt|kannt|amt)er)$/u;
const dativeTrigger = String.raw`[Vv]on|[Mm]it|[Bb]ei|[Nn]eben|[Zz]wischen|[Aa]us|[Zz]u|[Nn]ach|[Ss]eit|[Gg]egenüber|[Ss]amt|[Nn]ebst|den|allen|einigen|vielen|wenigen|mehreren|beiden|unseren|ihren|${dativeVerbSource}`;
// A name part (`RosaLila`), not a heading run into the next sentence
// (`PraxisbezugDie Besucher`) or a Binnen-I plural (`SchülerInnen`).
const namePart = String.raw`\p{Lu}\p{Ll}+(?!(?:Die|Der|Das|Den|Dem|Des|Ein|Eine|Wir|Sie|Er|Es|Ich|Und|Im|In|Am|Mit|Bei|Für|Von|Zum|Zur)(?!\p{Ll}))\p{Lu}[\p{L}\p{M}]*(?<!Innen)`;
// Directly after the trigger, only adjectives, numbers or name parts
// between (`von 8 InteGREATer:innen`, `den RosaLila PantherInnen`); a
// preposition or verb on -en ends the phrase (`von SchülerInnen gegen`).
const gapAdjective = String.raw`(?!(?:gegen|nehmen|laden|einladen|bitten|suchen|treffen|brauchen|${auxiliaryInfinitives.join("|")}|geben|kommen|stehen)(?![\p{L}\p{M}]))\p{Ll}[\p{L}\p{M}]*en`;
const dativeGap = String.raw`(?:(?:${gapAdjective}|\d+|${namePart})\s+){0,2}`;
const pluralDativeBefore = new RegExp(String.raw`(?:^|\s)(${dativeTrigger})\s+${dativeGap}$`, "u");
const dativeTriggerNear = new RegExp(String.raw`(?:^|\s)(?:${dativeTrigger})\s`, "u");
const coordinatedEnding = new RegExp(String.raw`(?:,|\s(?:und|oder|sowie))\s+(?:\d+\s+)?(?:${coordinatedAdjective}\s+){0,2}$`, "u");
const nameOrNumberGap = new RegExp(String.raw`(?:^|\s)(?:${dativeTrigger})\s+(?:\S+\s+)*?(?:\d+|${namePart})(?:\s+\p{Ll}[\p{L}\p{M}]*en){0,2}\s+$`, "u");
// `bis zu 20` only bounds a number; the case comes from before it
// (`mit bis zu 20 Lehrern`, `für bis zu 20 Teilnehmer`).
// Regex literals with Unicode property escapes stay at module level: Pale
// Moon compiles such a literal again each time a function evaluates it.
const upperBoundPattern = /(?<![\p{L}\p{M}])[Bb]is\s+zu(?=\s+\d)/gu;
const lowercaseStartPattern = /^\p{Ll}/u;
const uppercaseLetterPattern = /\p{Lu}/gu;
const unlistedFormCandidate = /(?:[:*_·•]|\/-?)in-|[»“"]-\p{Lu}|\s-\p{Lu}|er(?:n?)(?:[:*_·•]|\/-?)innen|erInnen|\p{Lu}(?:[:*_·•]|\/-?)innen|[Dd](?:en|er)\s*\/\s*die\s|\p{Ll}(?:in\/en|en\/in)(?![\p{L}\p{M}])/u;
const inflectedMarkerCandidate = /\p{Ll}(?:[:*_·•]|\/-?)in/u;
const brokenMarkerCandidate = /in-nen|[:*_·•]in[:*_·•]in|\p{L}-\//u;

function withoutUpperBound(before: string): string {
  return before.replace(upperBoundPattern, "");
}
// A dative plural coordinated before it: `von Antifaschisten und …`. The
// first conjunct must name persons: in `Überlebende von Genoziden und
// Zeichner:innen` or `Rechtsanwält*innen aus Bremen und …` the
// prepositional phrase is an attribute and the plural coordinates with its
// head. A relative `den` (`, den Bauernfamilien und …`) is no trigger.
// Conjuncts may still be marked (`mit 12 Hundeführer:innen und 17 …`), carry
// a genitive or dative attribute (`12 Vertreter*innen der Gewerkschaften und
// 12 …`) and form a comma list (`aus 38 Bäcker:innen, Konditor:innen, …`).
const conjunct = String.raw`\p{Lu}[\p{L}\p{M}’'-]*?(?:n|(?:[:*_·•]|\/-?)innen|Innen)`;
const conjunctAttribute = String.raw`(?:\s+(?:der|des|aus|von|bei|mit|nach|zu)\s+(?:\p{Ll}[\p{L}\p{M}]*en\s+)?\p{Lu}[\p{L}\p{M}-]*)?`;
const conjunctSeparator = String.raw`(?:,\s*|\s+(?:und|oder|sowie)\s+)(?:\d+\s+)?`;
const coordinatedDativeBefore = new RegExp(
  String.raw`(?:^|(,\s*)|(\S+)\s+|\s)(${dativeTrigger})\s+${dativeGap}(${conjunct})${conjunctAttribute}(?:${conjunctSeparator}${dativeGap}${conjunct}${conjunctAttribute})*(,|\s+(?:und|oder|sowie))\s+(?:\d+\s+)?(?:${coordinatedAdjective}\s+){0,2}$`, "u");
// A comma only continues the list when an `und` item follows.
const listContinues = /^(?:\s*,\s*[^\s,]+)*\s+(?:und|oder|sowie)\s/u;
// The text after the remaining list items.
const remainingListItems = /^(?:\s*(?:,|\s(?:und|oder|sowie))\s*\p{Lu}[\p{L}\p{M}*:_·•\/’'-]*)*/u;

function listRest(after: string): string {
  return after.replace(remainingListItems, "");
}
// A plural right before the preposition may own it as an attribute; when the
// prepositional object names no persons, the coordinated noun belongs to
// that plural: `Überlebende von Genoziden und Zeichner:innen`,
// `Rechtsanwält*innen aus Bremen und …`, `Fans von Weitwanderungen und …`.
// `Rückmeldungen von Lehrpersonen und Schüler:innen` stays dative.
const pluralBeforePreposition = /^\p{Lu}[\p{L}\p{M}*:_\/·•’'-]*(?:e|en|er|innen|Innen|s)$/u;
// Person nouns without a gendered form (`von Opfern und Täter:innen`).
const personNounsWithoutMarker =
  /(?:[Oo]pfer|[Mm]enschen|[Kk]inder|[Ee]ltern|[Ll]eute|[Pp]ersonen|[Mm]itglieder|[Gg]äste|[Kk]räfte|[Hh]ebammen|[Ff]rauen|[Mm]änner|[Mm]ädchen|[Ff]amilien|[Pp]aare|[Jj]ugendliche|[Ää]rzte|[Tt]eams|[Hh]äftlinge|[Ff]ans|[Ff]lüchtlinge|[Aa]zubis)n?$/u;

// Substantivized participles and adjectives for persons; a plain -ende(n)
// ending is no evidence (`Energiewende`, `Dutzenden`).
const personParticiples =
  /(?:[Üü]berlebende|[Ss]tudierende|[Ll]ehrende|[Ff]orschende|[Rr]eisende|[Ss]uchende|[Tt]eilnehmende|[Mm]itarbeitende|[Mm]itwirkende|[Aa]uszubildende|[Bb]eschäftigte|[Aa]ngestellte|[Bb]eteiligte|[Bb]etroffene|[Gg]eflüchtete|[Vv]orgesetzte|[Aa]bgeordnete|[Ee]hrenamtliche|[Jj]ugendliche|[Aa]ngehörige|[Ss]chaffende|[Ii]nteressierte|[Ee]rwachsene|[Vv]erstorbene|[Ee]rkrankte|[Ee]ngagierte|[Gg]efangene|[Rr]echtsextreme|[Nn]ominierte|[Pp]reisgekrönte|[Ee]ingeladene|[Ii]nhaftierte|[Ss]üchtige|[Uu]nbeteiligte|[Vv]ertriebene|[Bb]edienstete|[Pp]flegende|[Bb]eratende|[Ll]ernende)n?$/u;

// Plurals of things the stem rules below would read as persons
// (`Krankenhäusern`, `Bundesländern`, `Geräten`).
const nonPersonPlurals =
  /(?:[Hh]äus|[Ll]änd|[Bb]üch|[Dd]örf|[Ww]äld|[Gg]läs|[Rr]äd|[Bb]ild|[Ff]eld|[Ll]ied|[Kk]leid|[Ää]mt|[Gg]üt|[Vv]ölk|[Hh]ölz|[Bb]änd|[Ss]child|[Nn]est|[Gg]erät|[Gg]räb)(?:er|e)?n?$/u;

export function namesPersons(plural: string): boolean {
  const head = plural.replace(/^.*-/u, "");
  if (/(?:innen|Innen)$/u.test(head) || personNounsWithoutMarker.test(head) || personParticiples.test(head)) return true;
  if (nonPersonPlurals.test(head)) return false;
  // Stems by the plural endings only (`Lehrern` → `Lehrer`, `Kollegen` →
  // `Kolleg`/`Kollege`, `Ärzte` → `Ärzt`); a blind cut finds bogus stems.
  const stems = new Set<string>();
  if (head.endsWith("en")) stems.add(head.slice(0, -2)).add(head.slice(0, -1));
  else if (head.endsWith("n")) stems.add(head.slice(0, -1));
  if (head.endsWith("e")) stems.add(head.slice(0, -1));
  if (head.endsWith("er")) stems.add(head);
  return [...stems].some((stem) =>
    stem.length >= 3 && (isKnownStem(stem) || mapSingular(stem, "nominative") !== undefined));
}
// Years are no counts (`seit 2014 Nutzer:innen`).
const yearGap = /(?:^|\s)(?:1[89]|20)\d\d\s+(?:\S+\s+)?$/u;

// The rest of the clause after the noun ends in a verb: a relative clause
// (`, den Bauernfamilien und Arbeiter*innen in Projekte investieren`).
const relativeClauseTail = /^[^,.;:!?]*\s\p{Ll}[\p{L}\p{M}]*(?:en|t)\s*[,.;:!?]/u;
const genitiveAttributePattern =
  /(\p{Lu}[\p{L}\p{M}’'-]*)\s+(?:der|des)\s+(?:\p{Ll}[\p{L}\p{M}]*en\s+)?(\p{Lu}[\p{L}\p{M}*:_·•\/’'-]*)/gu;
const nominativeItemAhead = /^\s*,\s*\p{Lu}[\p{L}\p{M}-]*\p{Ll}e(?=\s*,|\s+(?:und|oder|sowie)\s)/u;
const listEnding = /(?:,|\s+(?:und|oder|sowie))\s+(?:\d+\s+)?$/u;
const listSeparator = /,|\s(?:und|oder|sowie)\s/u;
const dativeBeforeParenthesis = new RegExp(String.raw`(?:^|\s)(?:${dativeTrigger})\s+(?:\S+\s+){0,2}\S+\s*$`, "u");
const verbWithPronounAhead = /^\s+\p{Ll}[\p{L}\p{M}]*en\s+(?:sich|wir|sie|uns|euch|es|man)(?![\p{L}\p{M}])/u;

function isCoordinatedDative(before: string, after: string): boolean {
  const match = coordinatedDativeBefore.exec(before);
  if (!match) return false;
  const [, comma, previous, trigger, noun, ending] = match;
  if (directionalTwoWayPreposition(trigger!, before.slice(0, match.index + match[0].indexOf(trigger!)), after)) return false;
  if (dativeVerbPattern.test(trigger!) &&
      !verbGovernsPlural(trigger!, before.slice(0, before.lastIndexOf(trigger!)), after)) return false;
  if (ending === "," && !listContinues.test(after)) return false;
  if (listStartsNewClause(before.slice(0, match.index + match[0].indexOf(trigger!) + (dativeVerbPattern.test(trigger!) ? trigger!.length + 1 : 0)), listRest(after))) return false;
  const list = match[0].slice(match[0].indexOf(trigger!) + trigger!.length);
  // A year after the trigger is no count (`Seit 2015 nehmen Läufer:innen und …`).
  if (/^\s*(?:1[89]|20)\d\d(?!\d)/u.test(list)) return false;
  // `den Mann` is an accusative singular, no dative plural.
  if (trigger === "den" && !/(?:en|rn|ln|innen|Innen)$/u.test(noun!)) return false;  // A genitive attribute naming persons on a conjunct without persons takes
  // the following items (`den Werken der SchriftstellerInnen und
  // Künstler*innen`, `Heimatsammlungen der Flüchtlinge, Vertriebenen und …`).
  for (const [, head, attribute] of list.matchAll(genitiveAttributePattern)) {
    if (!namesPersons(head!) && namesPersons(attribute!)) return false;
  }
  // A nominative item after it ends the dative (`aus allen Bereichen des
  // zivilen Lebens, Akademiker:innen, Offiziere, …`).
  if (nominativeItemAhead.test(after)) return false;
  // A parenthesis takes the case from before it: `durch Autor*innen und, bei
  // Daten, Erheber*innen` stays, `mit Lehrern und, bei Bedarf, Schüler:innen`
  // keeps the dative.
  if (/^(?:und|oder|sowie),$/u.test(previous ?? "") && ending === "," && !listSeparator.test(list.replace(listEnding, ""))) {
    return dativeBeforeParenthesis.test(before.slice(0, match.index + match[0].indexOf(previous!)));
  }
  // A new clause with its own verb (`werden Teile von faschistischen
  // Netzwerken, Journalist*innen oder Schriftsteller*innen verbinden sich`).
  if (previous && pluralBeforePreposition.test(previous) && !namesPersons(noun!) &&
      list.slice(list.indexOf(noun!) + noun!.length).trimStart().startsWith(",") &&
      verbWithPronounAhead.test(after)) return false;
  // An enumeration of article items (`den Katholik*innen, den orthodoxen
  // Mitgliedern und …`, `aus dem Vorstand, den gewählten KA-Vertretern sowie
  // …`) is no relative clause.
  const enumeration = /(?:^|\s)(?:den|dem|der)\s+[^,]{1,60},\s*den\s+[^,]*$/u.test(before);
  if ((comma || previous?.endsWith(",")) && trigger === "den" && !enumeration && relativeClauseTail.test(after)) return false;
  if (!(previous && pluralBeforePreposition.test(previous) && namesPersons(previous) && !namesPersons(noun!))) return true;
  // The plural before the preposition is itself a dative object (`mit
  // Kollegen aus Kantonen und …`): either reading takes the dative.
  const previousStart = match.index + match[0].indexOf(previous);
  return pluralDativeBefore.test(before.slice(0, previousStart));
}
const abbreviationPluralPattern =
  /(?<![\p{L}\p{M}])(\p{Lu}[\p{L}]{0,3}\p{Lu})(?:[:*_·•]|\/-?)innen(?![\p{L}\p{M}])/gu;

// A singular pair before a marked plural (`Über den/die Herausgeber:innen`):
// the plural article; the plural rules then resolve the noun.
const singularPairBeforePlural =
  /(?<![\p{L}\p{M}])([Dd])(?:en|er)\s*\/\s*die(\s+[\p{L}\p{M}’'-]+(?:[:*_·•]|\/-?)innen)(?![\p{L}\p{M}])/gu;

// Pairs written with the inflected masculine or the feminine first after a
// marked adjective in the accusative or dative (`anerkannte/n
// Heilpädagogen/in`, `Sozialpädagogische/n Assistentin/en`): the ordinary
// pair `Stamm/in`; the adjective gives the case. Alone, `Autorin/en` or
// `Freundin/en` mostly mean the plural.
const inflectedMasculinePair = /(?<=\p{Ll}e(?:[:*_·•]|\/-?)n\s+)(\p{Lu}[\p{L}\p{M}-]*?)en\/in(?![\p{L}\p{M}])/gu;
const feminineFirstPair = /(?<=\p{Ll}e(?:[:*_·•]|\/-?)n\s+)(\p{Lu}[\p{L}\p{M}-]*?)in\/en(?![\p{L}\p{M}])/gu;

function repairUnlistedForms(input: string): TransformResult {
  let replacements = 0;
  let text = input.replace(singularPairBeforePlural, (_match: string, initial: string, noun: string) => {
    replacements += 1;
    return `${initial}ie${noun}`;
  });
  for (const pattern of [inflectedMasculinePair, feminineFirstPair]) {
    text = text.replace(pattern, (match: string, stem: string) => {
      if (mapSingular(`${stem}/in`, "nominative") === undefined && mapSingular(stem, "nominative") === undefined) return match;
      replacements += 1;
      return `${stem}/in`;
    });
  }
  text = text.replace(compoundMarkerPattern, (match: string, base: string) => {
    const first = compoundFirstPart(base);
    if (!first) return match;
    replacements += 1;
    return `${first}-`;
  });
  text = text.replace(quotedPrefixPattern,
    (match: string, prefix: string, base: string, ending: string | undefined, binnen: string | undefined) => {
      const noun = ending === "in" ? mapSingular(base, "nominative")
        : (mapKnownPlural(base) ?? mapMappedPlural(base) ?? (binnen || ending === "innen" ? undefined : undefined));
      if (!noun) return match;
      replacements += 1;
      return prefix + noun;
    });
  text = text.replace(plainErPluralPattern, (match: string, stem: string, dativeN: string, offset: number, source: string) => {
    // A listed noun with another plural (`Bauer` → `Bauern`) stays with the
    // lexicon rules; -er nouns have the plural of the singular.
    const head = stem.replace(/^.*-/u, "");
    // A line-break hyphen (`Tea-mer:innen`) is no compound.
    if (lowercaseStartPattern.test(head) && head !== stem) return match;
    if (notPlainEr.test(head) || isDisabledLoanword(head.toLocaleLowerCase("de-DE"))) return match;
    // A listed source alias (`Partern:innen`, `Systempartern*innen`) keeps
    // its own repair.
    if (dativeN && isKnownStem(head + dativeN)) return match;
    const plural = mapKnownPlural(head) ?? mapMappedPlural(head);
    if (plural !== undefined && plural.toLocaleLowerCase("de-DE") !== head.toLocaleLowerCase("de-DE")) return match;
    const rawBefore = source.slice(Math.max(0, offset - 200), offset);
    const before = withoutUpperBound(rawBefore.slice(-80));
    // Both dative readings need a trigger word; most texts have none nearby.
    const triggered = dativeTriggerNear.test(before);
    const after = source.slice(offset + match.length, offset + match.length + 120);
    // A list can start further back (`aus Aussteigern, betroffenen
    // Angehörigen, … sowie Religionswissenschaftler:innen`).
    const listBefore = withoutUpperBound(rawBefore.slice(-160));
    const coordinatedDative = coordinatedEnding.test(before) && dativeTriggerNear.test(listBefore) &&
      isCoordinatedDative(listBefore, after);
    const directTrigger = triggered ? pluralDativeBefore.exec(before)?.[1] : undefined;
    const directDative = directTrigger !== undefined && !yearGap.test(before) &&
      !directionalTwoWayPreposition(directTrigger, rawBefore.slice(0, rawBefore.lastIndexOf(directTrigger)), after) &&
      !(dativeVerbPattern.test(directTrigger) && !verbGovernsPlural(directTrigger,
        rawBefore.slice(0, rawBefore.lastIndexOf(directTrigger)), after));
    // Listed -er nouns (also compounds the lexicon reads) keep the lexicon
    // rules and their dative and coordination handling; only a coordinated
    // dative, a number or name part between, or a prefix they cannot read
    // comes here.
    const listed = plural !== undefined || mapSingular(head, "nominative") !== undefined;
    if (listed && !dativeN && !coordinatedDative && !/\d/u.test(stem) &&
        !(directDative && nameOrNumberGap.test(before))) return match;
    const dative = dativeN || (coordinatedDative || directDative ? "n" : "");
    replacements += 1;
    return stem + dative;
  });
  text = text.replace(abbreviationPluralPattern, (match: string, abbreviation: string) => {
    if ((abbreviation.match(uppercaseLetterPattern) ?? []).length < 2) return match;
    replacements += 1;
    return abbreviation;
  });
  return {text, replacements};
}

function transformMarkerSourceRepairs(input: string): TransformResult {
  let replacements = 0;
  if (unlistedFormCandidate.test(input)) {
    const unlisted = repairUnlistedForms(input);
    input = unlisted.text;
    replacements += unlisted.replacements;
  }
  if (/[:*_·•]e-/u.test(input)) {
    input = input.replace(innerAdjectivePattern,
      (_match: string, first: string, separator: string, second: string) => {
        replacements += 1;
        return `${first}-${second}${separator}`;
      });
  }
  if (inflectedMarkerCandidate.test(input)) {
    const inflected = repairInflectedMarkers(input);
    input = inflected.text;
    replacements += inflected.replacements;
  }
  if (!brokenMarkerCandidate.test(input)) return {text: input, replacements};
  const repair = (match: string, stem: string, separator: string, ending: string): string => {
    if (!isKnownStem(stem)) return match;
    replacements += 1;
    return stem + separator + ending;
  };
  const text = input
    .replace(hyphenatedPattern, (match: string, stem: string, separator: string) =>
      repair(match, stem, separator, "innen"))
    .replace(hyphenSlashPattern, (match: string, stem: string, separator: string, ending: string) =>
      repair(match, stem, separator, ending))
    .replace(doubledPattern, (match: string, stem: string, separator: string, ending: string) =>
      repair(match, stem, separator, ending));
  return {text, replacements};
}

export const markerSourceRepairsRule: Rule = {
  id: "marker.source-repairs",
  risk: "safe",
  apply: transformMarkerSourceRepairs
};
