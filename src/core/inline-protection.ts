import { isProbablyTechnicalText, isProtectedTextSubtree, hasOwnTextProtection } from "./text-safety";
import { isSubtitleContent, isSubtitleContainer } from "./subtitles";

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
    const missingClosings = new Set<string>();
    for (let index = 0; index < input.length; index += 1) {
      const opening = input[index];
      const closing = opening ? quotePairs.get(opening) : undefined;
      if (!closing || missingClosings.has(closing)) {
        continue;
      }
      const end = input.indexOf(closing, index + 1);
      if (end < 0) {
        missingClosings.add(closing);
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
  ranges.sort((left, right) => left.start - right.start || left.end - right.end);
  const merged: InlineProtectionRange[] = [];
  for (const range of ranges) {
    const previous = merged[merged.length - 1];
    if (previous && range.start <= previous.end) {
      merged[merged.length - 1] = {
        start: previous.start,
        end: Math.max(previous.end, range.end)
      };
    } else {
      merged.push(range);
    }
  }
  return merged;
}

export function collectInlineProtection(
  root: Node,
  boundaryTags: ReadonlySet<string>,
  originalOf: (node: Text) => string,
  protectedTerms: readonly string[],
  protectQuotes: boolean
): Map<Text, readonly InlineProtectionRange[]> {
  const results = new Map<Text, readonly InlineProtectionRange[]>();
  for (const entry of iterateInlineProtection(root, boundaryTags, originalOf, protectedTerms, protectQuotes)) {
    if (entry) results.set(entry[0], entry[1]);
  }
  return results;
}

// Yield on traversal and result preparation, including oversized runs.
// Callers may drain synchronously or resume within their existing work budget.
export function* iterateInlineProtection(
  root: Node,
  boundaryTags: ReadonlySet<string>,
  originalOf: (node: Text) => string,
  protectedTerms: readonly string[],
  protectQuotes: boolean
): Generator<readonly [Text, readonly InlineProtectionRange[]] | undefined> {
  let run: { node: Text; value: string; offset: number }[] = [];
  let length = 0;
  const rootElement = root instanceof Element ? root :
    root instanceof ShadowRoot ? root.host : null;
  const owner = root.nodeType === Node.DOCUMENT_NODE ? root as Document : root.ownerDocument;
  const protectedRoot = owner?.designMode?.toLowerCase() === "on" ||
    Boolean(rootElement && (isProtectedTextSubtree(rootElement) || isSubtitleContent(rootElement)));

  const finishRun = function* (): Generator<readonly [Text, readonly InlineProtectionRange[]]> {
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
    let rangeIndex = 0;
    for (const entry of run) {
      if (oversized) {
        // Bei extrem langen Inline-Runs nichts potenziell Geschütztes verändern.
        yield [entry.node, [{ start: 0, end: entry.value.length }]];
        continue;
      }
      const overlaps: InlineProtectionRange[] = [];
      while (rangeIndex < ranges.length &&
             ranges[rangeIndex]!.end <= entry.offset) {
        rangeIndex += 1;
      }
      for (let index = rangeIndex; index < ranges.length; index += 1) {
        const range = ranges[index]!;
        if (range.start >= entry.offset + entry.value.length) break;
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
      yield [entry.node, overlaps];
    }
    run = [];
    length = 0;
  };

  const visit = function* (node: Node): Generator<readonly [Text, readonly InlineProtectionRange[]], boolean> {
    if (node instanceof Element && node !== root) {
      if (
        boundaryTags.has(node.tagName) ||
        protectedRoot || hasOwnTextProtection(node) || isSubtitleContainer(node)
      ) {
        yield* finishRun();
        return false;
      }
    }
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node as Text;
      const value = originalOf(text);
      if (
        !text.isConnected ||
        (value.length >= 6 && isProbablyTechnicalText(value))
      ) {
        yield* finishRun();
        yield [text, []];
        return false;
      }
      run.push({ node: text, value, offset: length });
      length += value.length;
      return false;
    }
    return true;
  };
  // Descendants of a protected element are skipped, so each remaining
  // element needs only its own flags checked. Rechecking all ancestors was
  // quadratic with depth; iterative traversal also avoids call-stack limits.
  let current: Node | null = root;
  while (current) {
    const descend = yield* visit(current);
    yield;
    if (descend && current.firstChild) {
      current = current.firstChild;
      continue;
    }
    while (current && current !== root && !current.nextSibling) {
      current = current.parentNode;
      yield;
    }
    if (!current || current === root) break;
    current = current.nextSibling;
  }
  yield* finishRun();
}
