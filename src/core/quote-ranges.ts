// Quotation spans shared by the text engine (per text) and the inline
// protection (per inline run across text nodes), so both protect the same
// characters when quoted text is excluded from processing.

export interface QuoteRange {
  readonly start: number;
  readonly end: number;
}

export const quotePairs = new Map<string, string>([
  ["„", "“"],
  ["“", "”"],
  ["‚", "‘"],
  ["«", "»"],
  ["‹", "›"],
  ['"', '"']
]);

// Openers that German typography never leaves unclosed within a quotation:
// without a closing mark the quotation continues to the end of the text
// (`„Liebe Lehrer*innen,` as the first of several quoted paragraphs).
const openToEnd = new Set(["„", "«", "‹"]);
// `“` and the single marks are closing marks in German and opening marks in
// English; they open only where no word precedes them.
const ambiguousOpeners = new Set(["“", "‚", "‘"]);
const wordCharacter = /[\p{L}\p{M}\p{N}]/u;
const digit = /\p{N}/u;
const whitespace = /\s/u;

function isOpener(input: string, index: number, opening: string): boolean {
  const previous = index > 0 ? input[index - 1]! : "";
  const next = index + 1 < input.length ? input[index + 1]! : "";
  if (opening === '"') {
    // `24" Monitor`: an inch mark; `" Hallo`: no quotation opens before a space.
    return !(previous && digit.test(previous)) && next !== "" && !whitespace.test(next);
  }
  if (ambiguousOpeners.has(opening)) {
    return !(previous && wordCharacter.test(previous)) && next !== "" && !whitespace.test(next);
  }
  return true;
}

function findClosing(input: string, closing: string, from: number): number {
  let index = input.indexOf(closing, from);
  if (closing !== '"') return index;
  // A straight quote after a digit measures inches, it closes nothing.
  while (index > 0 && digit.test(input[index - 1]!)) {
    index = input.indexOf(closing, index + 1);
  }
  return index;
}

export function collectQuoteRanges(input: string): QuoteRange[] {
  const ranges: QuoteRange[] = [];
  const missingClosings = new Set<string>();
  for (let index = 0; index < input.length; index += 1) {
    const opening = input[index]!;
    const closing = quotePairs.get(opening);
    if (!closing || missingClosings.has(closing) || !isOpener(input, index, opening)) {
      continue;
    }
    const end = findClosing(input, closing, index + 1);
    if (end < 0) {
      if (openToEnd.has(opening)) {
        ranges.push({ start: index, end: input.length });
        break;
      }
      missingClosings.add(closing);
      continue;
    }
    ranges.push({ start: index, end: end + 1 });
    index = end;
  }
  return ranges;
}
