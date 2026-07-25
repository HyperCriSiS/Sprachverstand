import type { Rule, TransformResult } from "../core/rule";

/*
 * Bei diesen natürlich femininen Familienbezeichnungen bleibt das grammatische
 * Geschlecht des Grundworts erhalten. Deshalb kann nur der Genderzusatz sicher
 * entfernt werden, ohne Artikel oder Kasus umzuschreiben.
 */
const separatorPattern =
  /(?<![\p{L}\p{M}])(Mutter|Tochter|Schwester)(?:[:*_/·•.’‘])in(?![\p{L}\p{M}])/giu;
const binnenIPattern =
  /(?<![\p{L}\p{M}])([Mm]utter|[Tt]ochter|[Ss]chwester)In(?![\p{L}\p{M}])/gu;

function transformPattern(input: string, pattern: RegExp): TransformResult {
  let replacements = 0;
  const text = input.replace(pattern, (_match: string, base: string) => {
    replacements += 1;
    return base;
  });

  return { text, replacements };
}

export const specialSingularFormsRule: Rule = {
  id: "singular.natural-family-forms",
  risk: "safe",

  apply(input) {
    const separatorResult = transformPattern(input, separatorPattern);
    const binnenIResult = transformPattern(separatorResult.text, binnenIPattern);

    return {
      text: binnenIResult.text,
      replacements:
        separatorResult.replacements + binnenIResult.replacements
    };
  }
};
