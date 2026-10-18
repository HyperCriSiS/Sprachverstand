// Words with a gender marker that are still visible after the extension ran.
// Counts come from the extension runs; the baseline count shows how often the
// same word occurs on the unprocessed page. Nothing here changes acceptance.
export function summarizeResidualMarkerWords(results, limit = 200) {
  const words = new Map();
  for (const site of results) {
    const runs = site.pairs?.length ? site.pairs : [{baseline: site.baseline, extension: site.extension}];
    for (const run of runs) {
      for (const [mode, key] of [["extension", "count"], ["baseline", "baselineCount"]]) {
        const residual = run[mode]?.snapshot?.nodePatternAudit?.residualWords;
        if (!residual) continue;
        for (const [word, count] of Object.entries(residual)) {
          const entry = words.get(word) ?? {word, count: 0, baselineCount: 0, sites: new Set()};
          entry[key] += count;
          if (mode === "extension") entry.sites.add(site.slug);
          words.set(word, entry);
        }
      }
    }
  }
  return [...words.values()]
    .filter((entry) => entry.count > 0)
    .sort((left, right) => right.count - left.count || left.word.localeCompare(right.word, "de"))
    .slice(0, limit)
    .map((entry) => ({...entry, sites: [...entry.sites].sort()}));
}
