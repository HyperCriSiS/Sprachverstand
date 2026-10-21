const whitespaceCharacter = /\s/u;
const markedTokenCharacter = /[\p{L}\p{M}:*_/·•.’‘-]/u;

function previousCharacterStart(input: string, end: number): number {
  const last = input.charCodeAt(end - 1);
  if (last >= 0xdc00 && last <= 0xdfff && end > 1) {
    const first = input.charCodeAt(end - 2);
    if (first >= 0xd800 && first <= 0xdbff) return end - 2;
  }
  return end - 1;
}

// Keep complete tokens and the preceding boundary character. A fixed character
// cutoff could turn the end of a long word into a false determiner match.
export function contextSuffix(
  input: string,
  end: number,
  maximumTokens: number,
  tokenCharacter: RegExp = markedTokenCharacter
): string {
  let cursor = end;
  for (let token = 0; token < maximumTokens; token += 1) {
    while (cursor > 0 && whitespaceCharacter.test(input[cursor - 1] ?? "")) {
      cursor -= 1;
    }
    const tokenEnd = cursor;
    while (cursor > 0) {
      const start = previousCharacterStart(input, cursor);
      if (!tokenCharacter.test(input.slice(start, cursor))) break;
      cursor = start;
    }
    if (cursor === tokenEnd || cursor === 0 ||
        !whitespaceCharacter.test(input[cursor - 1] ?? "")) break;
  }
  return input.slice(cursor > 0 ? previousCharacterStart(input, cursor) : 0, end);
}
