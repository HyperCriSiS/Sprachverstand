export function videoDynamicCompletion(texts: readonly string[], mutationTicks: number,
  mode: "baseline" | "extension"): {
    total: number; expected: number; correct: number; incorrectIndices: number[];
  };
