import type { Rule, TransformResult } from "../core/rule";
import { transformGenderedPlural } from "./gendered-plural";
import {
  mapKnownPlural,
  mapKnownSingular
} from "./known-plural-separators";
import { mapMappedPlural } from "./mapped-plural-separators";
import { mapMappedSingular } from "./person-lexicon";

interface SupplementalForm {
  readonly stem: string;
  readonly plural: string;
  readonly singular: string;
  readonly exact?: boolean;
}

const locale = "de-DE";

/*
 * Quellenabgleich 2026-07:
 * - geschicktgendern.de, vollständige A-Z-Liste
 * - Schreibportal der Universität Leipzig
 * - Leitfaden der TU Dresden
 * - Hannover.de in Leichter Sprache
 *
 * Aufgenommen werden ausschließlich Formen, deren Rückführung auf die
 * generisch-maskuline Form ohne semantische Neuformulierung bestimmbar ist.
 */
const unchangedForms = [
  "absender",
  "akademiker",
  "alkoholiker",
  "allergiker",
  "alleskönner",
  "analytiker",
  "angler",
  "angreifer",
  "ankläger",
  "anleger",
  "anlieger",
  "anordner",
  "anrainer",
  "anrufer",
  "babysitter",
  "barkeeper",
  "bergsteiger",
  "berichterstatter",
  "betrachter",
  "camper",
  "coder",
  "designer",
  "developer",
  "dispatcher",
  "entdecker",
  "entscheider",
  "ermittler",
  "errichter",
  "ersteller",
  "erzähler",
  "erzeuger",
  "fischer",
  "follower",
  "freelancer",
  "freiberufler",
  "freikirchler",
  "fremdsprachler",
  "frühaufsteher",
  "föjler",
  "fsjler",
  "gaffer",
  "gamer",
  "gärtner",
  "globetrotter",
  "grafiker",
  "gutachter",
  "hacker",
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
  "kommissionierer",
  "kunstsammler",
  "layouter",
  "linkshänder",
  "literaturkritiker",
  "macher",
  "magier",
  "maler",
  "maurer",
  "mechatroniker",
  "mediziner",
  "minijobber",
  "mörder",
  "nachfrager",
  "nachrücker",
  "nachtschwärmer",
  "nichtraucher",
  "pächter",
  "pendler",
  "performer",
  "personaler",
  "pfadfinder",
  "pilger",
  "planer",
  "polsterer",
  "praktiker",
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
  "schlichter",
  "schöpfer",
  "schreiber",
  "schuhmacher",
  "schuster",
  "schwätzer",
  "schwimmer",
  "segler",
  "sender",
  "siedler",
  "sieger",
  "skeptiker",
  "sparer",
  "spaziergänger",
  "speaker",
  "spieler",
  "sportler",
  "stadtplaner",
  "streamer",
  "täter",
  "taucher",
  "teamplayer",
  "tester",
  "theoretiker",
  "töpfer",
  "torhüter",
  "träger",
  "trompeter",
  "tüftler",
  "überbringer",
  "verleger",
  "verleiher",
  "verlierer",
  "vermittler",
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
  regular("animateur", "animateure"),
  regular("archivar", "archivare"),
  regular("assessor", "assessoren"),
  regular("auditor", "auditoren"),
  regular("diktator", "diktatoren"),
  regular("evaluator", "evaluatoren"),
  regular("illustrator", "illustratoren"),
  regular("initiator", "initiatoren"),
  regular("installateur", "installateure"),
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
  regular("mediator", "mediatoren"),
  regular("monteur", "monteure"),
  regular("multiplikator", "multiplikatoren"),
  regular("operateur", "operateure"),
  regular("passagier", "passagiere"),
  regular("pionier", "pioniere"),
  regular("referendar", "referendare"),
  regular("reparateur", "reparateure"),
  regular("spediteur", "spediteure"),
  regular("tutor", "tutoren"),
  regular("veterinär", "veterinäre"),
  regular("visionär", "visionäre"),
  regular("arzt", "ärzte", "arzt", true),
  regular("köch", "köche", "koch", true),
  regular("kompars", "komparsen", "komparse"),
  regular("logopäd", "logopäden", "logopäde"),
  regular("matros", "matrosen", "matrose"),
  regular("noviz", "novizen", "novize"),
  regular("schöff", "schöffen", "schöffe"),
  regular("schütz", "schützen", "schütze"),
  regular("strateg", "strategen", "stratege")
].sort((left, right) => right.stem.length - left.stem.length);

function applyCase(source: string, replacement: string): string {
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
  return mappedForms.find((form) =>
    form.exact ? normalized === form.stem : normalized.endsWith(form.stem)
  );
}

function findUnchangedStem(base: string): string | undefined {
  const normalized = base.toLocaleLowerCase(locale);
  return unchangedForms.find((stem) => normalized.endsWith(stem));
}

function mapSupplementalPlural(base: string): string | undefined {
  const mapped = findMappedForm(base);
  if (mapped) {
    return applySuffix(base, mapped.stem, mapped.plural);
  }

  const unchanged = findUnchangedStem(base);
  return unchanged ? base : undefined;
}

function mapSupplementalSingular(base: string): string | undefined {
  const mapped = findMappedForm(base);
  if (mapped) {
    return applySuffix(base, mapped.stem, mapped.singular);
  }

  const unchanged = findUnchangedStem(base);
  return unchanged ? base : undefined;
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
  mapper: (base: string) => string | undefined
): TransformResult {
  let replacements = 0;
  const text = input.replace(pattern, (match: string, base: string) => {
    const replacement = mapper(base);
    if (replacement === undefined) {
      return match;
    }

    replacements += 1;
    return replacement;
  });

  return { text, replacements };
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
const supplementalSeparatorSingularPattern =
  /(?<![\p{L}\p{M}])([\p{L}\p{M}’'-]+)(?:(?:\/-?)|[:*_·•.’‘])in(?![\p{L}\p{M}])/giu;
const supplementalBinnenISingularPattern =
  /(?<![\p{L}\p{M}])([\p{L}\p{M}’'-]+)In(?![\p{L}\p{M}])/gu;
const spacedSeparatorPluralPattern =
  /(?<![\p{L}\p{M}])([\p{L}\p{M}’'-]+)\s+[:*_\/+·•.’‘]\s*innen(?![\p{L}\p{M}])/giu;
const plusPluralPattern =
  /(?<![\p{L}\p{M}])([\p{L}\p{M}’'-]+)\s*\+\s*innen(?![\p{L}\p{M}])/giu;
const spacedBinnenIPluralPattern =
  /(?<![\p{L}\p{M}])([\p{L}\p{M}’'-]+)\s+I\s*nnen(?![\p{L}\p{M}])/gu;

export const sourceAuditPluralRule: Rule = {
  id: "plural.source-audit-forms",
  risk: "safe",

  apply(input) {
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

export const sourceAuditSingularRule: Rule = {
  id: "singular.source-audit-forms",
  risk: "contextual",

  apply(input) {
    return combine(input, [
      (text) =>
        transformPattern(
          text,
          supplementalSeparatorSingularPattern,
          mapSupplementalSingular
        ),
      (text) =>
        transformPattern(
          text,
          supplementalBinnenISingularPattern,
          mapSupplementalSingular
        )
    ]);
  }
};
