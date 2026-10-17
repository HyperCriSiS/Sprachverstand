// Preserve the established settled-window contract: ignore the first 15 gaps.
function percentile(values, fraction) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * fraction) - 1))];
}

export function summarizeVideoFrames(frameTimes) {
  const gaps = [];
  for (let index = 1; index < frameTimes.length; index += 1) {
    const gap = Number(frameTimes[index]) - Number(frameTimes[index - 1]);
    if (Number.isFinite(gap) && gap >= 0) gaps.push(gap);
  }
  const settled = gaps.slice(Math.min(15, gaps.length));
  return {
    callbacks: frameTimes.length,
    p95GapMs: percentile(settled, 0.95),
    p99GapMs: percentile(settled, 0.99),
    maximumGapMs: settled.length ? Math.max(...settled) : 0,
    gapsOver120Ms: settled.filter(gap => gap > 120).length
  };
}

// Rendering timestamps cannot substitute for an unobserved callback-entry clock.
export function summarizeVideoCallbackEntries(frames) {
  if (!frames.length || frames.some((frame, index) =>
    !Number.isFinite(frame.callbackAtMs) || frame.callbackAtMs < 0 ||
    (index > 0 && frame.callbackAtMs < frames[index - 1].callbackAtMs))) return null;
  return summarizeVideoFrames(frames.map(frame => frame.callbackAtMs));
}

// A rendering timestamp must never silently stand in for an unobserved entry clock.
export function validateVideoCallbackMetadata(frames) {
  const summary = Array.isArray(frames) ? summarizeVideoCallbackEntries(frames) : null;
  if (!summary || frames.some(frame => typeof frame.focusedAtFrame !== 'boolean' ||
      !['visible', 'hidden'].includes(frame.visibilityAtFrame))) {
    throw new Error('Video callback-entry clock or frame visibility metadata is missing or invalid.');
  }
  return summary;
}
