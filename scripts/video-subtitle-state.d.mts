export interface SubtitleState {
  readonly normal?: string;
  readonly subtitle?: string;
  readonly ready: number;
  readonly paused: boolean;
  readonly error: unknown;
  readonly ticks: number;
  readonly timeUpdates: number;
}
export function isReadySubtitleState(state: SubtitleState, corrected: boolean,
  previous?: {readonly timeUpdates: number; readonly ticks?: number}): boolean;
