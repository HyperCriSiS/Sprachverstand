// Typisierte Schnittstelle für den diagnostischen Vergleich geschützter DOM-Bereiche.
export interface ProtectedSelectorSnapshot {
  readonly count: number;
  readonly hash: string;
}

export interface ProtectedRun {
  readonly protectedBefore?: Readonly<Record<string, ProtectedSelectorSnapshot>>;
  readonly protectedAfter?: Readonly<Record<string, ProtectedSelectorSnapshot>>;
}

export interface ProtectedComparison {
  readonly protectedBaselineChanged: string[];
  readonly protectedExtensionChanged: string[];
  readonly protectedOnlyExtensionChanged: string[];
}

export declare function changedProtectedSelectors(
  before?: Readonly<Record<string, ProtectedSelectorSnapshot>>,
  after?: Readonly<Record<string, ProtectedSelectorSnapshot>>
): string[];

export declare function compareProtectedRuns(
  baseline: ProtectedRun,
  extension: ProtectedRun
): ProtectedComparison;
