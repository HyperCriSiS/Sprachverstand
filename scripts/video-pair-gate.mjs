// Relative video performance gate across several paired measurements.
// A single headless pair on a shared runner is dominated by native noise
// (startup shader compilation, clock quantization, host I/O). The thresholds
// below are the existing per-pair limits; they now apply to the median of
// alternating baseline/extension pairs instead of to one arbitrary sample.

function median(values) {
  const sorted = values.filter(Number.isFinite).sort((left, right) => left - right);
  if (sorted.length === 0) return Number.NaN;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

// Drops before the first settled frame interval belong to the startup phase
// that the gap metrics already exclude. Without a settled sample the complete
// counter is used, so older reports are never judged more leniently.
export function settledDroppedFrames(result) {
  const start = result.settledDroppedVideoFramesStart;
  return Number.isFinite(start) && start >= 0 && start <= result.droppedVideoFrames
    ? result.droppedVideoFrames - start : result.droppedVideoFrames;
}

export function aggregateVideoRole(results) {
  if (!Array.isArray(results) || results.length === 0) {
    throw new Error("Videovergleich: keine Messungen vorhanden.");
  }
  return {
    callbacks: median(results.map(result => result.frames.callbacks)),
    p95GapMs: median(results.map(result => result.frames.p95GapMs)),
    maximumGapMs: median(results.map(result => result.frames.maximumGapMs)),
    gapsOver120Ms: median(results.map(result => result.frames.gapsOver120Ms)),
    droppedVideoFrames: median(results.map(settledDroppedFrames))
  };
}

export function videoPairOrders(count) {
  if (!Number.isInteger(count) || count < 1 || count > 9) {
    throw new Error("Videovergleich: 1 bis 9 Paare erlaubt.");
  }
  return Array.from({length: count}, (_, index) =>
    index % 2 === 0 ? "baseline-first" : "extension-first");
}

export function videoPerformanceViolations(baselineResults, extensionResults) {
  if (baselineResults.length !== extensionResults.length) {
    throw new Error("Videovergleich: ungleich viele Baseline- und Erweiterungsmessungen.");
  }
  const baseline = aggregateVideoRole(baselineResults);
  const extension = aggregateVideoRole(extensionResults);
  const violations = [];

  const frameRatio = extension.callbacks / baseline.callbacks;
  if (!(frameRatio >= 0.8)) {
    violations.push(`Videocallbacks mit Erweiterung zu stark reduziert: ${(frameRatio * 100).toFixed(1)} % der Baseline (Median).`);
  }
  const extraLongGaps = extension.gapsOver120Ms - baseline.gapsOver120Ms;
  if (extraLongGaps > 2) {
    violations.push(`Zu viele zusätzliche Frame-Lücken >120 ms: ${extraLongGaps} (Median).`);
  }
  const allowedP95 = Math.max(120, baseline.p95GapMs + 60);
  if (!(extension.p95GapMs <= allowedP95)) {
    violations.push(`P95-Frameabstand zu hoch: ${extension.p95GapMs.toFixed(1)} ms; erlaubt ${allowedP95.toFixed(1)} ms (Median).`);
  }
  const allowedMaximum = Math.max(300, baseline.maximumGapMs + 160);
  if (!(extension.maximumGapMs <= allowedMaximum)) {
    violations.push(`Maximale Frame-Lücke zu hoch: ${extension.maximumGapMs.toFixed(1)} ms; erlaubt ${allowedMaximum.toFixed(1)} ms (Median).`);
  }
  if (!(extension.droppedVideoFrames <= baseline.droppedVideoFrames + 5)) {
    violations.push(`Zu viele verworfene Videoframes nach der Startphase: Baseline ${baseline.droppedVideoFrames}, Erweiterung ${extension.droppedVideoFrames} (Median).`);
  }
  return {baseline, extension, violations};
}
