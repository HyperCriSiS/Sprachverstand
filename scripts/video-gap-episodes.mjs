// A callback delay is distinct from lost video frames. Keep both measurements
// and overlapping page long tasks together without attributing their cause.
export function videoGapEpisodes(frames, longTasks, thresholdMs = 120) {
  const episodes = [];
  for (let index = 1; index < frames.length; index++) {
    const previous = frames[index - 1];
    const current = frames[index];
    const gapMs = current.nowMs - previous.nowMs;
    if (!(gapMs > thresholdMs)) continue;
    episodes.push({
      startMs: previous.nowMs, endMs: current.nowMs, gapMs,
      presentedFramesDelta: current.presentedFrames - previous.presentedFrames,
      mediaTimeDelta: current.mediaTime - previous.mediaTime,
      longTasks: longTasks.filter(task => task.startMs < current.nowMs &&
        task.startMs + task.durationMs > previous.nowMs)
    });
  }
  return episodes;
}

// The rendering-step timestamp passed to rVFC can precede actual callback
// entry. Keep this separately observed clock; never synthesize it for old data.
export function videoCallbackGapEpisodes(frames, longTasks, thresholdMs = 120) {
  if (!frames.length || frames.some(frame => !Number.isFinite(frame.callbackAtMs))) return undefined;
  return videoGapEpisodes(frames.map(frame => ({...frame, nowMs:frame.callbackAtMs})),
    longTasks, thresholdMs);
}

// For the fixture's verified constant-rate source without seeks, distinguish
// missed callbacks from source frames absent from the presentation counter. Multiple
// presentations between callbacks do not reveal which source frames were lost.
export function videoPresentationProgress(frames, sourceFps) {
  if (![30, 60].includes(sourceFps) || frames.length < 2) return undefined;
  const indices = [];
  for (const frame of frames) {
    const index = Math.round(frame.mediaTime * sourceFps);
    if (!Number.isFinite(frame.mediaTime) || frame.mediaTime < 0 ||
        !Number.isSafeInteger(index) || Math.abs(frame.mediaTime - index / sourceFps) > .001 ||
        !Number.isSafeInteger(frame.presentedFrames) || frame.presentedFrames < 0) return undefined;
    indices.push(index);
  }
  let omittedSourceFrames = 0;
  let unlocatedOmissions = 0;
  const locatedOmissionsModulo3 = [0, 0, 0];
  for (let i = 1; i < frames.length; i++) {
    const sourceDelta = indices[i] - indices[i - 1];
    const presentedDelta = frames[i].presentedFrames - frames[i - 1].presentedFrames;
    if (presentedDelta < 1 || sourceDelta < presentedDelta) return undefined;
    const missing = sourceDelta - presentedDelta;
    omittedSourceFrames += missing;
    if (presentedDelta !== 1) {
      unlocatedOmissions += missing;
      continue;
    }
    // Count residues arithmetically, without allocating one entry per omission.
    const start = indices[i - 1] + 1;
    const end = indices[i] - 1;
    for (let residue = 0; residue < 3; residue++) {
      locatedOmissionsModulo3[residue] += Math.floor((end - residue) / 3) -
        Math.floor((start - 1 - residue) / 3);
    }
  }
  const sourceFrameSpan = indices.at(-1) - indices[0];
  const presentedFrameSpan = frames.at(-1).presentedFrames - frames[0].presentedFrames;
  const callbackIntervals = frames.length - 1;
  return {sourceFps, sourceFrameSpan, presentedFrameSpan, callbackIntervals,
    unreportedPresentations: presentedFrameSpan - callbackIntervals,
    omittedSourceFrames, locatedOmissionsModulo3, unlocatedOmissions};
}
