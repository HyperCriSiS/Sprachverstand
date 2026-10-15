export interface VideoFrameSample {
  readonly nowMs: number;
  readonly mediaTime: number;
  readonly presentedFrames: number;
  readonly callbackAtMs?: number;
}
export interface VideoLongTask {
  readonly startMs: number;
  readonly durationMs: number;
}
export function videoGapEpisodes(frames: readonly VideoFrameSample[],
  longTasks: readonly VideoLongTask[], thresholdMs?: number): {
    startMs: number; endMs: number; gapMs: number;
    presentedFramesDelta: number; mediaTimeDelta: number;
    longTasks: VideoLongTask[];
  }[];
export function videoCallbackGapEpisodes(frames: readonly VideoFrameSample[],
  longTasks: readonly VideoLongTask[], thresholdMs?: number):
  ReturnType<typeof videoGapEpisodes> | undefined;
export function videoPresentationProgress(frames: readonly VideoFrameSample[],
  sourceFps: number): {
    sourceFps: number; sourceFrameSpan: number; presentedFrameSpan: number;
    callbackIntervals: number; unreportedPresentations: number;
    omittedSourceFrames: number; locatedOmissionsModulo3: number[];
    unlocatedOmissions: number;
  } | undefined;
