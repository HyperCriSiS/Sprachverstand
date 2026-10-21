const locale = "de-DE";

// Words with capitals inside (`AfDler`, `TikToker`, `EDEKAner`) keep their
// own letters where the replacement starts with the same word; before,
// they became `Afdler` or `tiktoker`. Ordinary capitalization and all-caps
// words stay with the callers' own rules.
export function preserveInnerCase(source: string, replacement: string): string | undefined {
  const letters = [...source.replace(/[^\p{L}\p{M}]/gu, "")];
  if (letters.length < 2) return undefined;
  const rest = letters.slice(1).join("");
  const word = letters.join("");
  if (rest === rest.toLocaleLowerCase(locale) || word === word.toLocaleUpperCase(locale)) {
    return undefined;
  }
  const sourceCharacters = [...source];
  const replacementCharacters = [...replacement];
  let common = 0;
  while (
    common < sourceCharacters.length &&
    common < replacementCharacters.length &&
    sourceCharacters[common]!.toLocaleLowerCase(locale) ===
      replacementCharacters[common]!.toLocaleLowerCase(locale)
  ) {
    common += 1;
  }
  if (common < 2) return undefined;
  return sourceCharacters.slice(0, common).join("") + replacementCharacters.slice(common).join("");
}
