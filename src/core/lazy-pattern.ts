// Construct expensive Unicode patterns only when a rule has a candidate.
// Reuse the same RegExp afterwards, preserving its original state semantics.
export function lazyPattern(source: string, flags: string): () => RegExp {
  let pattern: RegExp | undefined;
  return () => pattern ??= new RegExp(source, flags);
}
