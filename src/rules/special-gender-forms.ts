import type { Rule } from "../core/rule";

const locale = "de-DE";
const replacements = new Map<string, string>([
  ["rom*nja", "roma"],
  ["rom:nja", "roma"],
  ["rom_nja", "roma"],
  ["sinti*zze", "sinti"],
  ["sinti:zze", "sinti"],
  ["sinti_zze", "sinti"],
  ["studentys", "studenten"],
  ["lesys", "leser"],
  ["lehrys", "lehrer"],
  ["kollegys", "kollegen"],
  ["mitarbeitys", "mitarbeiter"],
  ["kommilitonys", "kommilitonen"],
  ["autorys", "autoren"],
  ["kritikys", "kritiker"],
  ["wirtys", "wirte"]
]);
const alternatives = [...replacements.keys()]
  .sort((left, right) => right.length - left.length)
  .map((value) => value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"))
  .join("|");
const pattern = new RegExp(
  String.raw`(?<![\p{L}\p{M}\p{N}])(${alternatives})(?![\p{L}\p{M}\p{N}])`,
  "giu"
);

function applyTokenCase(source: string, replacement: string): string {
  const letters = source.replace(/[^\p{L}\p{M}]/gu, "");
  const lower = letters.toLocaleLowerCase(locale);
  const upper = letters.toLocaleUpperCase(locale);
  if (letters === upper && letters !== lower) {
    return replacement.toLocaleUpperCase(locale);
  }
  const first = [...letters][0];
  if (first && first === first.toLocaleUpperCase(locale)) {
    const characters = [...replacement];
    const replacementFirst = characters.shift();
    return replacementFirst
      ? replacementFirst.toLocaleUpperCase(locale) + characters.join("")
      : replacement;
  }
  return replacement;
}

export const specialGenderFormsRule: Rule = {
  id: "special.visible-gender-forms",
  risk: "safe",

  apply(input) {
    let replacementCount = 0;
    const text = input.replace(pattern, (match: string) => {
      const replacement = replacements.get(match.toLocaleLowerCase(locale));
      if (!replacement) {
        return match;
      }
      replacementCount += 1;
      return applyTokenCase(match, replacement);
    });
    return { text, replacements: replacementCount };
  }
};
