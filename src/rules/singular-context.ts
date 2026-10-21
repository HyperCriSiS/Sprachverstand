import type { Rule, TransformResult } from "../core/rule";
import {lazyPattern} from "../core/lazy-pattern";
import {
  mapKnownPlural,
  mapKnownSingular
} from "./known-plural-separators";
import {
  mapMappedSingular,
  type GrammaticalCase
} from "./person-lexicon";

interface DeterminerForm {
  readonly masculine: string;
  readonly grammaticalCase: GrammaticalCase;
}

const locale = "de-DE";
// Every pattern below requires a singular in/In ending at a word boundary.
// Plural markers and neutral texts need none of the twelve context scans.
const singularEndingCandidate = /in(?![\p{L}\p{M}])/iu;
const separators = [":", "*", "_", "/", "·", "•", ".", "’", "‘"] as const;
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

function hasLowercaseAdjectives(adjectives: string): boolean {
  return adjectives.split(/\s+/u).every(word =>
    word === "" || word === word.toLocaleLowerCase(locale));
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
const dativePrepositions = "aus|außer|bei|gegenüber|mit|nach|seit|von|zu";
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
const accusativeFeminineSeparatorPattern = prepositionalSeparatorPattern(accusativePrepositions, accusativeFeminineDeterminers);
const dativeFeminineSeparatorPattern = prepositionalSeparatorPattern(dativePrepositions, dativeFeminineDeterminers);
const genitiveFeminineSeparatorPattern = prepositionalSeparatorPattern(genitivePrepositions, genitiveFeminineDeterminers);
// `zur` is `zu der`: `zur Erzieher*in` / `zur ErzieherIn` -> `zum Erzieher`
// (before: `zur Erzieher`). Pairs like `zum/zur` stay with the pair rules.
const contractedZurSeparatorPattern = lazyPattern(
  String.raw`${notAfterPairSeparator}([Zz]ur)(\s+)(${nounBase})(?:${separatorSingularMarker})${singularPhraseEnd}`,
  "gu"
);
const contractedZurBinnenIPattern = lazyPattern(
  String.raw`${notAfterPairSeparator}([Zz]ur)(\s+)(${nounBase}\p{Ll})In${singularPhraseEnd}`,
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

function mapSingular(
  base: string,
  grammaticalCase: GrammaticalCase
): string | undefined {
  return (
    mapMappedSingular(base, grammaticalCase) ??
    mapKnownSingular(base, grammaticalCase) ??
    (grammaticalCase === "genitive" ? undefined : mapKnownPlural(base))
  );
}

// `der / die Nutzer*in`, `der/ die …`, `eine oder einen Mitarbeiter*in`:
// a pair with spaces around the slash or a written `oder`. Only the
// determiner table decides; `der / die Variablenbeschreibung` has no
// marked noun and is never touched.
const pairSpace = String.raw`[   ]`;
const spacedPairSingularPattern = lazyPattern(
  String.raw`(?<![\p{L}\p{M}])([\p{L}\p{M}]+)(${pairSpace}*\/${pairSpace}*|${pairSpace}+oder${pairSpace}+)([\p{L}\p{M}]+)(\s+)(${nounBase})(?:(?:\/-?)|[:*_·•.’‘])in(?![\p{L}\p{M}])`,
  "giu"
);

function transformSpacedPairs(input: string): TransformResult {
  if (!/[   ]\/|\/[   ]|\soder\s/iu.test(input)) {
    return {text: input, replacements: 0};
  }
  let replacements = 0;
  const text = input.replace(
    spacedPairSingularPattern(),
    (match: string, left: string, separator: string, right: string, whitespace: string, base: string) => {
      if (separator === "/") return match;
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

function transformContractedZur(input: string, pattern: RegExp): TransformResult {
  let replacements = 0;
  const text = input.replace(
    pattern,
    (match: string, zur: string, whitespace: string, base: string) => {
      const noun = mapSingular(base, "dative");
      if (!noun) return match;
      replacements += 1;
      return applyTokenCase(zur, "zum") + whitespace + noun;
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

export const singularContextRule: Rule = {
  id: "singular.explicit-context",
  risk: "safe",

  apply(input) {
    if (!/in(?![a-z])/iu.test(input)) return {text: input, replacements: 0};
    if (!singularEndingCandidate.test(input)) return {text: input, replacements: 0};
    const spacedPairResult = transformSpacedPairs(input);
    const prepositionalSeparatorResult = transformPrepositionalSeparatorSingulars(
      spacedPairResult.text
    );
    const attributiveSeparatorResult = transformAttributivePhrases(
      prepositionalSeparatorResult.text,
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
};
