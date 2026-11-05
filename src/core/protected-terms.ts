// Personal exceptions as one alternation, shared by the text engine (per
// text) and the inline protection (per inline run across text nodes).

function escaped(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

export function normalizeProtectedTerms(terms: readonly string[]): string[] {
  return [...new Set(terms.map((term) => term.trim()).filter(Boolean))]
    .sort((left, right) => right.length - left.length);
}

// Whitespace inside a term matches any whitespace of the page, including a
// non-breaking space or a line break between two inline fragments.
export function protectedTermSource(values: readonly string[]): string {
  return "(?<![\\p{L}\\p{M}\\p{N}])(?:" +
    values.map((value) => value.split(/\s+/u).map(escaped).join("\\s+")).join("|") +
    ")(?![\\p{L}\\p{M}\\p{N}])";
}
