import type { Rule, TransformResult } from "../core/rule";
import { withLeadingContextRule, withRelativeAgreementRule } from "./relative-agreement";
import {lazyPattern} from "../core/lazy-pattern";
import {
  mapKnownPlural,
  mapKnownSingular
} from "./known-plural-separators";
import {
  mapMappedPlural,
  mapMappedSingular,
  type GrammaticalCase
} from "./person-lexicon";
import { mapSupplementalPlural, mapSupplementalSingular } from "./additional-person-forms";
import { transformClauseCase } from "./clause-case";
import { normalizeCompactDeterminers, normalizeDeterminerPairs } from "./determiner-pairs";
import { finiteVerbsBeforeDer } from "./finite-verbs-before-der";
import { preserveInnerCase } from "./inner-case";

interface DeterminerForm {
  readonly masculine: string;
  readonly grammaticalCase: GrammaticalCase;
}

const locale = "de-DE";
// Every pattern below requires a marked singular ending at a word boundary:
// a marker before `in` (`:in`, `*in`, `/-in`, `(in)`, `.in`) or the visible
// Binnen-I (`LehrerIn`). Plain words on -in (`ein`, `Berlin`, `Lehrerin`)
// and plural markers need none of the twelve context scans.
const singularEndingCandidate = /(?:[:*_\/·•.’‘(-]-?[iI][nN]|In)(?![\p{L}\p{M}])/u;
const separators = [":", "*", "_", "/", "/-", "·", "•", ".", "’", "‘"] as const;
const determinerForms = new Map<string, DeterminerForm>();

function addDeterminer(
  left: string,
  right: string,
  masculine: string,
  grammaticalCase: GrammaticalCase,
  reverse = false
): void {
  for (const separator of separators) {
    determinerForms.set(`${left}${separator}${right}`, {
      masculine,
      grammaticalCase
    });

    if (reverse) {
      determinerForms.set(`${right}${separator}${left}`, {
        masculine,
        grammaticalCase
      });
    }
  }
}

function addPossessiveDeterminers(
  base: string,
  inflectedBase = `${base}e`,
  accusative = `${base}en`,
  dative = `${base}em`,
  genitiveMasculine = `${base}es`,
  genitiveFeminine = `${base}er`
): void {
  addDeterminer(base, "e", base, "nominative");
  addDeterminer(inflectedBase, "n", accusative, "accusative");
  addDeterminer(inflectedBase, "m", dative, "dative");
  // `Ihrem:r`, `seinem/r`: dative written from the masculine form.
  addDeterminer(dative, "r", dative, "dative");
  addDeterminer(
    genitiveMasculine,
    genitiveFeminine,
    genitiveMasculine,
    "genitive"
  );
}

addDeterminer("der", "die", "der", "nominative", true);
addDeterminer("den", "die", "den", "accusative", true);
addDeterminer("dem", "der", "dem", "dative", true);
addDeterminer("des", "der", "des", "genitive", true);
addDeterminer("ein", "e", "ein", "nominative");
addDeterminer("eine", "n", "einen", "accusative");
addDeterminer("einem", "einer", "einem", "dative");
addDeterminer("eines", "einer", "eines", "genitive");
addDeterminer("kein", "e", "kein", "nominative");
addDeterminer("keine", "n", "keinen", "accusative");
addDeterminer("keine", "m", "keinem", "dative");
addDeterminer("keines", "keiner", "keines", "genitive");
addDeterminer("jede", "r", "jeder", "nominative");
addDeterminer("jede", "n", "jeden", "accusative");
addDeterminer("jede", "m", "jedem", "dative");
addDeterminer("jedes", "jeder", "jedes", "genitive");
addDeterminer("welche", "r", "welcher", "nominative");
addDeterminer("welche", "n", "welchen", "accusative");
addDeterminer("welche", "m", "welchem", "dative");
addDeterminer("welches", "welcher", "welches", "genitive");
addDeterminer("diese", "r", "dieser", "nominative");
addDeterminer("diese", "n", "diesen", "accusative");
addDeterminer("diese", "m", "diesem", "dative");
addDeterminer("dieses", "dieser", "dieses", "genitive");
addDeterminer("jene", "r", "jener", "nominative");
addDeterminer("jene", "n", "jenen", "accusative");
addDeterminer("jene", "m", "jenem", "dative");
addDeterminer("jenes", "jener", "jenes", "genitive");

addPossessiveDeterminers("mein");
addPossessiveDeterminers("dein");
addPossessiveDeterminers("sein");
addPossessiveDeterminers("ihr");
addPossessiveDeterminers("unser");
addPossessiveDeterminers(
  "euer",
  "eure",
  "euren",
  "eurem",
  "eures",
  "eurer"
);

// Contracted prepositions: `zum/zur`, `zur/zum`, `zum/r`, `zur/m`.
addDeterminer("zum", "zur", "zum", "dative", true);
addDeterminer("zum", "r", "zum", "dative");
addDeterminer("zur", "m", "zum", "dative");

// Further compact pairs: `einem/r`, `dem*r`, `der:m`, `des/r`, `eines*r`,
// `einer/m`, `jeder*m`, `einer/s`. Without them the noun was resolved and
// the pair stayed (`einer*m Mentor`) or the whole phrase kept its markers.
addDeterminer("einem", "r", "einem", "dative");
addDeterminer("dem", "r", "dem", "dative");
addDeterminer("der", "m", "dem", "dative");
addDeterminer("des", "r", "des", "genitive");
// `der/s Patient/in`: der/des written from the feminine form.
addDeterminer("der", "s", "des", "genitive");
addDeterminer("eines", "r", "eines", "genitive");
addDeterminer("einer", "m", "einem", "dative");
addDeterminer("jeder", "m", "jedem", "dative");
addDeterminer("einer", "s", "eines", "genitive");
// `dem*er Gewinner*in`, `einem/-er Stellvertreter*in`, `Ihres:r Arbeitgeber:in`.
addDeterminer("dem", "er", "dem", "dative");
addDeterminer("einem", "er", "einem", "dative");
for (const base of ["mein", "dein", "sein", "ihr", "unser", "eur"]) {
  addDeterminer(`${base}es`, "r", `${base}es`, "genitive");
  addDeterminer(`${base}em`, "r", `${base}em`, "dative");
}

addDeterminer("sein", "ihr", "sein", "nominative", true);
addDeterminer("seinen", "ihren", "seinen", "accusative", true);
addDeterminer("seinem", "ihrem", "seinem", "dative", true);
addDeterminer("seines", "ihres", "seines", "genitive", true);

const determinerToken = String.raw`[\p{L}\p{M}:*_/·•.’‘-]+`;
const nounBase = String.raw`[\p{L}\p{M}’'-]+`;
const separatorSingularPattern = lazyPattern(
  String.raw`(?<![\p{L}\p{M}])(${determinerToken})(\s+)(${nounBase})(?:(?:\/-?)|[:*_·•.’‘])in(?![\p{L}\p{M}])`,
  "giu"
);
const binnenISingularPattern = lazyPattern(
  String.raw`(?<![\p{L}\p{M}])(${determinerToken})(\s+)(${nounBase})In(?![\p{L}\p{M}])`,
  "gu"
);
const adjectiveModifiers = String.raw`(?:${nounBase}\s+){0,2}`;
const adjectiveMarker = String.raw`[:*_\/·•.’‘]`;
const attributiveSeparatorSingularPattern = lazyPattern(
  String.raw`(?<![\p{L}\p{M}])(${determinerToken})(\s+)(${adjectiveModifiers})(${nounBase})(?:(${adjectiveMarker})([rnms]))?(\s+)(${nounBase})(?:(?:\/-?)|[:*_·•.’‘])in(?![\p{L}\p{M}])`,
  "giu"
);
const attributiveBinnenISingularPattern = lazyPattern(
  String.raw`(?<![\p{L}\p{M}])(${determinerToken})(\s+)(${adjectiveModifiers})(${nounBase})(?:(${adjectiveMarker})([rnms]))?(\s+)(${nounBase})In(?![\p{L}\p{M}])`,
  "gu"
);

const ordinaryMasculineDeterminers = new Map<string, DeterminerForm>();
const nominativeFeminineDeterminers = new Map<string, string>();
const accusativeFeminineDeterminers = new Map<string, string>();
const dativeFeminineDeterminers = new Map<string, string>();
const genitiveFeminineDeterminers = new Map<string, string>();

function addOrdinaryDeterminerSet(
  masculineNominative: string,
  masculineAccusative: string,
  masculineDative: string,
  masculineGenitive: string,
  feminineNominativeAccusative: string,
  feminineDativeGenitive: string
): void {
  ordinaryMasculineDeterminers.set(masculineNominative, {
    masculine: masculineNominative,
    grammaticalCase: "nominative"
  });
  ordinaryMasculineDeterminers.set(masculineAccusative, {
    masculine: masculineAccusative,
    grammaticalCase: "accusative"
  });
  ordinaryMasculineDeterminers.set(masculineDative, {
    masculine: masculineDative,
    grammaticalCase: "dative"
  });
  ordinaryMasculineDeterminers.set(masculineGenitive, {
    masculine: masculineGenitive,
    grammaticalCase: "genitive"
  });
  nominativeFeminineDeterminers.set(
    feminineNominativeAccusative,
    masculineNominative
  );
  accusativeFeminineDeterminers.set(
    feminineNominativeAccusative,
    masculineAccusative
  );
  dativeFeminineDeterminers.set(feminineDativeGenitive, masculineDative);
  genitiveFeminineDeterminers.set(feminineDativeGenitive, masculineGenitive);
  // Fully written pairs in both orders: `eine/einen`, `einer*einem`,
  // `Ihrer/Ihrem`, `deiner*deinem` (compact `eine/n` forms are above).
  addDeterminer(masculineNominative, feminineNominativeAccusative, masculineNominative, "nominative", true);
  addDeterminer(masculineAccusative, feminineNominativeAccusative, masculineAccusative, "accusative", true);
  addDeterminer(masculineDative, feminineDativeGenitive, masculineDative, "dative", true);
  addDeterminer(masculineGenitive, feminineDativeGenitive, masculineGenitive, "genitive", true);
}

addOrdinaryDeterminerSet("der", "den", "dem", "des", "die", "der");
addOrdinaryDeterminerSet("ein", "einen", "einem", "eines", "eine", "einer");
addOrdinaryDeterminerSet("kein", "keinen", "keinem", "keines", "keine", "keiner");
addOrdinaryDeterminerSet("jeder", "jeden", "jedem", "jedes", "jede", "jeder");
addOrdinaryDeterminerSet(
  "welcher",
  "welchen",
  "welchem",
  "welches",
  "welche",
  "welcher"
);
addOrdinaryDeterminerSet(
  "dieser",
  "diesen",
  "diesem",
  "dieses",
  "diese",
  "dieser"
);
addOrdinaryDeterminerSet(
  "jener",
  "jenen",
  "jenem",
  "jenes",
  "jene",
  "jener"
);
addOrdinaryDeterminerSet("mein", "meinen", "meinem", "meines", "meine", "meiner");
addOrdinaryDeterminerSet("dein", "deinen", "deinem", "deines", "deine", "deiner");
addOrdinaryDeterminerSet("sein", "seinen", "seinem", "seines", "seine", "seiner");
addOrdinaryDeterminerSet("ihr", "ihren", "ihrem", "ihres", "ihre", "ihrer");
addOrdinaryDeterminerSet(
  "unser",
  "unseren",
  "unserem",
  "unseres",
  "unsere",
  "unserer"
);
addOrdinaryDeterminerSet("euer", "euren", "eurem", "eures", "eure", "eurer");

const ordinaryDeterminerAlternation = [...ordinaryMasculineDeterminers.keys()]
  .sort((left, right) => right.length - left.length)
  .join("|");
const ordinaryBinnenIPattern = lazyPattern(
  String.raw`(?<![\p{L}\p{M}])(${ordinaryDeterminerAlternation})(\s+)(${nounBase})In(?![\p{L}\p{M}])`,
  "giu"
);
// Oblique masculine determiners fix the case of a following marked singular
// (`dem Kund*in` -> `dem Kunden`, `des Mitarbeiter*in` -> `des Mitarbeiters`).
// The nominative forms stay with the unmarked rule and its ambiguity guard.
const obliqueMasculineDeterminers = new Set(
  [...ordinaryMasculineDeterminers]
    .filter(([, form]) => form.grammaticalCase !== "nominative")
    .map(([determiner]) => determiner)
);
// After an oblique masculine determiner every attributive adjective is weak
// (`dem neuen`, `eines erfahrenen`); up to two of them may stand in between.
const weakAdjectives = String.raw`(?:[\p{L}\p{M}]+en\s+){0,2}`;
// A determiner that is the second half of a pair (`eine/einen`, `deiner*deinem`,
// `eine oder einen`) belongs to the pair rules; resolving only the noun would
// leave a half-converted phrase.
// `den einen Kritiker` uses `einen` as a numeral after another determiner.
const notSecondPairHalf = String.raw`(?<![\p{L}\p{M}])(?<![:*_\/·•.’‘]\s*)(?<!(?:oder|bzw\.|beziehungsweise|der|die|das|den|dem|des)\s+)`;
const ordinaryObliqueSeparatorPattern = lazyPattern(
  String.raw`${notSecondPairHalf}(${[...obliqueMasculineDeterminers].sort((left, right) => right.length - left.length).join("|")})(\s+${weakAdjectives})(${nounBase})(?:(?:\/-?|[:*_·•.’‘])in|\(-?in\))(?![\p{L}\p{M}-])`,
  "giu"
);
const obliqueDeterminerBeforeNoun = new RegExp(
  String.raw`(?<![\p{L}\p{M}])([\p{L}\p{M}]+)(\s+${weakAdjectives})$`,
  "u"
);

// Capitalized as self-designation, still adjectives (`mit einer Schwarzen
// Künstler:in`); any other capitalized word before the noun is a noun.
const capitalizedIdentityAdjective = /^(?:Schwarz|Weiß|Indigen)(?:e|en)$/u;

function hasLowercaseAdjectives(adjectives: string): boolean {
  return adjectives.split(/\s+/u).every(word =>
    word === "" || word === word.toLocaleLowerCase(locale) || capitalizedIdentityAdjective.test(word));
}

// The case an oblique masculine determiner directly before a noun fixes,
// e.g. `dative` for `mit dem neuen |Kund*in`.
export function obliqueDeterminerCaseBefore(
  input: string,
  nounIndex: number
): GrammaticalCase | undefined {
  const match = obliqueDeterminerBeforeNoun.exec(
    input.slice(Math.max(0, nounIndex - 96), nounIndex)
  );
  const [, rawDeterminer = "", adjectives = ""] = match ?? [];
  if (!match || !hasLowercaseAdjectives(adjectives)) return undefined;
  const determiner = rawDeterminer.toLocaleLowerCase(locale);
  return obliqueMasculineDeterminers.has(determiner)
    ? ordinaryMasculineDeterminers.get(determiner)?.grammaticalCase
    : undefined;
}

function mapAlternation(values: ReadonlyMap<string, string>): string {
  return [...values.keys()].sort((left, right) => right.length - left.length).join("|");
}

const accusativePrepositions = "für|durch|gegen|ohne|um";
// Two-way prepositions with feminine `der` are always dative (`zwischen der
// Spender:in`); the accusative would be `die`.
const dativePrepositions = "an|auf|aus|außer|bei|gegenüber|hinter|mit|nach|neben|seit|unter|von|vor|zu|zwischen";
const genitivePrepositions = "anstatt|außerhalb|innerhalb|statt|trotz|während|wegen";
const accusativeFemininePattern = lazyPattern(
  String.raw`(?<![\p{L}\p{M}])(${accusativePrepositions})(\s+)(${mapAlternation(accusativeFeminineDeterminers)})(\s+)(${nounBase})In(?![\p{L}\p{M}])`,
  "giu"
);
const dativeFemininePattern = lazyPattern(
  String.raw`(?<![\p{L}\p{M}])(${dativePrepositions})(\s+)(${mapAlternation(dativeFeminineDeterminers)})(\s+)(${nounBase})In(?![\p{L}\p{M}])`,
  "giu"
);
const genitiveFemininePattern = lazyPattern(
  String.raw`(?<![\p{L}\p{M}])(${genitivePrepositions})(\s+)(${mapAlternation(genitiveFeminineDeterminers)})(\s+)(${nounBase})In(?![\p{L}\p{M}])`,
  "giu"
);
// The same prepositional contexts for separator singulars: `mit der
// Lehrer*in` -> `mit dem Lehrer` (before, the unmarked rule left `mit der
// Lehrer`). Not as the second half of a pair (`vom:von der …`), not inside
// a compound (`Täter*in-Opfer-Umkehr`) and not before a coordinated marked
// noun, whose case this rule would not set (`von einer Künstler:in oder
// Technolog:in`).
const separatorSingularMarker = String.raw`(?:(?:\/-?)|[:*_·•’‘])in|\(-?in\)`;
const notAfterPairSeparator = String.raw`(?<![\p{L}\p{M}])(?<![:*_\/·•.’‘]\s*)`;
const singularPhraseEnd = String.raw`(?![\p{L}\p{M}-])(?!\s+(?:und|oder|bzw\.|sowie)\s+[\p{L}\p{M}’'-]+(?:${separatorSingularMarker}|\p{Ll}In)(?![\p{L}\p{M}]))`;
function prepositionalSeparatorPattern(
  prepositions: string,
  determiners: ReadonlyMap<string, string>
): () => RegExp {
  return lazyPattern(
    String.raw`${notAfterPairSeparator}(${prepositions})(\s+)(${mapAlternation(determiners)})(\s+)(${nounBase})(?:${separatorSingularMarker})${singularPhraseEnd}`,
    "giu"
  );
}
// Coordinated marked nouns after one preposition share its case:
// `zwischen der Spender:in und Empfänger:in` -> `zwischen dem Spender und
// Empfänger`, `zwischen der Patient*in und der Ärzt*in` -> `… und dem Arzt`.
function coordinatedSeparatorPattern(
  prepositions: string,
  determiners: ReadonlyMap<string, string>
): () => RegExp {
  const determinerSource = mapAlternation(determiners);
  return lazyPattern(
    String.raw`${notAfterPairSeparator}(${prepositions})(\s+)(${determinerSource})(\s+)(${nounBase})(?:${separatorSingularMarker})(\s+(?:und|oder|bzw\.|sowie)\s+)(?:(${determinerSource})(\s+))?(${nounBase})(?:${separatorSingularMarker})${singularPhraseEnd}`,
    "giu"
  );
}
const accusativeCoordinatedPattern = coordinatedSeparatorPattern(accusativePrepositions, accusativeFeminineDeterminers);
const dativeCoordinatedPattern = coordinatedSeparatorPattern(dativePrepositions, dativeFeminineDeterminers);
const genitiveCoordinatedPattern = coordinatedSeparatorPattern(genitivePrepositions, genitiveFeminineDeterminers);
const accusativeFeminineSeparatorPattern = prepositionalSeparatorPattern(accusativePrepositions, accusativeFeminineDeterminers);
const dativeFeminineSeparatorPattern = prepositionalSeparatorPattern(dativePrepositions, dativeFeminineDeterminers);
const genitiveFeminineSeparatorPattern = prepositionalSeparatorPattern(genitivePrepositions, genitiveFeminineDeterminers);
// `zur` is `zu der`: `zur Erzieher*in` / `zur ErzieherIn` -> `zum Erzieher`
// (before: `zur Erzieher`). Pairs like `zum/zur` stay with the pair rules.
const contractedZurSeparatorPattern = lazyPattern(
  String.raw`${notAfterPairSeparator}([Zz]ur|[Zz]um|[Vv]om|[Bb]eim)(\s+)((?:\p{L}[\p{L}\p{M}]*en\s+){0,2})(${nounBase})(?:${separatorSingularMarker})${singularPhraseEnd}`,
  "gu"
);
const contractedZurBinnenIPattern = lazyPattern(
  String.raw`${notAfterPairSeparator}([Zz]ur|[Zz]um|[Vv]om|[Bb]eim)(\s+)((?:\p{L}[\p{L}\p{M}]*en\s+){0,2})(${nounBase}\p{Ll})In${singularPhraseEnd}`,
  "gu"
);
const commonFiniteVerbs = [
  "arbeitet",
  "bekommt",
  "benötigt",
  "braucht",
  "darf",
  "erhält",
  "fragt",
  "hat",
  "ist",
  "kann",
  "liest",
  "meldet",
  "möchte",
  "muss",
  "nutzt",
  "sagt",
  "schreibt",
  "soll",
  "war",
  "wird",
  "will"
].join("|");
const nominativeSentencePattern = lazyPattern(
  String.raw`(^|[.!?]\s+|[;:]\s+)(${mapAlternation(nominativeFeminineDeterminers)})(\s+)(${nounBase})In(?=\s+(?:${commonFiniteVerbs})\b)`,
  "giu"
);
const standaloneNominativePattern = lazyPattern(
  String.raw`^(\s*)(${mapAlternation(nominativeFeminineDeterminers)})(\s+)(${nounBase})In(\s*[.!?]?)$`,
  "giu"
);
const accusativeVerbContext = [
  "begrüße",
  "begrüßen",
  "begrüßt",
  "beobachte",
  "beobachten",
  "beobachtet",
  "besuche",
  "besuchen",
  "besucht",
  "brauche",
  "brauchen",
  "braucht",
  "empfange",
  "empfangen",
  "empfängt",
  "finde",
  "finden",
  "findet",
  "frage",
  "fragen",
  "fragt",
  "kenne",
  "kennen",
  "kennt",
  "rufe",
  "rufen",
  "ruft",
  "sehe",
  "sehen",
  "sieht",
  "suche",
  "suchen",
  "sucht",
  "treffe",
  "treffen",
  "trifft",
  "unterstütze",
  "unterstützen",
  "unterstützt",
  "vertrete",
  "vertreten",
  "vertritt",
  "wähle",
  "wählen",
  "wählt"
].join("|");
const accusativeVerbPattern = lazyPattern(
  String.raw`(?<![\p{L}\p{M}])((?:ich|du|er|sie|es|man|wir|ihr|Sie|jemand|niemand)\s+(?:${accusativeVerbContext})|es\s+gibt)(\s+)(${mapAlternation(accusativeFeminineDeterminers)})(\s+)(${nounBase})In(?![\p{L}\p{M}])`,
  "giu"
);
const predicateNominativePattern = lazyPattern(
  String.raw`(?<![\p{L}\p{M}])((?:das|dies|er|sie|es|wer)\s+(?:ist|war|wird|bleibt))(\s+)(${mapAlternation(nominativeFeminineDeterminers)})(\s+)(${nounBase})In(?![\p{L}\p{M}])`,
  "giu"
);

function hatSichtbaresBinnenI(text: string): boolean {
  // Das Binnen-I muss im Original groß sein; das i-Flag der Kontextsuche
  // darf normale Feminina wie "Studentin" nicht umdeuten.
  return /In(?:\s*[.!?])?$/u.test(text);
}

function applyTokenCase(source: string, replacement: string): string {
  const inner = preserveInnerCase(source, replacement);
  if (inner !== undefined) return inner;
  const letters = source.replace(/[^\p{L}\p{M}]/gu, "");
  const lowerLetters = letters.toLocaleLowerCase(locale);
  const upperLetters = letters.toLocaleUpperCase(locale);

  if (letters === upperLetters && letters !== lowerLetters) {
    return replacement.toLocaleUpperCase(locale);
  }

  const firstLetter = [...letters][0];
  if (firstLetter && firstLetter === firstLetter.toLocaleUpperCase(locale)) {
    const replacementCharacters = [...replacement];
    const firstReplacementCharacter = replacementCharacters.shift();

    return firstReplacementCharacter
      ? firstReplacementCharacter.toLocaleUpperCase(locale) +
          replacementCharacters.join("")
      : replacement;
  }

  return replacement;
}

export function mapSingular(
  base: string,
  grammaticalCase: GrammaticalCase
): string | undefined {
  return (
    mapMappedSingular(base, grammaticalCase) ??
    mapKnownSingular(base, grammaticalCase) ??
    (grammaticalCase === "genitive" ? undefined : mapKnownPlural(base)) ??
    singularFromStrongPlural(base, grammaticalCase)
  );
}

// Nouns known only to the plural or supplementary lexicon (`Operateur`,
// `Psychoanalytiker`): the case forms follow from singular and plural.
// Plural = singular or singular + -e: strong, genitive -s. Singular on -e
// with plural -n: weak, -n in every oblique case. Otherwise only the
// nominative (`Professoren` is strong, `Assistenten` weak).
function singularFromStrongPlural(
  base: string,
  grammaticalCase: GrammaticalCase
): string | undefined {
  const singular = mapSupplementalSingular(base) ??
    (mapMappedPlural(base)?.toLocaleLowerCase(locale) === base.toLocaleLowerCase(locale) ||
      mapMappedPlural(base)?.toLocaleLowerCase(locale) === `${base.toLocaleLowerCase(locale)}e`
      ? base : undefined);
  if (!singular) return undefined;
  if (grammaticalCase === "nominative") return singular;
  const plural = (mapSupplementalPlural(base) ?? mapMappedPlural(base))?.toLocaleLowerCase(locale);
  const lowerSingular = singular.toLocaleLowerCase(locale);
  if (plural === lowerSingular || plural === `${lowerSingular}e`) {
    return grammaticalCase === "genitive" ? `${singular}s` : singular;
  }
  if (lowerSingular.endsWith("e") && plural === `${lowerSingular}n`) return `${singular}n`;
  return undefined;
}

// `der / die Nutzer*in`, `der/ die …`, `eine oder einen Mitarbeiter*in`:
// a pair with spaces around the slash or a written `oder`. Only the
// determiner table decides; `der / die Variablenbeschreibung` has no
// marked noun and is never touched.
const pairSpace = String.raw`[   ]`;
const spacedPairSingularPattern = lazyPattern(
  String.raw`(?<![\p{L}\p{M}])([\p{L}\p{M}]+)(${pairSpace}*[\/*:]${pairSpace}*|${pairSpace}+oder${pairSpace}+)([\p{L}\p{M}]+)(\s+)(${nounBase})(?:(?:\/-?)|[:*_·•.’‘])in(?![\p{L}\p{M}])`,
  "giu"
);

// Contracted and written-out preposition in one pair: `vom:von der
// Arbeitgeber:in`, `von der/vom …`, `beim*bei der …`, `zum/zu der …`. Before,
// only the noun changed (`vom:von der Arbeitgeber`).
const contractedPrepositions = new Map([["vom", "von"], ["beim", "bei"], ["zum", "zu"]]);
const contractedPairSingularPattern = lazyPattern(
  String.raw`(?<![\p{L}\p{M}])(vom|beim|zum|von der|bei der|zu der)[   ]*[:*\/·][   ]*(vom|beim|zum|von der|bei der|zu der)(\s+${weakAdjectives})(${nounBase})(?:(?:\/-?)|[:*_·•’‘])in(?![\p{L}\p{M}_-])`,
  "giu"
);

function transformContractedPairs(input: string): TransformResult {
  if (!/(?:vom|beim|zum)[   ]*[:*\/·]|der[   ]*[:*\/·][   ]*(?:vom|beim|zum)/iu.test(input)) {
    return {text: input, replacements: 0};
  }
  let replacements = 0;
  const text = input.replace(
    contractedPairSingularPattern(),
    (match: string, left: string, right: string, adjectives: string, base: string) => {
      const [contracted, written] = contractedPrepositions.has(left.toLocaleLowerCase(locale))
        ? [left, right] : [right, left];
      const preposition = contractedPrepositions.get(contracted.toLocaleLowerCase(locale));
      if (!preposition || written.toLocaleLowerCase(locale) !== `${preposition} der`) return match;
      if (!hasLowercaseAdjectives(adjectives)) return match;
      const noun = mapSingular(base, "dative");
      if (!noun) return match;
      replacements += 1;
      return applyTokenCase(left, contracted.toLocaleLowerCase(locale)) + adjectives + noun;
    }
  );
  return {text, replacements};
}

function transformSpacedPairs(input: string): TransformResult {
  if (!/[   ][\/*:]|[\/*:][   ]|\soder\s/iu.test(input)) {
    return {text: input, replacements: 0};
  }
  let replacements = 0;
  const text = input.replace(
    spacedPairSingularPattern(),
    (match: string, left: string, separator: string, right: string, whitespace: string, base: string) => {
      // Compact pairs (`der/die`, `der*die`) belong to the other pair rules.
      if (/^[\/*:]$/u.test(separator)) return match;
      const form = determinerForms.get(`${left}/${right}`.toLocaleLowerCase(locale));
      const noun = form ? mapSingular(base, form.grammaticalCase) : undefined;
      if (!form || !noun) return match;
      replacements += 1;
      return applyTokenCase(left, form.masculine) + whitespace + noun;
    }
  );
  return {text, replacements};
}

// `Medizinische*r Technolog*in`, `engagierte/r Mitarbeiter:in` without a
// determiner: the `e/r` adjective marks the strong nominative. Before, only
// the noun changed (`Medizinische*r Technologe`).
const bareMarkedAdjectivePattern = lazyPattern(
  String.raw`(?<![\p{L}\p{M}:*_/·•.’‘-])(${nounBase}e)(?:[:*_·•]|\/-?)r(\s+)(${nounBase})(?:(?:\/-?)|[:*_·•.’‘])in(?![\p{L}\p{M}])`,
  "giu"
);
// `eine*r`, `deine:r`, `jede/r` are determiners, not adjectives; their case
// is not fixed by the ending (`je eine:r`, `mit deine*r`).
const markedDeterminerStems = new Set([
  "de", "eine", "keine", "meine", "deine", "seine", "ihre", "unsere", "eure",
  "jede", "diese", "jene", "welche", "manche", "solche"
]);
// After a preposition or a marked word the case is not the nominative:
// `zur/zum Anästhesietechnische*r …`, `mit jede:r andere:r …`.
const nonNominativeBefore = new Set([
  "zum", "zur", "im", "am", "beim", "vom", "ins", "ans", "aufs",
  "mit", "bei", "von", "zu", "aus", "nach", "seit", "für", "durch", "gegen",
  "ohne", "um", "an", "auf", "in", "über", "unter", "vor", "hinter", "neben",
  "zwischen", "wegen", "trotz", "während", "statt"
]);
const determinerWords = new Set([
  ...ordinaryMasculineDeterminers.keys(),
  ...nominativeFeminineDeterminers.keys(),
  ...dativeFeminineDeterminers.keys(),
  "das", "die"
]);

function mapNominativeSingular(base: string): string | undefined {
  // `Technologe/in`: the marker follows the full masculine form.
  return mapSingular(base, "nominative") ??
    (base.endsWith("e") &&
      mapSingular(base.slice(0, -1), "nominative")?.toLocaleLowerCase(locale) ===
        base.toLocaleLowerCase(locale)
      ? base
      : undefined);
}

function transformBareMarkedAdjectives(input: string): TransformResult {
  if (!/e(?:[:*_·•]|\/-?)r\s/iu.test(input)) return {text: input, replacements: 0};
  let replacements = 0;
  const text = input.replace(
    bareMarkedAdjectivePattern(),
    (match: string, adjective: string, whitespace: string, base: string, offset: number, source: string) => {
      if (markedDeterminerStems.has(adjective.toLocaleLowerCase(locale))) return match;
      const previous = /(\S+)\s+$/u.exec(source.slice(Math.max(0, offset - 32), offset))?.[1]
        ?.toLocaleLowerCase(locale);
      if (
        previous &&
        (determinerWords.has(previous) || nonNominativeBefore.has(previous) ||
          /[\p{L}\p{M}][:*_\/·•]/u.test(previous))
      ) {
        return match;
      }
      const noun = mapNominativeSingular(base);
      if (!noun) return match;
      replacements += 1;
      return `${adjective}r${whitespace}${noun}`;
    }
  );
  return {text, replacements};
}

function transformPattern(input: string, pattern: RegExp): TransformResult {
  let replacements = 0;

  const text = input.replace(
    pattern,
    (
      match: string,
      determiner: string,
      whitespace: string,
      base: string
    ) => {
      if (pattern === binnenISingularPattern() && !hatSichtbaresBinnenI(match)) return match;
      const normalizedDeterminer = determiner
        .toLocaleLowerCase(locale)
        .replaceAll("/-", "/");
      const determinerForm = determinerForms.get(normalizedDeterminer);

      if (!determinerForm) {
        return match;
      }

      const noun = mapSingular(base, determinerForm.grammaticalCase);
      if (!noun) {
        return match;
      }

      replacements += 1;
      return (
        applyTokenCase(determiner, determinerForm.masculine) +
        whitespace +
        noun
      );
    }
  );

  return { text, replacements };
}

const strongNominativeDeterminers = new Set([
  "ein",
  "kein",
  "mein",
  "dein",
  "sein",
  "ihr",
  "unser",
  "euer"
]);

function expectedAdjectiveEnding(
  form: DeterminerForm
): "e" | "en" | "er" {
  if (form.grammaticalCase !== "nominative") {
    return "en";
  }

  return strongNominativeDeterminers.has(form.masculine) ? "er" : "e";
}

function mapAttributiveAdjective(
  adjective: string,
  markerEnding: string | undefined,
  expectedEnding: "e" | "en" | "er"
): string | undefined {
  const normalized = adjective.toLocaleLowerCase(locale);

  if (!markerEnding) {
    return normalized.endsWith(expectedEnding) ? adjective : undefined;
  }

  const normalizedMarkerEnding = markerEnding.toLocaleLowerCase(locale);
  const expectedMarkerEnding = expectedEnding === "er" ? "r" : "n";
  if (
    expectedEnding === "e" ||
    normalizedMarkerEnding !== expectedMarkerEnding ||
    !normalized.endsWith("e")
  ) {
    return undefined;
  }

  return applyTokenCase(adjective, normalized + expectedMarkerEnding);
}

function transformAttributivePhrases(
  input: string,
  pattern: RegExp
): TransformResult {
  let replacements = 0;
  const text = input.replace(
    pattern,
    (
      match: string,
      determiner: string,
      firstWhitespace: string,
      modifiers: string,
      adjective: string,
      _marker: string | undefined,
      markerEnding: string | undefined,
      secondWhitespace: string,
      base: string
    ) => {
      if (pattern === attributiveBinnenISingularPattern() && !hatSichtbaresBinnenI(match)) return match;
      const form = determinerForms.get(determiner.toLocaleLowerCase(locale));
      if (!form) {
        return match;
      }
      const mappedAdjective = mapAttributiveAdjective(
        adjective,
        markerEnding,
        expectedAdjectiveEnding(form)
      );
      // A capitalized unmarked word is inflected only with a German adjective
      // suffix (`Wissenschaftliche`); `eine:n Office Manager:in` has an English
      // noun there. Left unchanged (`der Performance Künstler*in`) it may stay.
      if (!markerEnding && /^\p{Lu}/u.test(adjective) && mappedAdjective !== adjective &&
          !/(?:isch|lich|ig|ell|al|iv|end|ert|iert|bar|sam|haft|los|ner|ter|sch)(?:e|en|er|es|em)?$/u.test(adjective)) {
        return match;
      }
      const noun = mapSingular(base, form.grammaticalCase);
      if (!mappedAdjective || !noun) {
        return match;
      }

      replacements += 1;
      return (
        applyTokenCase(determiner, form.masculine) +
        firstWhitespace +
        modifiers +
        mappedAdjective +
        secondWhitespace +
        noun
      );
    }
  );

  return { text, replacements };
}

function transformObliqueSeparatorSingulars(input: string): TransformResult {
  let replacements = 0;
  const text = input.replace(
    ordinaryObliqueSeparatorPattern(),
    (match: string, determiner: string, adjectives: string, base: string) => {
      if (!hasLowercaseAdjectives(adjectives)) return match;
      const form = ordinaryMasculineDeterminers.get(
        determiner.toLocaleLowerCase(locale)
      );
      const noun = form ? mapSingular(base, form.grammaticalCase) : undefined;
      if (!noun) {
        return match;
      }
      replacements += 1;
      return determiner + adjectives + noun;
    }
  );
  return { text, replacements };
}

// A lowercase `der` before a marked singular after a noun or a dative
// preposition is feminine genitive/dative: `Publikationen der Expert*in`
// -> `Publikationen des Experten`, `mit der neuen Kolleg*in` -> `mit dem
// neuen Kollegen` (before: `der Experte`, `der neuen Kollege`). Not inside a
// compound (`der Therapeut:in-Arzt-Beziehung`), not as the second half of a
// pair (`beim:bei der …`) and not before a coordinated marked noun.
const feminineDerSingularPattern = lazyPattern(
  String.raw`(?<![\p{L}\p{M}:*_\/·•.’‘-])([\p{L}\p{M}][\p{L}\p{M}-]*(?:(?:\/-?|[:*_·•’‘])[rn])?)([ \t ]+)(der|einer|meiner|deiner|seiner|ihrer|Ihrer|unserer|eurer|keiner)(\s+${weakAdjectives})(${nounBase})(?:(?:\/-?|[:*_·•’‘])in|\(-?in\)|(?<=\p{Ll})In)(?![\p{L}\p{M}_-])(?!\s+(?:und|oder|bzw\.|sowie)\s+[\p{L}\p{M}’'-]+(?:(?:\/-?|[:*_·•’‘])in|\(-?in\)|\p{Ll}In)(?![\p{L}\p{M}]))`,
  "gu"
);
const dativePrepositionSet = new Set(dativePrepositions.split("|"));
// Capitalized at the start of a sentence, these are no nouns: `Viele der
// Ehrenamtler*innen` is partitive, `In der …` a two-way preposition.
const nonNounWordsBeforeDer = new Set([
  "alle", "beide", "einige", "manche", "mehrere", "viele", "wenige", "jede",
  "jeder", "keine", "keiner", "eine", "einer", "die", "das", "den", "dem",
  "des", "in", "an", "auf", "unter", "über", "vor", "hinter", "neben",
  "zwischen", "für", "durch", "gegen", "ohne", "um", "als", "wie", "und",
  "oder", "aber", "auch", "nur", "noch", "so", "da", "wo", "wenn", "weil",
  "dass", "ob", "während", "wegen", "trotz", "statt", "anstatt",
  // Pronouns before a dative object: `Geben Sie der Ärzt*in Bescheid`.
  "sie", "ich", "er", "es", "wir", "ihr", "man", "ihnen", "uns", "euch", "mir", "dir", "ihm"
]);
// `Laut der Ärzt*in` → „Laut dem Arzt“, not the genitive; `Wir danken der
// Patient*in` → „dem Patienten“: verbs with a dative object, not the
// nominative.
const dativeWordsBeforeDer = new Set(["laut", "dank", "entgegen", "gemäß", "entsprechend",
  ...["dank", "helf", "gratulier", "folg", "begegn", "vertrau", "antwort", "widersprech", "zuhör",
    "zustimm", "assistier", "dien", "misstrau", "kündig", "schad", "nütz"].flatMap((stem) =>
    ["e", "st", "t", "en", "et", "te", "ten", "test"].map((ending) => stem + ending)),
  "hilft", "hilfst", "half", "halfen", "widerspricht", "widersprichst", "widersprach", "widersprachen"]);

// A verb or participle that takes the dative right after the phrase makes
// `der` a dative object: `(dass die) Umsetzung der Antragsteller:in
// obliegt` → „Umsetzung dem Antragsteller obliegt“, not the genitive.
const dativeGoverningAfter = /^[ \t\u00a0]+(?:obliegt|obliegen|oblag|oblagen|zusteht|zustehen|zustand|zukommt|zukommen|zufällt|zufallen|untersteht|unterstehen|unterstellt|vorbehalten|überlassen|übertragen|zugeordnet|gehört|gehören|gebührt|gebühren)(?![p{L}p{M}])/u;

function transformFeminineDerSingulars(input: string): TransformResult {
  let replacements = 0;
  const text = input.replace(
    feminineDerSingularPattern(),
    (match: string, previous: string, space: string, article: string, adjectives: string, base: string,
      offset: number, source: string) => {
      if (!hasLowercaseAdjectives(adjectives)) return match;
      // `der` → d-, `einer` → ein-, `ihrer` → ihr- (`Institution ihrer
      // externen Betreuer*in` → „ihres externen Betreuers“).
      const stem = article.slice(0, -2);
      const lowerPrevious = previous.toLocaleLowerCase(locale);
      const grammaticalCase: GrammaticalCase | undefined =
        dativePrepositionSet.has(lowerPrevious) || dativeWordsBeforeDer.has(lowerPrevious) ||
          dativeGoverningAfter.test(source.slice(offset + match.length, offset + match.length + 40))
          ? "dative"
          : previous !== lowerPrevious && !nonNounWordsBeforeDer.has(lowerPrevious) &&
              !finiteVerbsBeforeDer.has(lowerPrevious)
            ? "genitive"
            : undefined;
      if (!grammaticalCase) return match;
      const noun = mapSingular(base, grammaticalCase);
      if (!noun) return match;
      replacements += 1;
      return previous + space + stem + (grammaticalCase === "dative" ? "em" : "es") +
        adjectives + noun;
    }
  );
  return { text, replacements };
}

function transformOrdinaryMasculineDeterminers(input: string): TransformResult {
  let replacements = 0;
  const text = input.replace(
    ordinaryBinnenIPattern(),
    (match: string, determiner: string, whitespace: string, base: string) => {
      if (!hatSichtbaresBinnenI(match)) return match;
      const form = ordinaryMasculineDeterminers.get(
        determiner.toLocaleLowerCase(locale)
      );
      if (!form) {
        return match;
      }
      const noun = mapSingular(base, form.grammaticalCase);
      if (!noun) {
        return match;
      }
      replacements += 1;
      return determiner + whitespace + noun;
    }
  );
  return { text, replacements };
}

function transformPrepositionalFeminine(
  input: string,
  pattern: RegExp,
  determinerMap: ReadonlyMap<string, string>,
  grammaticalCase: GrammaticalCase,
  binnenI = true
): TransformResult {
  let replacements = 0;
  const text = input.replace(
    pattern,
    (
      match: string,
      preposition: string,
      firstWhitespace: string,
      determiner: string,
      secondWhitespace: string,
      base: string
    ) => {
      if (binnenI && !hatSichtbaresBinnenI(match)) return match;
      const masculineDeterminer = determinerMap.get(
        determiner.toLocaleLowerCase(locale)
      );
      const noun = mapSingular(base, grammaticalCase);
      if (!masculineDeterminer || !noun) {
        return match;
      }
      replacements += 1;
      return (
        preposition +
        firstWhitespace +
        applyTokenCase(determiner, masculineDeterminer) +
        secondWhitespace +
        noun
      );
    }
  );
  return { text, replacements };
}

function transformCoordinatedPrepositional(
  input: string,
  pattern: RegExp,
  determinerMap: ReadonlyMap<string, string>,
  grammaticalCase: GrammaticalCase
): TransformResult {
  let replacements = 0;
  const text = input.replace(
    pattern,
    (
      match: string,
      preposition: string,
      firstWhitespace: string,
      determiner: string,
      secondWhitespace: string,
      firstBase: string,
      coordinator: string,
      secondDeterminer: string | undefined,
      thirdWhitespace: string | undefined,
      secondBase: string
    ) => {
      const masculineDeterminer = determinerMap.get(determiner.toLocaleLowerCase(locale));
      const secondMasculine = secondDeterminer === undefined
        ? "" : determinerMap.get(secondDeterminer.toLocaleLowerCase(locale));
      const first = mapSingular(firstBase, grammaticalCase);
      const second = mapSingular(secondBase, grammaticalCase);
      if (!masculineDeterminer || secondMasculine === undefined || !first || !second) {
        return match;
      }
      replacements += 2;
      return preposition + firstWhitespace +
        applyTokenCase(determiner, masculineDeterminer) + secondWhitespace + first +
        coordinator +
        (secondDeterminer === undefined
          ? "" : applyTokenCase(secondDeterminer, secondMasculine) + thirdWhitespace) +
        second;
    }
  );
  return { text, replacements };
}

function transformContractedZur(input: string, pattern: RegExp): TransformResult {
  let replacements = 0;
  const text = input.replace(
    pattern,
    (match: string, zur: string, whitespace: string, attributes: string, base: string) => {
      const noun = mapSingular(base, "dative");
      if (!noun) return match;
      replacements += 1;
      // `zur` becomes `zum`; `zum`, `vom`, `beim` already are dative masculine.
      // Attributes after them already carry the dative -en.
      const contracted = zur.toLocaleLowerCase(locale) === "zur" ? applyTokenCase(zur, "zum") : zur;
      return contracted + whitespace + attributes + noun;
    }
  );
  return { text, replacements };
}

// Prepositional separator singulars run before the general separator rule,
// which would otherwise keep the feminine determiner (`mit der Lehrer`).
function transformPrepositionalSeparatorSingulars(input: string): TransformResult {
  let text = input;
  let replacements = 0;
  for (const result of [
    (value: string) => transformCoordinatedPrepositional(value, accusativeCoordinatedPattern(), accusativeFeminineDeterminers, "accusative"),
    (value: string) => transformCoordinatedPrepositional(value, dativeCoordinatedPattern(), dativeFeminineDeterminers, "dative"),
    (value: string) => transformCoordinatedPrepositional(value, genitiveCoordinatedPattern(), genitiveFeminineDeterminers, "genitive"),
    (value: string) => transformPrepositionalFeminine(value, accusativeFeminineSeparatorPattern(), accusativeFeminineDeterminers, "accusative", false),
    (value: string) => transformPrepositionalFeminine(value, dativeFeminineSeparatorPattern(), dativeFeminineDeterminers, "dative", false),
    (value: string) => transformPrepositionalFeminine(value, genitiveFeminineSeparatorPattern(), genitiveFeminineDeterminers, "genitive", false),
    (value: string) => transformContractedZur(value, contractedZurSeparatorPattern()),
    (value: string) => transformContractedZur(value, contractedZurBinnenIPattern())
  ]) {
    const next = result(text);
    text = next.text;
    replacements += next.replacements;
  }
  return { text, replacements };
}

function transformNominativeSentence(input: string): TransformResult {
  let replacements = 0;
  const text = input.replace(
    nominativeSentencePattern(),
    (
      match: string,
      prefix: string,
      determiner: string,
      whitespace: string,
      base: string
    ) => {
      if (!hatSichtbaresBinnenI(match)) return match;
      const masculineDeterminer = nominativeFeminineDeterminers.get(
        determiner.toLocaleLowerCase(locale)
      );
      const noun = mapSingular(base, "nominative");
      if (!masculineDeterminer || !noun) {
        return match;
      }
      replacements += 1;
      return (
        prefix +
        applyTokenCase(determiner, masculineDeterminer) +
        whitespace +
        noun
      );
    }
  );
  return { text, replacements };
}

function transformStandaloneNominative(input: string): TransformResult {
  let replacements = 0;
  const text = input.replace(
    standaloneNominativePattern(),
    (
      match: string,
      leadingWhitespace: string,
      determiner: string,
      whitespace: string,
      base: string,
      punctuation: string
    ) => {
      if (!hatSichtbaresBinnenI(match)) return match;
      const masculineDeterminer = nominativeFeminineDeterminers.get(
        determiner.toLocaleLowerCase(locale)
      );
      const noun = mapSingular(base, "nominative");
      if (!masculineDeterminer || !noun) {
        return match;
      }
      replacements += 1;
      return (
        leadingWhitespace +
        applyTokenCase(determiner, masculineDeterminer) +
        whitespace +
        noun +
        punctuation
      );
    }
  );
  return { text, replacements };
}

function transformVerbContext(
  input: string,
  pattern: RegExp,
  determinerMap: ReadonlyMap<string, string>,
  grammaticalCase: GrammaticalCase
): TransformResult {
  let replacements = 0;
  const text = input.replace(
    pattern,
    (
      match: string,
      prefix: string,
      firstWhitespace: string,
      determiner: string,
      secondWhitespace: string,
      base: string
    ) => {
      if (!hatSichtbaresBinnenI(match)) return match;
      const masculineDeterminer = determinerMap.get(
        determiner.toLocaleLowerCase(locale)
      );
      const noun = mapSingular(base, grammaticalCase);
      if (!masculineDeterminer || !noun) {
        return match;
      }
      replacements += 1;
      return (
        prefix +
        firstWhitespace +
        applyTokenCase(determiner, masculineDeterminer) +
        secondWhitespace +
        noun
      );
    }
  );
  return { text, replacements };
}

export const singularContextRule: Rule = withLeadingContextRule(withRelativeAgreementRule({
  id: "singular.explicit-context",
  risk: "safe",

  apply(input) {
    if (!/in(?![a-z])/iu.test(input)) return {text: input, replacements: 0};
    if (!singularEndingCandidate.test(input)) return {text: input, replacements: 0};
    const pairResult0 = normalizeDeterminerPairs(input, mapSingular);
    const compactResult = normalizeCompactDeterminers(pairResult0.text, mapSingular);
    const clauseResult = transformClauseCase(compactResult.text, mapSingular);
    const pairResult = {
      text: clauseResult.text,
      replacements: pairResult0.replacements + compactResult.replacements + clauseResult.replacements
    };
    const contractedPairResult = transformContractedPairs(pairResult.text);
    const spacedPairResult0 = transformSpacedPairs(contractedPairResult.text);
    const spacedPairResult = {
      text: spacedPairResult0.text,
      replacements: pairResult.replacements + contractedPairResult.replacements +
        spacedPairResult0.replacements
    };
    const prepositionalSeparatorResult = transformPrepositionalSeparatorSingulars(
      spacedPairResult.text
    );
    const feminineDerResult = transformFeminineDerSingulars(
      prepositionalSeparatorResult.text
    );
    const attributiveSeparatorResult = transformAttributivePhrases(
      feminineDerResult.text,
      attributiveSeparatorSingularPattern()
    );
    const bareAdjectiveResult = transformBareMarkedAdjectives(
      attributiveSeparatorResult.text
    );
    const attributiveBinnenIResult = transformAttributivePhrases(
      bareAdjectiveResult.text,
      attributiveBinnenISingularPattern()
    );
    const separatorResult = transformPattern(
      attributiveBinnenIResult.text,
      separatorSingularPattern()
    );
    const markedBinnenIResult = transformPattern(
      separatorResult.text,
      binnenISingularPattern()
    );
    const accusativeResult = transformPrepositionalFeminine(
      markedBinnenIResult.text,
      accusativeFemininePattern(),
      accusativeFeminineDeterminers,
      "accusative"
    );
    const dativeResult = transformPrepositionalFeminine(
      accusativeResult.text,
      dativeFemininePattern(),
      dativeFeminineDeterminers,
      "dative"
    );
    const genitiveResult = transformPrepositionalFeminine(
      dativeResult.text,
      genitiveFemininePattern(),
      genitiveFeminineDeterminers,
      "genitive"
    );
    const accusativeVerbResult = transformVerbContext(
      genitiveResult.text,
      accusativeVerbPattern(),
      accusativeFeminineDeterminers,
      "accusative"
    );
    const predicateResult = transformVerbContext(
      accusativeVerbResult.text,
      predicateNominativePattern(),
      nominativeFeminineDeterminers,
      "nominative"
    );
    const nominativeResult = transformNominativeSentence(predicateResult.text);
    const standaloneResult = transformStandaloneNominative(nominativeResult.text);
    const ordinaryResult = transformOrdinaryMasculineDeterminers(
      standaloneResult.text
    );
    const obliqueResult = transformObliqueSeparatorSingulars(ordinaryResult.text);

    return {
      text: obliqueResult.text,
      replacements:
        spacedPairResult.replacements +
        prepositionalSeparatorResult.replacements +
        feminineDerResult.replacements +
        attributiveSeparatorResult.replacements +
        bareAdjectiveResult.replacements +
        attributiveBinnenIResult.replacements +
        separatorResult.replacements +
        markedBinnenIResult.replacements +
        accusativeResult.replacements +
        dativeResult.replacements +
        genitiveResult.replacements +
        accusativeVerbResult.replacements +
        predicateResult.replacements +
        nominativeResult.replacements +
        standaloneResult.replacements +
        ordinaryResult.replacements +
        obliqueResult.replacements
    };
  }
}));
