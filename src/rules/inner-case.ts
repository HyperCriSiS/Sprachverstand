// Regex literals with Unicode property escapes stay at module level: Pale
// Moon compiles such a literal again each time a function evaluates it.
const nonLetterPattern = /[^\p{L}\p{M}]/gu;
const locale = "de-DE";

// Words with capitals inside (`AfDler`, `TikToker`, `EDEKAner`) keep their
// own letters where the replacement starts with the same word; before,
// they became `Afdler` or `tiktoker`. Ordinary capitalization and all-caps
// words stay with the callers' own rules.
// Länge des ersten Codepunkts in UTF-16-Einheiten; ersetzt `[...value][0]`
// ohne das Zerlegen des ganzen Wortes. Ein einzelnes Surrogat zählt wie
// beim Spread als ein Zeichen.
export function firstCodePointLength(value: string): number {
  return (value.codePointAt(0) ?? 0) > 0xffff ? 2 : 1;
}

export function preserveInnerCase(source: string, replacement: string): string | undefined {
  const word = source.replace(nonLetterPattern, "");
  // Gewöhnliche Wörter enden hier: alles nach dem ersten Codepunkt ist
  // klein. Erst der seltene Rest zerlegt die Zeichen einzeln.
  if (word.length < 2 || (word.length === 2 && firstCodePointLength(word) === 2)) return undefined;
  const rest = word.slice(firstCodePointLength(word));
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
