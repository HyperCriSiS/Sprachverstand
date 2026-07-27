import type { Rule } from "../core/rule";

const suffixPattern =
  /\s*\((?:m\s*\/\s*w\s*\/\s*d|w\s*\/\s*m\s*\/\s*d|m\s*\/\s*f\s*\/\s*d|f\s*\/\s*m\s*\/\s*d|m\s*\/\s*w\s*\/\s*x|w\s*\/\s*m\s*\/\s*x)\)/giu;

export const jobAdSuffixesRule: Rule = {
  id: "job-ad.gender-suffixes",
  risk: "contextual",

  apply(input) {
    let replacements = 0;
    const text = input.replace(suffixPattern, () => {
      replacements += 1;
      return "";
    });
    return { text, replacements };
  }
};
