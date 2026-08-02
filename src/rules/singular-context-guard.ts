const locale = "de-DE";
const plainAmbiguousDeterminers = new Set([
  "die",
  "eine",
  "einer",
  "ihre",
  "ihrer",
  "jene",
  "jener",
  "jede",
  "keine",
  "keiner",
  "meine",
  "meiner",
  "seine",
  "seiner",
  "deine",
  "deiner",
  "diese",
  "dieser",
  "unsere",
  "unserer",
  "eure",
  "eurer",
  "welche",
  "welcher"
]);
const markedDeterminerPrefixes = new Set([
  "der",
  "die",
  "den",
  "dem",
  "des",
  "ein",
  "eine",
  "einem",
  "eines",
  "kein",
  "keine",
  "keines",
  "jede",
  "jedes",
  "welche",
  "welches",
  "diese",
  "dieses",
  "jene",
  "jenes",
  "mein",
  "meine",
  "meines",
  "dein",
  "deine",
  "deines",
  "sein",
  "seine",
  "seinen",
  "seinem",
  "seines",
  "seiner",
  "ihr",
  "ihre",
  "ihren",
  "ihrem",
  "ihres",
  "ihrer",
  "unser",
  "unsere",
  "unseres",
  "euer",
  "eure",
  "eures"
]);
const separatorPattern = /[:*_\/·•.’‘]/u;
const precedingTokensPattern =
  /([\p{L}\p{M}:*_\/·•.’‘-]+(?:\s+[\p{L}\p{M}:*_\/·•.’‘-]+){0,3})\s+$/u;

function isAmbiguousDeterminer(token: string): boolean {
  const normalized = token.toLocaleLowerCase(locale);
  if (plainAmbiguousDeterminers.has(normalized)) {
    return true;
  }

  const separatorIndex = normalized.search(separatorPattern);
  return (
    separatorIndex > 0 &&
    markedDeterminerPrefixes.has(normalized.slice(0, separatorIndex))
  );
}

export function hasAmbiguousSingularDeterminer(
  input: string,
  nounIndex: number
): boolean {
  const prefix = input.slice(0, nounIndex);
  const match = precedingTokensPattern.exec(prefix);
  const tokens = match?.[1];
  return Boolean(
    tokens
      ?.split(/\s+/u)
      .some((token) => isAmbiguousDeterminer(token))
  );
}
