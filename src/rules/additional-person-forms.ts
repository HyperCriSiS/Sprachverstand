import type { Rule, TransformResult } from "../core/rule";
import { transformGenderedPlural } from "./gendered-plural";
import {
  mapKnownPlural,
  mapKnownSingular
} from "./known-plural-separators";
import { mapMappedPlural } from "./mapped-plural-separators";
import { mapMappedSingular } from "./person-lexicon";
import { obliqueDeterminerCaseBefore } from "./singular-context";
import { hasAmbiguousSingularDeterminer } from "./singular-context-guard";
import { createSuffixLookup } from "./suffix-index";
import { preserveInnerCase } from "./inner-case";

interface SupplementalForm {
  readonly stem: string;
  readonly plural: string;
  readonly singular: string;
  readonly exact?: boolean;
}

const locale = "de-DE";

/*
 * Ergänzende Personenformen mit einzeln bestimmten Singular- und Pluralzielen.
 * Aufgenommen werden ausschließlich morphologisch eindeutige Formen, die ohne
 * semantische Neuformulierung umgewandelt werden können.
 */
const unchangedForms = [
  "abenteurer",
  "absender",
  "akademiker",
  "alleinverdiener",
  "alkoholiker",
  "allergiker",
  "alleskönner",
  "analytiker",
  "altenpfleger",
  "angler",
  "angreifer",
  "anforderer",
  "anhänger",
  "ankläger",
  "anleger",
  "anlieger",
  "anordner",
  "anrainer",
  "anrufer",
  "anteilseigner",
  "antragsteller",
  "anwärter",
  "auftragnehmer",
  "augenoptiker",
  "ausländer",
  "außenseiter",
  "aussteiger",
  "babysitter",
  "barkeeper",
  "befrager",
  "befürworter",
  "beisitzer",
  "bergsteiger",
  "berliner",
  "berichterstatter",
  "bestatter",
  "betrachter",
  "betrüger",
  "bewahrer",
  "bezieher",
  "bieter",
  "botschafter",
  "camper",
  "chemiker",
  "coder",
  "diabetiker",
  "dichter",
  "designer",
  "developer",
  "dispatcher",
  "doppelgänger",
  "ehrenamtler",
  "einbrecher",
  "eigner",
  "einwohner",
  "einzelgänger",
  "elektriker",
  "elektroniker",
  "entdecker",
  "entscheider",
  "erbauer",
  "erblasser",
  "ermittler",
  "errichter",
  "ersteller",
  "erzähler",
  "erzeuger",
  "fahrzeughalter",
  "fischer",
  "follower",
  "freelancer",
  "freiberufler",
  "freikirchler",
  "fremdsprachler",
  "frühaufsteher",
  "fußgänger",
  "förster",
  "föjler",
  "fsjler",
  "gaffer",
  "gamer",
  "gesellschafter",
  "gestalter",
  "gärtner",
  "gläubiger",
  "globetrotter",
  "grafiker",
  "gutachter",
  "hacker",
  "herrscher",
  "historiker",
  "hörer",
  "hospizler",
  "imker",
  "influencer",
  "inlineskater",
  "insider",
  "italiener",
  "kämmerer",
  "kassierer",
  "kellner",
  "kenner",
  "keramiker",
  "keyplayer",
  "kletterer",
  "klimaschützer",
  "kläger",
  "kommissionierer",
  "krankenpfleger",
  "kritiker",
  "kunstsammler",
  "layouter",
  "linkshänder",
  "literaturkritiker",
  "läufer",
  "macher",
  "magier",
  "maler",
  "maurer",
  "mechatroniker",
  "mediziner",
  "minijobber",
  "mörder",
  "nachahmer",
  "nachfrager",
  "nachfolger",
  "nachrücker",
  "nachtschwärmer",
  "nichtraucher",
  "pächter",
  "pendler",
  "performer",
  "personaler",
  "peiniger",
  "pfadfinder",
  "pfleger",
  "pilger",
  "planer",
  "polsterer",
  "praktiker",
  "prediger",
  "priester",
  "proletarier",
  "querdenker",
  "quereinsteiger",
  "rabbiner",
  "ranger",
  "recruiter",
  "reformer",
  "reiter",
  "reporter",
  "ruderer",
  "sammler",
  "sänger",
  "schlepper",
  "schlichter",
  "schulabbrecher",
  "schulabgänger",
  "schuldner",
  "schöpfer",
  "schreiber",
  "schuhmacher",
  "schuster",
  "schwätzer",
  "schwimmer",
  "seelsorger",
  "segler",
  "sender",
  "siedler",
  "sieger",
  "skeptiker",
  "sparer",
  "späher",
  "spaziergänger",
  "speaker",
  "spieler",
  "sportler",
  "stakeholder",
  "stadtplaner",
  "störer",
  "streamer",
  "supporter",
  "tänzer",
  "täter",
  "taucher",
  "teamplayer",
  "tester",
  "theoretiker",
  "tierschützer",
  "töpfer",
  "torhüter",
  "träger",
  "trompeter",
  "tüftler",
  "überbringer",
  "unterzeichner",
  "urheber",
  "urlauber",
  "user",
  "veganer",
  "vegetarier",
  "verbrecher",
  "verleger",
  "verleiher",
  "verlierer",
  "vermittler",
  "verteidiger",
  "versender",
  "vertriebler",
  "verursacher",
  "verwender",
  "vordenker",
  "vorgänger",
  "vorredner",
  "vorreiter",
  "vorsteher",
  "wächter",
  "wettbewerber",
  "widersacher",
  "wiederholer",
  "wikipedianer",
  "wilderer",
  "winzer",
  "youtuber",
  "zauberer",
  "zehnkämpfer",
  "züchter",
  "zweifler"
].sort((left, right) => right.length - left.length);

function regular(
  stem: string,
  plural: string,
  singular = stem,
  exact = false
): SupplementalForm {
  return { stem, plural, singular, exact };
}

function weak(
  stem: string,
  singular = stem,
  plural = `${stem}en`,
  exact = false
): SupplementalForm {
  return { stem, plural, singular, exact };
}

const mappedForms: readonly SupplementalForm[] = [
  weak("abiturient"),
  weak("alpinist"),
  weak("analphabet"),
  weak("antagonist"),
  weak("antisemit"),
  weak("asket"),
  weak("aspirant"),
  weak("atheist"),
  weak("autist"),
  weak("bachelorand"),
  weak("buddhist"),
  weak("christ"),
  weak("dezernent"),
  weak("diplomand"),
  weak("disponent"),
  weak("emittent"),
  weak("enthusiast"),
  weak("extremist"),
  weak("faschist"),
  weak("fetischist"),
  weak("finalist"),
  weak("generalist"),
  weak("gymnasiast"),
  weak("hospitant"),
  weak("humanist"),
  weak("intendant"),
  weak("internist"),
  weak("karnevalist"),
  weak("kommunist"),
  weak("konfirmand"),
  weak("lagerist"),
  weak("legist"),
  weak("linguist"),
  weak("lobbyist"),
  weak("manipulant"),
  weak("masterand"),
  weak("ministrant"),
  weak("passant"),
  weak("pazifist"),
  weak("proband"),
  weak("prokurist"),
  weak("protagonist"),
  weak("rehabilitand"),
  weak("repetent"),
  weak("repräsentant"),
  weak("reservist"),
  weak("rezeptionist"),
  weak("rezipient"),
  weak("sadist"),
  weak("salafist"),
  weak("sexist"),
  weak("spekulant"),
  weak("statist"),
  weak("stipendiat"),
  weak("supervisand"),
  weak("zivilist"),
  weak("ökonom"),
  weak("bürokrat"),
  weak("favorit"),
  weak("kontrahent"),
  weak("rassist"),
  regular("animateur", "animateure"),
  regular("amateur", "amateure"),
  regular("archivar", "archivare"),
  regular("assessor", "assessoren"),
  regular("auditor", "auditoren"),
  regular("chauffeur", "chauffeure"),
  regular("coach", "coaches"),
  regular("dekan", "dekane"),
  regular("detektiv", "detektive"),
  regular("dieb", "diebe"),
  regular("diktator", "diktatoren"),
  regular("editor", "editoren"),
  regular("evaluator", "evaluatoren"),
  regular("feind", "feinde"),
  regular("illustrator", "illustratoren"),
  regular("initiator", "initiatoren"),
  regular("installateur", "installateure"),
  regular("inspekteur", "inspekteure"),
  regular("interakteur", "interakteure"),
  regular("jubilar", "jubilare"),
  regular("juror", "juroren"),
  regular("justiziar", "justiziare"),
  regular("kommentator", "kommentatoren"),
  regular("kommunikator", "kommunikatoren"),
  regular("konditor", "konditoren"),
  regular("konstrukteur", "konstrukteure"),
  regular("kurator", "kuratoren"),
  regular("kurier", "kuriere"),
  regular("masseur", "masseure"),
  regular("mediator", "mediatoren"),
  regular("monteur", "monteure"),
  regular("muslim", "muslime"),
  regular("multiplikator", "multiplikatoren"),
  regular("operateur", "operateure"),
  regular("passagier", "passagiere"),
  regular("pionier", "pioniere"),
  regular("referendar", "referendare"),
  regular("reparateur", "reparateure"),
  regular("schmied", "schmiede"),
  regular("spediteur", "spediteure"),
  regular("spion", "spione"),
  regular("steinmetz", "steinmetze"),
  regular("tutor", "tutoren"),
  regular("veterinär", "veterinäre"),
  regular("visionär", "visionäre"),
  regular("arzt", "ärzte", "arzt", true),
  regular("köch", "köche", "koch", true),
  regular("kompars", "komparsen", "komparse"),
  regular("logopäd", "logopäden", "logopäde"),
  regular("matros", "matrosen", "matrose"),
  regular("noviz", "novizen", "novize"),
  regular("pat", "paten", "pate", true),
  regular("schöff", "schöffen", "schöffe"),
  regular("schütz", "schützen", "schütze"),
  regular("strateg", "strategen", "stratege"),
  regular("themenpat", "themenpaten", "themenpate", true)
].sort((left, right) => right.stem.length - left.stem.length);

function applyCase(source: string, replacement: string): string {
  const inner = preserveInnerCase(source, replacement);
  if (inner !== undefined) return inner;
  const lowerSource = source.toLocaleLowerCase(locale);
  const upperSource = source.toLocaleUpperCase(locale);

  if (source === upperSource && source !== lowerSource) {
    return replacement.toLocaleUpperCase(locale);
  }

  const first = [...source][0];
  if (first && first === first.toLocaleUpperCase(locale)) {
    const characters = [...replacement];
    const firstReplacement = characters.shift();
    return firstReplacement
      ? firstReplacement.toLocaleUpperCase(locale) + characters.join("")
      : replacement;
  }

  return replacement.toLocaleLowerCase(locale);
}

function applySuffix(base: string, stem: string, replacement: string): string {
  const prefix = base.slice(0, -stem.length);
  const sourceSuffix = base.slice(-stem.length);
  return prefix + applyCase(sourceSuffix, replacement);
}

function findMappedForm(base: string): SupplementalForm | undefined {
  const normalized = base.toLocaleLowerCase(locale);
  return lookupMappedForm(normalized);
}

function findUnchangedStem(base: string): string | undefined {
  const normalized = base.toLocaleLowerCase(locale);
  return lookupUnchangedStem(normalized);
}

const lookupMappedForm = createSuffixLookup(mappedForms, form => form.stem,
  form => form.exact === true);
const lookupUnchangedStem = createSuffixLookup(unchangedForms, stem => stem);

const maximumSupplementalCacheEntries = 256;
const supplementalPluralCache = new Map<string, string | undefined>();
const supplementalSingularCache = new Map<string, string | undefined>();

function rememberSupplemental(cache: Map<string, string | undefined>, base: string,
  result: string | undefined): string | undefined {
  if (cache.size >= maximumSupplementalCacheEntries) cache.delete(cache.keys().next().value!);
  cache.set(base, result);
  return result;
}

function mapSupplementalPlural(base: string): string | undefined {
  if (supplementalPluralCache.has(base)) return supplementalPluralCache.get(base);
  const mapped = findMappedForm(base);
  if (mapped) {
    return rememberSupplemental(supplementalPluralCache, base,
      applySuffix(base, mapped.stem, mapped.plural));
  }

  const unchanged = findUnchangedStem(base);
  return rememberSupplemental(supplementalPluralCache, base, unchanged ? base : undefined);
}

function mapSupplementalSingular(base: string): string | undefined {
  if (supplementalSingularCache.has(base)) return supplementalSingularCache.get(base);
  const mapped = findMappedForm(base);
  if (mapped) {
    return rememberSupplemental(supplementalSingularCache, base,
      applySuffix(base, mapped.stem, mapped.singular));
  }

  const unchanged = findUnchangedStem(base);
  return rememberSupplemental(supplementalSingularCache, base, unchanged ? base : undefined);
}

function mapAllPlural(base: string): string | undefined {
  return (
    mapSupplementalPlural(base) ??
    mapMappedPlural(base) ??
    mapKnownPlural(base)
  );
}

function mapAllSingular(base: string): string | undefined {
  return (
    mapSupplementalSingular(base) ??
    mapMappedSingular(base, "nominative") ??
    mapKnownSingular(base, "nominative")
  );
}

function transformPattern(
  input: string,
  pattern: RegExp,
  mapper: (base: string) => string | undefined,
  protectAmbiguousDeterminer = false
): TransformResult {
  let replacements = 0;
  const text = input.replace(
    pattern,
    (
      match: string,
      base: string,
      offset: number,
      fullInput: string
    ) => {
      if (
        protectAmbiguousDeterminer &&
        hasAmbiguousSingularDeterminer(fullInput, offset)
      ) {
        return match;
      }

      const replacement = mapper(base);
      if (replacement === undefined) {
        return match;
      }
      if (
        protectAmbiguousDeterminer &&
        !hasCaselessSingular(fullInput, offset, replacement)
      ) {
        return match;
      }

      replacements += 1;
      return replacement;
    }
  );

  return { text, replacements };
}

// These forms carry no case information. After `des`/`eines` the genitive
// needs an ending, and weak nouns (`dem Kollege`) need `-n` in every oblique
// case, so both stay unchanged rather than become a wrong nominative.
const weakNounEnding = /(?:e|ant|ent|and|ist|at|et|oge|om|af|oph)$/iu;

function hasCaselessSingular(input: string, offset: number, singular: string): boolean {
  const grammaticalCase = obliqueDeterminerCaseBefore(input, offset);
  return grammaticalCase === undefined ||
    (grammaticalCase !== "genitive" && !weakNounEnding.test(singular));
}

function combine(input: string, transforms: readonly ((text: string) => TransformResult)[]): TransformResult {
  let text = input;
  let replacements = 0;

  for (const transform of transforms) {
    const result = transform(text);
    text = result.text;
    replacements += result.replacements;
  }

  return { text, replacements };
}

const supplementalBinnenIPluralPattern =
  /(?<![\p{L}\p{M}])([\p{L}\p{M}’'-]+)Innen/gu;
const supplementalBinnenISingularPattern =
  /(?<![\p{L}\p{M}])([\p{L}\p{M}’'-]+)In(?![\p{L}\p{M}])/gu;
const supplementalSeparatorSingularPattern =
  /(?<![\p{L}\p{M}])([\p{L}\p{M}’'-]+)(?:(?:\/-?)|[:*_·•.’‘])in(?![\p{L}\p{M}])/giu;
const spacedSeparatorPluralPattern =
  /(?<![\p{L}\p{M}])([\p{L}\p{M}’'-]+)\s+[:*_\/+·•.’‘]\s*innen(?![\p{L}\p{M}])/giu;
const plusPluralPattern =
  /(?<![\p{L}\p{M}])([\p{L}\p{M}’'-]+)\s*\+\s*innen(?![\p{L}\p{M}])/giu;
const spacedBinnenIPluralPattern =
  /(?<![\p{L}\p{M}])([\p{L}\p{M}’'-]+)\s+I\s*nnen(?![\p{L}\p{M}])/gu;

export const additionalPersonPluralRule: Rule = {
  id: "plural.additional-person-forms",
  risk: "safe",

  apply(input) {
    // Every supported plural marker contains inn or the spaced I + nnen.
    if (!/inn|nnen/iu.test(input)) return {text: input, replacements: 0};
    return combine(input, [
      (text) => transformGenderedPlural(text, mapSupplementalPlural),
      (text) =>
        transformGenderedPlural(
          text,
          mapSupplementalPlural,
          supplementalBinnenIPluralPattern
        ),
      (text) => transformPattern(text, spacedSeparatorPluralPattern, mapAllPlural),
      (text) => transformPattern(text, plusPluralPattern, mapAllPlural),
      (text) => transformPattern(text, spacedBinnenIPluralPattern, mapAllPlural)
    ]);
  }
};

export const additionalPersonSingularRule: Rule = {
  id: "singular.additional-person-forms",
  risk: "contextual",

  apply(input) {
    if (!/in(?![a-z])/iu.test(input)) return {text: input, replacements: 0};
    return combine(input, [
      (text) =>
        transformPattern(
          text,
          supplementalSeparatorSingularPattern,
          mapSupplementalSingular,
          true
        ),
      (text) =>
        transformPattern(
          text,
          supplementalBinnenISingularPattern,
          mapSupplementalSingular,
          true
        )
    ]);
  }
};
