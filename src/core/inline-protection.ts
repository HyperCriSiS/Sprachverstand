import { isProbablyTechnicalText, isProtectedTextSubtree, hasOwnTextProtection } from "./text-safety";
import { isSubtitleContent, isSubtitleContainer } from "./subtitles";
import { collectQuoteRanges } from "./quote-ranges";
import { normalizeProtectedTerms, protectedTermSource } from "./protected-terms";

export interface InlineProtectionRange {
  readonly start: number;
  readonly end: number;
}

// Personal terms are matched per window of a long run, with a yield between
// windows; quotations are paired over the whole run in one linear pass.
const termWindowLength = 16_384;
// Beyond this the run is not even joined: everything in it stays protected.
const maximumInlineRunLength = 1_048_576;
// Stands in for a protected or technical node and for `<br>` inside a run,
// so quotation marks still pair across them while no personal term or
// quotation character can match inside them.
const protectedPlaceholder = "\u0000";
const lineBreakPlaceholder = " ";

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

function mergeRanges(ranges: InlineProtectionRange[]): InlineProtectionRange[] {
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

interface RunEntry {
  // Undefined for a placeholder that keeps offsets continuous.
  readonly node: Text | undefined;
  readonly value: string;
  readonly offset: number;
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
  let run: RunEntry[] = [];
  let length = 0;
  const rootElement = root instanceof Element ? root :
    root instanceof ShadowRoot ? root.host : null;
  const owner = root.nodeType === Node.DOCUMENT_NODE ? root as Document : root.ownerDocument;
  const protectedRoot = owner?.designMode?.toLowerCase() === "on" ||
    Boolean(rootElement && (isProtectedTextSubtree(rootElement) || isSubtitleContent(rootElement)));
  const terms = normalizeProtectedTerms(protectedTerms);
  const termPattern = terms.length > 0 ? new RegExp(protectedTermSource(terms), "giu") : undefined;
  // Matches may span whitespace, so a window overlaps the next by the longest
  // term plus the whitespace it may contain.
  const termOverlap = terms.length > 0 ? Math.max(...terms.map((term) => term.length)) * 2 : 0;

  const collectRanges = function* (): Generator<undefined, InlineProtectionRange[]> {
    const joined = run.map((entry) => entry.value).join("");
    const ranges: InlineProtectionRange[] = protectQuotes ? collectQuoteRanges(joined) : [];
    if (termPattern) {
      for (let start = 0; start < joined.length; start += termWindowLength) {
        const windowEnd = Math.min(joined.length, start + termWindowLength);
        const end = Math.min(joined.length, windowEnd + termOverlap);
        for (const match of joined.slice(start, end).matchAll(termPattern)) {
          const matchStart = start + match.index;
          // The next window covers matches that start inside the overlap.
          if (matchStart >= windowEnd) break;
          ranges.push({ start: matchStart, end: matchStart + match[0].length });
        }
        if (end < joined.length) yield;
      }
    }
    return mergeRanges(ranges);
  };

  const finishRun = function* (): Generator<readonly [Text, readonly InlineProtectionRange[]] | undefined> {
    if (run.length === 0) {
      return;
    }
    const oversized = length > maximumInlineRunLength;
    const ranges = oversized ? [] : yield* collectRanges();
    let rangeIndex = 0;
    for (const entry of run) {
      if (!entry.node) continue;
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

  const pushPlaceholder = (value: string): void => {
    run.push({ node: undefined, value, offset: length });
    length += value.length;
  };

  const visit = function* (node: Node): Generator<readonly [Text, readonly InlineProtectionRange[]] | undefined, boolean> {
    if (node instanceof Element && node !== root) {
      if (boundaryTags.has(node.tagName) || protectedRoot || isSubtitleContainer(node)) {
        yield* finishRun();
        return false;
      }
      if (hasOwnTextProtection(node)) {
        // `„Alle <code>git</code> Nutzer*innen“`: the quotation continues
        // behind the protected element; its own text is never read.
        pushPlaceholder(protectedPlaceholder);
        return false;
      }
      if (node.tagName === "BR") {
        pushPlaceholder(lineBreakPlaceholder);
        return false;
      }
    }
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node as Text;
      const value = originalOf(text);
      if (!text.isConnected) {
        yield [text, []];
        return false;
      }
      if (value.length >= 6 && isProbablyTechnicalText(value)) {
        // A URL or e-mail inside a quotation: the run continues behind it.
        pushPlaceholder(protectedPlaceholder);
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
