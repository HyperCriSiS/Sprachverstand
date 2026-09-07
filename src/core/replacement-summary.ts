export interface ReplacementSummaryEntry {
  readonly original: string;
  readonly replacement: string;
  readonly count: number;
}

const wordLikeCharacter = /[\p{L}\p{M}\p{N}’'_-]/u;
const nonWhitespaceTokenPattern = /\S+/gu;
const maximumTokenDiffCells = 160_000;

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

function tokenValues(input: string): string[] {
  return input.match(nonWhitespaceTokenPattern) ?? [];
}

function positionAlignedChanges(
  original: string,
  transformed: string
): { original: string; replacement: string }[] | undefined {
  const originalTokens = tokenValues(original);
  const transformedTokens = tokenValues(transformed);
  if (originalTokens.length !== transformedTokens.length) {
    return undefined;
  }

  const changes: { original: string; replacement: string }[] = [];
  for (let index = 0; index < originalTokens.length; index += 1) {
    const originalToken = originalTokens[index] ?? "";
    const transformedToken = transformedTokens[index] ?? "";
    if (originalToken === transformedToken) {
      continue;
    }
    changes.push(trimSharedContext(originalToken, transformedToken));
  }
  return changes;
}

function sequenceAlignedChanges(
  original: string,
  transformed: string
): { original: string; replacement: string }[] | undefined {
  const originalTokens = tokenValues(original);
  const transformedTokens = tokenValues(transformed);
  const rows = originalTokens.length + 1;
  const columns = transformedTokens.length + 1;

  if (
    originalTokens.length === 0 ||
    transformedTokens.length === 0 ||
    rows * columns > maximumTokenDiffCells
  ) {
    return undefined;
  }

  const lcs = Array.from(
    { length: rows },
    () => new Uint16Array(columns)
  );

  for (
    let originalIndex = originalTokens.length - 1;
    originalIndex >= 0;
    originalIndex -= 1
  ) {
    const row = lcs[originalIndex];
    const nextRow = lcs[originalIndex + 1];
    if (!row || !nextRow) {
      continue;
    }

    for (
      let transformedIndex = transformedTokens.length - 1;
      transformedIndex >= 0;
      transformedIndex -= 1
    ) {
      row[transformedIndex] =
        originalTokens[originalIndex] === transformedTokens[transformedIndex]
          ? (nextRow[transformedIndex + 1] ?? 0) + 1
          : Math.max(
              nextRow[transformedIndex] ?? 0,
              row[transformedIndex + 1] ?? 0
            );
    }
  }

  const changes: { original: string; replacement: string }[] = [];
  let originalIndex = 0;
  let transformedIndex = 0;
  let originalChange: string[] = [];
  let transformedChange: string[] = [];

  const flushChange = (followingToken?: string): void => {
    if (originalChange.length === 0 && transformedChange.length === 0) {
      return;
    }

    // Bei reinen Löschungen/Einfügungen gehört der folgende gemeinsame Token
    // semantisch zur Ersetzung (z. B. „Schülerinnen und Schülern“ → „Schülern“).
    const includeFollowingToken =
      Boolean(followingToken) &&
      (originalChange.length === 0 || transformedChange.length === 0);
    const originalPart = [
      ...originalChange,
      ...(includeFollowingToken && followingToken ? [followingToken] : [])
    ].join(" ");
    const replacementPart = [
      ...transformedChange,
      ...(includeFollowingToken && followingToken ? [followingToken] : [])
    ].join(" ");

    changes.push(trimSharedContext(originalPart, replacementPart));
    originalChange = [];
    transformedChange = [];
  };

  while (
    originalIndex < originalTokens.length &&
    transformedIndex < transformedTokens.length
  ) {
    const originalToken = originalTokens[originalIndex] ?? "";
    const transformedToken = transformedTokens[transformedIndex] ?? "";

    if (originalToken === transformedToken) {
      flushChange(originalToken);
      originalIndex += 1;
      transformedIndex += 1;
      continue;
    }

    const skipOriginal = lcs[originalIndex + 1]?.[transformedIndex] ?? 0;
    const skipTransformed = lcs[originalIndex]?.[transformedIndex + 1] ?? 0;

    if (skipOriginal >= skipTransformed) {
      originalChange.push(originalToken);
      originalIndex += 1;
    } else {
      transformedChange.push(transformedToken);
      transformedIndex += 1;
    }
  }

  while (originalIndex < originalTokens.length) {
    originalChange.push(originalTokens[originalIndex] ?? "");
    originalIndex += 1;
  }
  while (transformedIndex < transformedTokens.length) {
    transformedChange.push(transformedTokens[transformedIndex] ?? "");
    transformedIndex += 1;
  }
  flushChange();

  return changes.filter(
    (change) => change.original && change.original !== change.replacement
  );
}

function summarizeChangePairs(
  original: string,
  transformed: string,
  replacements: number
): ReplacementSummaryEntry[] {
  const aligned =
    positionAlignedChanges(original, transformed) ??
    sequenceAlignedChanges(original, transformed);
  if (aligned && aligned.length > 0 && aligned.length <= replacements) {
    const entries = aligned.map((pair) => ({ ...pair, count: 1 }));
    if (replacements > entries.length) {
      const last = entries.at(-1);
      if (last) {
        entries[entries.length - 1] = {
          ...last,
          count: last.count + replacements - entries.length
        };
      }
    }
    return entries.filter(
      (entry) => entry.original && entry.original !== entry.replacement
    );
  }

  const pair = trimSharedContext(original, transformed);
  if (!pair.original || pair.original === pair.replacement) {
    return [];
  }
  return [{ ...pair, count: replacements }];
}

export function summarizeReplacements(
  original: string,
  transformed: string,
  count: number
): ReplacementSummaryEntry[] {
  if (count <= 0 || original === transformed) {
    return [];
  }
  return summarizeChangePairs(original, transformed, count);
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
