// Typschnittstelle für den diagnostischen Browser-Knotenabgleich.
export interface LiveMarkerNodeSample {
  readonly id: "separator-innen" | "binnen-i";
  readonly word: string;
  readonly reason: string;
}

export interface LiveMarkerNodeAudit {
  readonly matchedTextNodeOccurrences: number;
  readonly excludedOccurrences: number;
  readonly otherOccurrences: number;
  readonly reasons: Record<string, number>;
  readonly samples: LiveMarkerNodeSample[];
  /** Only with `collectResidualWords`: visible unprotected marker words and counts. */
  readonly residualWords?: Record<string, number>;
}

export declare function classifyVisibleMarkerNodes(
  documentRef: Document,
  options?: { checkLayout?: boolean; collectResidualWords?: boolean }
): LiveMarkerNodeAudit;
