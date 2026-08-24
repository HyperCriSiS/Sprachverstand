export interface ReplacementSummaryEntry {
  readonly original: string;
  readonly replacement: string;
  readonly count: number;
}

const wordLikeCharacter = /[\p{L}\p{M}\p{N}’'_-]/u;

function trimSharedContext(
  original: string,
  transformed: string
): { original: string; replacement: string } {
  let start = 0;
  const maximumPrefix = Math.min(original.length, transformed.length);
  while (start < maximumPrefix && original[start] === transformed[start]) {
    start += 1;
  }

  let originalEnd = original.length;
  let transformedEnd = transformed.length;
  while (
    originalEnd > start &&
    transformedEnd > start &&
    original[originalEnd - 1] === transformed[transformedEnd - 1]
  ) {
    originalEnd -= 1;
    transformedEnd -= 1;
  }

  while (start > 0 && wordLikeCharacter.test(original[start - 1] ?? "")) {
    start -= 1;
  }

  while (
    originalEnd < original.length &&
    wordLikeCharacter.test(original[originalEnd] ?? "")
  ) {
    originalEnd += 1;
  }

  while (
    transformedEnd < transformed.length &&
    wordLikeCharacter.test(transformed[transformedEnd] ?? "")
  ) {
    transformedEnd += 1;
  }

  const originalPart = original.slice(start, originalEnd).trim();
  const replacementPart = transformed.slice(start, transformedEnd).trim();

  if (originalPart || replacementPart) {
    return {
      original: originalPart || original.trim(),
      replacement: replacementPart
    };
  }

  return { original: original.trim(), replacement: transformed.trim() };
}

export function summarizeReplacement(
  original: string,
  transformed: string,
  count: number
): ReplacementSummaryEntry | undefined {
  if (count <= 0 || original === transformed) {
    return undefined;
  }

  const pair = trimSharedContext(original, transformed);
  if (!pair.original || pair.original === pair.replacement) {
    return undefined;
  }

  return {
    ...pair,
    count
  };
}

export function aggregateReplacementSummaries(
  entries: readonly ReplacementSummaryEntry[]
): ReplacementSummaryEntry[] {
  const aggregated = new Map<string, ReplacementSummaryEntry>();

  for (const entry of entries) {
    const key = `${entry.original}\u0000${entry.replacement}`;
    const existing = aggregated.get(key);
    aggregated.set(key, {
      original: entry.original,
      replacement: entry.replacement,
      count: (existing?.count ?? 0) + entry.count
    });
  }

  return [...aggregated.values()].sort(
    (left, right) =>
      right.count - left.count || left.original.localeCompare(right.original, "de")
  );
}
