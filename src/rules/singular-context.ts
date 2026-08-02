import type { Rule, TransformResult } from "../core/rule";
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

addDeterminer("sein", "ihr", "sein", "nominative", true);
addDeterminer("seinen", "ihren", "seinen", "accusative", true);
addDeterminer("seinem", "ihrem", "seinem", "dative", true);
addDeterminer("seines", "ihres", "seines", "genitive", true);

const determinerToken = String.raw`[\p{L}\p{M}:*_/·•.’‘-]+`;
const nounBase = String.raw`[\p{L}\p{M}’'-]+`;
const separatorSingularPattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}])(${determinerToken})(\s+)(${nounBase})(?:(?:\/-?)|[:*_·•.’‘])in(?![\p{L}\p{M}])`,
  "giu"
);
const binnenISingularPattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}])(${determinerToken})(\s+)(${nounBase})In(?![\p{L}\p{M}])`,
  "gu"
);
const adjectiveModifiers = String.raw`(?:${nounBase}\s+){0,2}`;
const adjectiveMarker = String.raw`[:*_\/·•.’‘]`;
const attributiveSeparatorSingularPattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}])(${determinerToken})(\s+)(${adjectiveModifiers})(${nounBase})(?:(${adjectiveMarker})([rnms]))?(\s+)(${nounBase})(?:(?:\/-?)|[:*_·•.’‘])in(?![\p{L}\p{M}])`,
  "giu"
);
const attributiveBinnenISingularPattern = new RegExp(
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
const ordinaryBinnenIPattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}])(${ordinaryDeterminerAlternation})(\s+)(${nounBase})In(?![\p{L}\p{M}])`,
  "giu"
);

function mapAlternation(values: ReadonlyMap<string, string>): string {
  return [...values.keys()].sort((left, right) => right.length - left.length).join("|");
}

const accusativePrepositions = "für|durch|gegen|ohne|um";
const dativePrepositions = "aus|außer|bei|gegenüber|mit|nach|seit|von|zu";
const genitivePrepositions = "anstatt|außerhalb|innerhalb|statt|trotz|während|wegen";
const accusativeFemininePattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}])(${accusativePrepositions})(\s+)(${mapAlternation(accusativeFeminineDeterminers)})(\s+)(${nounBase})In(?![\p{L}\p{M}])`,
  "giu"
);
const dativeFemininePattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}])(${dativePrepositions})(\s+)(${mapAlternation(dativeFeminineDeterminers)})(\s+)(${nounBase})In(?![\p{L}\p{M}])`,
  "giu"
);
const genitiveFemininePattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}])(${genitivePrepositions})(\s+)(${mapAlternation(genitiveFeminineDeterminers)})(\s+)(${nounBase})In(?![\p{L}\p{M}])`,
  "giu"
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
const nominativeSentencePattern = new RegExp(
  String.raw`(^|[.!?]\s+|[;:]\s+)(${mapAlternation(nominativeFeminineDeterminers)})(\s+)(${nounBase})In(?=\s+(?:${commonFiniteVerbs})\b)`,
  "giu"
);
const standaloneNominativePattern = new RegExp(
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
const accusativeVerbPattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}])((?:ich|du|er|sie|es|man|wir|ihr|Sie|jemand|niemand)\s+(?:${accusativeVerbContext})|es\s+gibt)(\s+)(${mapAlternation(accusativeFeminineDeterminers)})(\s+)(${nounBase})In(?![\p{L}\p{M}])`,
  "giu"
);
const predicateNominativePattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}])((?:das|dies|er|sie|es|wer)\s+(?:ist|war|wird|bleibt))(\s+)(${mapAlternation(nominativeFeminineDeterminers)})(\s+)(${nounBase})In(?![\p{L}\p{M}])`,
  "giu"
);

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

function transformOrdinaryMasculineDeterminers(input: string): TransformResult {
  let replacements = 0;
  const text = input.replace(
    ordinaryBinnenIPattern,
    (match: string, determiner: string, whitespace: string, base: string) => {
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
      base: string
    ) => {
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

function transformNominativeSentence(input: string): TransformResult {
  let replacements = 0;
  const text = input.replace(
    nominativeSentencePattern,
    (
      match: string,
      prefix: string,
      determiner: string,
      whitespace: string,
      base: string
    ) => {
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
    standaloneNominativePattern,
    (
      match: string,
      leadingWhitespace: string,
      determiner: string,
      whitespace: string,
      base: string,
      punctuation: string
    ) => {
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
    const attributiveSeparatorResult = transformAttributivePhrases(
      input,
      attributiveSeparatorSingularPattern
    );
    const attributiveBinnenIResult = transformAttributivePhrases(
      attributiveSeparatorResult.text,
      attributiveBinnenISingularPattern
    );
    const separatorResult = transformPattern(
      attributiveBinnenIResult.text,
      separatorSingularPattern
    );
    const markedBinnenIResult = transformPattern(
      separatorResult.text,
      binnenISingularPattern
    );
    const accusativeResult = transformPrepositionalFeminine(
      markedBinnenIResult.text,
      accusativeFemininePattern,
      accusativeFeminineDeterminers,
      "accusative"
    );
    const dativeResult = transformPrepositionalFeminine(
      accusativeResult.text,
      dativeFemininePattern,
      dativeFeminineDeterminers,
      "dative"
    );
    const genitiveResult = transformPrepositionalFeminine(
      dativeResult.text,
      genitiveFemininePattern,
      genitiveFeminineDeterminers,
      "genitive"
    );
    const accusativeVerbResult = transformVerbContext(
      genitiveResult.text,
      accusativeVerbPattern,
      accusativeFeminineDeterminers,
      "accusative"
    );
    const predicateResult = transformVerbContext(
      accusativeVerbResult.text,
      predicateNominativePattern,
      nominativeFeminineDeterminers,
      "nominative"
    );
    const nominativeResult = transformNominativeSentence(predicateResult.text);
    const standaloneResult = transformStandaloneNominative(nominativeResult.text);
    const ordinaryResult = transformOrdinaryMasculineDeterminers(
      standaloneResult.text
    );

    return {
      text: ordinaryResult.text,
      replacements:
        attributiveSeparatorResult.replacements +
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
        ordinaryResult.replacements
    };
  }
};
