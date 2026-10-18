// Recorded callbacks distinguish progress of page tasks and rendering.
// Silence of one callback class does not identify a native cause or prove
// that pixels/audio stopped. Missing observations must remain unmeasured.
export function videoSchedulingProgress(episode, observation) {
  if (observation == null || observation.supported !== true) return undefined;
  const {startMs, endMs} = episode;
  const {startedAtMs, finishedAtMs, timerSamples, animationSamples, truncated} = observation;
  if (![startMs, endMs, startedAtMs, finishedAtMs].every(Number.isFinite) ||
      endMs <= startMs || finishedAtMs < startedAtMs ||
      !Array.isArray(timerSamples) || !Array.isArray(animationSamples) ||
      timerSamples.length > 2048 || animationSamples.length > 2048 ||
      typeof truncated !== "boolean") {
    throw new Error("Incomplete scheduling observation.");
  }
  const summarize = (samples, clock) => {
    let previous = -Infinity;
    const times = samples.map(sample => {
      const time = sample[clock];
      if (!Number.isFinite(time) || time < previous ||
          time < startedAtMs || time > finishedAtMs) {
        throw new Error("Invalid scheduling callback clock.");
      }
      previous = time;
      return time;
    });
    const inside = times.filter(time => time > startMs && time < endMs);
    const boundaries = [startMs, ...inside, endMs];
    return {callbacks: inside.length, maximumSilenceMs: Math.max(...boundaries.slice(1)
      .map((time, index) => time - boundaries[index]))};
  };
  // Validate stored clocks even when a capped or incomplete window cannot
  // support an inference. Never turn a stopped observer into a frame stall.
  const timer = summarize(timerSamples, "nowMs");
  const animation = summarize(animationSamples, "callbackAtMs");
  if (truncated) return {observed: false, reason: "truncated"};
  if (startMs < startedAtMs || endMs > finishedAtMs) {
    return {observed: false, reason: "outside-observation-window"};
  }
  return {observed: true, timer, animation};
}
