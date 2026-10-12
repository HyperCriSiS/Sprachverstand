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
