export function vergleicheDomSkalierung(
  baseline: unknown,
  aktuell: unknown
): {
  zeilen: readonly { readonly nodes: number; readonly medianRatio: number }[];
  markdown: string;
};
