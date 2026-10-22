// Preserve input order for equal-length suffixes, including exact entries.
// Lookups depend on the number of suffix lengths rather than lexicon size.
export function createSuffixLookup<T>(
  entries: readonly T[],
  stemOf: (entry: T) => string,
  exactOf: (entry: T) => boolean = () => false
): (normalized: string) => T | undefined {
  const byLength = new Map<number, Map<string, T[]>>();
  for (const entry of entries) {
    const stem = stemOf(entry);
    const bucket = byLength.get(stem.length) ?? new Map<string, T[]>();
    const values = bucket.get(stem) ?? [];
    values.push(entry);
    bucket.set(stem, values);
    byLength.set(stem.length, bucket);
  }
  const lengths = [...byLength.keys()].sort((left, right) => right - left);
  return normalized => {
    for (const length of lengths) {
      if (length > normalized.length) continue;
      const values = byLength.get(length)!.get(normalized.slice(normalized.length - length));
      if (!values) continue;
      for (const entry of values) {
        if (!exactOf(entry) || length === normalized.length) return entry;
      }
    }
    return undefined;
  };
}
