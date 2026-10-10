export function vergleicheNativeDomBerichte(
  baseline: unknown,
  aktuell: unknown
): {
  werte: readonly { readonly nodes: number; readonly medianFaktor: number }[];
  markdown: string;
};
