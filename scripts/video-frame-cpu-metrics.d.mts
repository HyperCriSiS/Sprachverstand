export interface VideoFrameGap {
  readonly startMs: number;
  readonly endMs: number;
  readonly dauerMs: number;
  readonly index: number;
}

export interface VideoCpuWindow {
  readonly sampleCount: number;
  readonly zeitraumMs: readonly number[];
  readonly frameZeitraumMs: readonly number[];
  readonly achsePlausibel: boolean;
  readonly lueckenAb80Ms: number;
  readonly lueckenAb120Ms: number;
  readonly groessteLueckeMs: number;
  readonly spitzen: readonly (VideoFrameGap & {
    readonly longTasks: readonly { startMs: number; dauerMs: number }[];
    readonly sampledCpuMs: Record<string, number>;
    readonly topFunktionen: readonly { name: string; ms: number }[];
  })[];
  readonly topGesamt: readonly { name: string; ms: number }[];
}

export declare function frameLuecken(
  frameTimes: readonly number[],
  startIndex?: number,
  minimumGapMs?: number
): VideoFrameGap[];

export declare function analysiereVideoCpu(
  profile: {
    readonly startTime: number;
    readonly endTime?: number;
    readonly nodes: readonly {
      readonly id: number;
      readonly callFrame?: { readonly functionName?: string; readonly url?: string };
    }[];
    readonly samples: readonly number[];
    readonly timeDeltas: readonly number[];
  },
  offsetMs: number,
  frameTimes: readonly number[],
  longTasks?: readonly { startMs: number; dauerMs: number }[]
): VideoCpuWindow;
