export interface ResidualMarkerWord {
  readonly word: string;
  readonly count: number;
  readonly baselineCount: number;
  readonly sites: string[];
}

export declare function summarizeResidualMarkerWords(
  results: readonly unknown[],
  limit?: number
): ResidualMarkerWord[];
