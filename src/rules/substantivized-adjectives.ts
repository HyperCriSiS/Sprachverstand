import type { Rule, TransformResult } from "../core/rule";
import type { GrammaticalCase } from "./person-lexicon";

interface DeterminerForm {
  readonly masculine: string;
  readonly grammaticalCase: GrammaticalCase;
  readonly strongNominative: boolean;
  readonly markerEnding: "r" | "n";
}

const locale = "de-DE";
const separators = [":", "*", "_", "/", "·", "•", ".", "’", "‘"] as const;
const adjectiveBases = [
  "abhängige",
  "abgeordnete",
  "alleinerziehende",
  "angestellte",
  "angehörige",
  "anwesende",
  "arbeitslose",
  "arbeitsuchende",
  "asylsuchende",
  "auszubildende",
  "beauftragte",
  "behinderte",
  "bekannte",
  "beschäftigte",
  "beteiligte",
  "betroffene",
  "delegierte",
  "deutsche",
  "ehrenamtliche",
  "erkrankte",
  "erwachsene",
  "erwerbstätige",
  "erziehungsberechtigte",
  "freiberufliche",
  "freiwillige",
  "gefangene",
  "geflüchtete",
  "geschädigte",
  "hilfebedürftige",
  "interessierte",
  "jugendliche",
  "kranke",
  "leistungsberechtigte",
  "minderjährige",
  "obdachlose",
  "pflegebedürftige",
  "reisende",
  "sachverständige",
  "schutzsuchende",
  "selbstständige",
  "stimmberechtigte",
  "überlebende",
  "unterhaltsberechtigte",
  "verantwortliche",
  "verfolgte",
  "verletzte",
  "versicherte",
  "verstorbene",
  "verwandte",
  "volljährige",
  "vorgesetzte",
  "vorsitzende",
  "wahlberechtigte",
  "zugewanderte",
  "zuständige"
] as const;
const adjectiveBaseSet = new Set<string>(adjectiveBases);
const adjectiveAlternation = [...adjectiveBases]
  .sort((left, right) => right.length - left.length)
  .join("|");
const marker = String.raw`[:*_\/·•.’‘]`;
const standalonePattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}])(${adjectiveAlternation})(${marker})([rnm])(?![\p{L}\p{M}])`,
  "giu"
);
const determinerForms = new Map<string, DeterminerForm>();

function addDeterminer(
  left: string,
  right: string,
  masculine: string,
  grammaticalCase: GrammaticalCase,
  strongNominative: boolean,
  reverse = false
): void {
  for (const separator of separators) {
    determinerForms.set(`${left}${separator}${right}`, {
      masculine,
      grammaticalCase,
      strongNominative,
      markerEnding: grammaticalCase === "nominative" ? "r" : "n"
    });
    if (reverse) {
      determinerForms.set(`${right}${separator}${left}`, {
        masculine,
        grammaticalCase,
        strongNominative,
        markerEnding: grammaticalCase === "nominative" ? "r" : "n"
      });
    }
  }
}

addDeterminer("der", "die", "der", "nominative", false, true);
addDeterminer("den", "die", "den", "accusative", false, true);
addDeterminer("dem", "der", "dem", "dative", false, true);
addDeterminer("des", "der", "des", "genitive", false, true);
addDeterminer("ein", "e", "ein", "nominative", true);
addDeterminer("eine", "n", "einen", "accusative", false);
addDeterminer("einem", "einer", "einem", "dative", false);
addDeterminer("eines", "einer", "eines", "genitive", false);
addDeterminer("kein", "e", "kein", "nominative", true);
addDeterminer("keine", "n", "keinen", "accusative", false);
addDeterminer("keine", "m", "keinem", "dative", false);
addDeterminer("keines", "keiner", "keines", "genitive", false);
addDeterminer("jede", "r", "jeder", "nominative", false);
addDeterminer("jede", "n", "jeden", "accusative", false);
addDeterminer("jede", "m", "jedem", "dative", false);
addDeterminer("jedes", "jeder", "jedes", "genitive", false);
addDeterminer("welche", "r", "welcher", "nominative", false);
addDeterminer("welche", "n", "welchen", "accusative", false);
addDeterminer("welche", "m", "welchem", "dative", false);
addDeterminer("welches", "welcher", "welches", "genitive", false);
addDeterminer("diese", "r", "dieser", "nominative", false);
addDeterminer("diese", "n", "diesen", "accusative", false);
addDeterminer("diese", "m", "diesem", "dative", false);
addDeterminer("dieses", "dieser", "dieses", "genitive", false);

function addPossessive(base: string, feminineBase = `${base}e`): void {
  addDeterminer(base, "e", base, "nominative", true);
  addDeterminer(feminineBase, "n", `${base}en`, "accusative", false);
  addDeterminer(feminineBase, "m", `${base}em`, "dative", false);
  addDeterminer(`${base}es`, `${base}er`, `${base}es`, "genitive", false);
}

addPossessive("mein");
addPossessive("dein");
addPossessive("sein");
addPossessive("ihr");
addPossessive("unser");
addDeterminer("euer", "e", "euer", "nominative", true);
addDeterminer("eure", "n", "euren", "accusative", false);
addDeterminer("eure", "m", "eurem", "dative", false);
addDeterminer("eures", "eurer", "eures", "genitive", false);

const determinerAlternation = [...determinerForms.keys()]
  .sort((left, right) => right.length - left.length)
  .map((value) => value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"))
  .join("|");
const phrasePattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}])(${determinerAlternation})(\s+)(${adjectiveAlternation})(${marker})([rnms])(?![\p{L}\p{M}])`,
  "giu"
);

function applyTokenCase(source: string, replacement: string): string {
  const lower = source.toLocaleLowerCase(locale);
  const upper = source.toLocaleUpperCase(locale);
  if (source === upper && source !== lower) {
    return replacement.toLocaleUpperCase(locale);
  }
  const first = [...source][0];
  if (first && first === first.toLocaleUpperCase(locale)) {
    const characters = [...replacement];
    const replacementFirst = characters.shift();
    return replacementFirst
      ? replacementFirst.toLocaleUpperCase(locale) + characters.join("")
      : replacement;
  }
  return replacement.toLocaleLowerCase(locale);
}

function adjectiveForm(
  sourceBase: string,
  grammaticalCase: GrammaticalCase,
  strongNominative: boolean
): string {
  const normalized = sourceBase.toLocaleLowerCase(locale);
  if (!adjectiveBaseSet.has(normalized)) {
    return sourceBase;
  }

  const ending =
    grammaticalCase === "nominative"
      ? strongNominative
        ? "r"
        : ""
      : "n";
  return applyTokenCase(sourceBase, normalized + ending);
}

function transformPhrases(input: string): TransformResult {
  let replacements = 0;
  const text = input.replace(
    phrasePattern,
    (
      match: string,
      determiner: string,
      whitespace: string,
      base: string,
      _marker: string,
      ending: string
    ) => {
      const form = determinerForms.get(determiner.toLocaleLowerCase(locale));
      if (
        !form ||
        ending.toLocaleLowerCase(locale) !== form.markerEnding
      ) {
        return match;
      }
      replacements += 1;
      return (
        applyTokenCase(determiner, form.masculine) +
        whitespace +
        adjectiveForm(base, form.grammaticalCase, form.strongNominative)
      );
    }
  );
  return { text, replacements };
}

function hasMarkedDeterminer(input: string, index: number): boolean {
  const prefix = input.slice(0, index);
  const match = /([\p{L}\p{M}:*_\/·•.’‘-]+)\s+$/u.exec(prefix);
  return Boolean(match?.[1] && determinerForms.has(match[1].toLocaleLowerCase(locale)));
}

function transformStandalone(input: string): TransformResult {
  let replacements = 0;
  const text = input.replace(
    standalonePattern,
    (
      match: string,
      base: string,
      _separator: string,
      ending: string,
      offset: number,
      fullInput: string
    ) => {
      if (hasMarkedDeterminer(fullInput, offset)) {
        return match;
      }
      const normalizedEnding = ending.toLocaleLowerCase(locale);
      replacements += 1;
      if (normalizedEnding === "r") {
        return applyTokenCase(
          base,
          base.toLocaleLowerCase(locale) + "r"
        );
      }
      if (normalizedEnding === "m") {
        return applyTokenCase(
          base,
          base.toLocaleLowerCase(locale) + "m"
        );
      }
      return applyTokenCase(
        base,
        base.toLocaleLowerCase(locale) + "n"
      );
    }
  );
  return { text, replacements };
}

export const substantivizedAdjectivesRule: Rule = {
  id: "adjective.substantivized-markers",
  risk: "safe",

  apply(input) {
    const phraseResult = transformPhrases(input);
    const standaloneResult = transformStandalone(phraseResult.text);
    return {
      text: standaloneResult.text,
      replacements: phraseResult.replacements + standaloneResult.replacements
    };
  }
};
