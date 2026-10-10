// Reproduzierbare Paarbildung und klare Trennung der Browser-/Seitenphasen.
export const realWorldPhaseNames = Object.freeze([
  "browserStartupMs",
  "navigationMs",
  "observerSetupMs",
  "initialProtectionSnapshotMs",
  "interactionMs",
  "playbackSetupMs",
  "observationWaitMs",
  "domSnapshotMs",
  "finalProtectionSnapshotMs",
  "screenshotMs"
]);

function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

export function comparePhaseDurations(baseline, extension) {
  return Object.fromEntries(realWorldPhaseNames.map((name) => {
    const start = baseline?.[name];
    const end = extension?.[name];
    return [name, Number.isFinite(start) && Number.isFinite(end)
      ? end - start : null];
  }));
}

export function summarizePairedRuns(pairs) {
  const valid = pairs.filter((pair) =>
    pair.baseline?.status === "ok" &&
    pair.extension?.status === "ok" &&
    pair.comparison
  );
  const metricMedian = (select) => median(
    valid.map(select).filter(Number.isFinite)
  );
  return {
    requestedPairs: pairs.length,
    validPairs: valid.length,
    // Chronologische Reihenfolge und einzelne Paarwerte verbleiben im JSON-Report.
    medianElapsedDeltaMs: metricMedian((pair) => pair.comparison.elapsedDeltaMs),
    medianVisitDeltaMs: metricMedian((pair) => pair.comparison.visitDeltaMs),
    medianLongTaskDeltaMs: metricMedian((pair) => pair.comparison.totalLongTaskDeltaMs),
    medianAfterObserverLongTaskDeltaMs:
      metricMedian((pair) => pair.comparison.afterObserverLongTaskDeltaMs),
    medianPhaseDeltaMs: Object.fromEntries(realWorldPhaseNames.map((name) =>
      [name, metricMedian((pair) => pair.comparison.phaseDeltaMs?.[name])]
    ))
  };
}
