// Typvertrag für die ausschließlich zur Diagnostik verwendeten ESM-Helfer.
export const realWorldPhaseNames: readonly string[];

export type Phasendauern = Readonly<Record<string, number>>;
export type Phasendifferenzen = Record<string, number | null>;

export interface Vergleichspaar {
  readonly baseline?: { readonly status?: string };
  readonly extension?: { readonly status?: string };
  readonly comparison?: {
    readonly elapsedDeltaMs?: number;
    readonly visitDeltaMs?: number;
    readonly totalLongTaskDeltaMs?: number;
    readonly afterObserverLongTaskDeltaMs?: number;
    readonly phaseDeltaMs?: Readonly<Record<string, number | null>>;
  } | null;
}

export function comparePhaseDurations(
  baseline: Phasendauern | undefined,
  extension: Phasendauern | undefined
): Phasendifferenzen;

export function summarizePairedRuns(pairs: readonly Vergleichspaar[]): {
  readonly requestedPairs: number;
  readonly validPairs: number;
  readonly medianElapsedDeltaMs: number | null;
  readonly medianVisitDeltaMs: number | null;
  readonly medianLongTaskDeltaMs: number | null;
  readonly medianAfterObserverLongTaskDeltaMs: number | null;
  readonly medianPhaseDeltaMs: Phasendifferenzen;
};
