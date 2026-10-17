export interface SchedulingObservation {
  readonly supported: boolean;
  readonly startedAtMs: number;
  readonly finishedAtMs: number;
  readonly truncated: boolean;
  readonly timerSamples: readonly {readonly nowMs: number}[];
  readonly animationSamples: readonly {readonly callbackAtMs: number}[];
}
export function videoSchedulingProgress(episode: {readonly startMs: number; readonly endMs: number},
  observation?: SchedulingObservation | null): {
    observed: true;
    timer: {callbacks: number; maximumSilenceMs: number};
    animation: {callbacks: number; maximumSilenceMs: number};
  } | {observed: false; reason: "truncated" | "outside-observation-window"} | undefined;
