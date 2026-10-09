import { isProbablyTechnicalText, isProtectedTextSubtree } from "./text-safety";
import { isSubtitleContent } from "./subtitles";

export interface InlineProtectionRange {
  readonly start: number;
  readonly end: number;
}

const quotePairs = new Map<string, string>([
  ["„", "“"],
  ["“", "”"],
  ["‚", "‘"],
  ["«", "»"],
  ["‹", "›"],
  ['"', '"']
]);
const maximumInlineRunLength = 16_384;

export function findInlineBoundary(
  node: Node,
  blockBoundaryTags: ReadonlySet<string>
): Node {
  let current: Node = node;
  while (current.parentNode) {
    current = current.parentNode;
    if (current instanceof Element && blockBoundaryTags.has(current.tagName)) {
      return current;
    }
    if (current instanceof ShadowRoot) {
      return current;
    }
  }
  return current;
}

function escaped(value: string): string {
  return value.replace(/[.*+?^\${}()|[\]\\]/gu, "\\$&");
}

function collectMatchedRanges(
  input: string,
  terms: readonly string[],
  protectQuotes: boolean
): InlineProtectionRange[] {
  const ranges: InlineProtectionRange[] = [];
  if (protectQuotes) {
    for (let index = 0; index < input.length; index += 1) {
      const opening = input[index];
      const closing = opening ? quotePairs.get(opening) : undefined;
      if (!closing) {
        continue;
      }
      const end = input.indexOf(closing, index + 1);
      if (end < 0) {
        continue;
      }
      ranges.push({ start: index, end: end + 1 });
      index = end;
    }
  }

  const values = [...new Set(terms.map((term) => term.trim()).filter(Boolean))]
    .sort((left, right) => right.length - left.length);
  if (values.length > 0) {
    const source =
      "(?<![\\p{L}\\p{M}\\p{N}])(?:" +
      values.map(escaped).join("|") +
      ")(?![\\p{L}\\p{M}\\p{N}])";
    for (const match of input.matchAll(new RegExp(source, "giu"))) {
      ranges.push({ start: match.index, end: match.index + match[0].length });
    }
  }
  return ranges.sort((left, right) => left.start - right.start || left.end - right.end);
}

export function collectInlineProtection(
  root: Node,
  boundaryTags: ReadonlySet<string>,
  originalOf: (node: Text) => string,
  protectedTerms: readonly string[],
  protectQuotes: boolean
): Map<Text, readonly InlineProtectionRange[]> {
  const results = new Map<Text, readonly InlineProtectionRange[]>();
  let run: { node: Text; value: string; offset: number }[] = [];
  let length = 0;

  const finishRun = (): void => {
    if (run.length === 0) {
      return;
    }
    const oversized = length > maximumInlineRunLength;
    const ranges = oversized
      ? []
      : collectMatchedRanges(
          run.map((entry) => entry.value).join(""),
          protectedTerms,
          protectQuotes
        );
    for (const entry of run) {
      if (oversized) {
        // Bei extrem langen Inline-Runs nichts potenziell Geschütztes verändern.
        results.set(entry.node, [{ start: 0, end: entry.value.length }]);
        continue;
      }
      const overlaps: InlineProtectionRange[] = [];
      for (const range of ranges) {
        const start = Math.max(entry.offset, range.start);
        const end = Math.min(entry.offset + entry.value.length, range.end);
        if (start >= end) {
          continue;
        }
        const localStart = start - entry.offset;
        const localEnd = end - entry.offset;
        const previous = overlaps[overlaps.length - 1];
        if (previous && localStart <= previous.end) {
          overlaps[overlaps.length - 1] = {
            start: previous.start,
            end: Math.max(localEnd, previous.end)
          };
        } else {
          overlaps.push({ start: localStart, end: localEnd });
        }
      }
      results.set(entry.node, overlaps);
    }
    run = [];
    length = 0;
  };

  const visit = (node: Node): void => {
    if (node instanceof Element && node !== root) {
      if (
        boundaryTags.has(node.tagName) ||
        isProtectedTextSubtree(node) ||
        isSubtitleContent(node)
      ) {
        finishRun();
        return;
      }
    }
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node as Text;
      const value = originalOf(text);
      if (
        !text.isConnected ||
        (value.length >= 6 && isProbablyTechnicalText(value))
      ) {
        finishRun();
        results.set(text, []);
        return;
      }
      run.push({ node: text, value, offset: length });
      length += value.length;
      return;
    }
    for (const child of node.childNodes) {
      visit(child);
    }
  };
  visit(root);
  finishRun();
  return results;
}