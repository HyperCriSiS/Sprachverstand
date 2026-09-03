import type { DomainListMode } from "./defaults";

function extractHostname(input: string): string {
  const value = input.trim().toLowerCase();

  if (!value) {
    return "";
  }

  try {
    const url = value.includes("://")
      ? new URL(value)
      : new URL(`https://${value}`);
    return url.hostname;
  } catch {
    return value.split("/")[0]?.split(":")[0] ?? "";
  }
}

export function normalizeDomainPattern(input: string): string {
  return extractHostname(input)
    .replace(/^\*\./u, "")
    .replace(/^\./u, "")
    .replace(/\.$/u, "");
}

export function isDomainListed(
  hostname: string,
  patterns: readonly string[]
): boolean {
  const normalizedHostname = normalizeDomainPattern(hostname);

  return patterns.some((pattern) => {
    const normalizedPattern = normalizeDomainPattern(pattern);

    return (
      normalizedPattern.length > 0 &&
      (normalizedHostname === normalizedPattern ||
        normalizedHostname.endsWith(`.${normalizedPattern}`))
    );
  });
}

export function isDomainExcluded(
  hostname: string,
  patterns: readonly string[]
): boolean {
  return isDomainListed(hostname, patterns);
}

export function shouldProcessDomain(
  hostname: string,
  patterns: readonly string[],
  mode: DomainListMode
): boolean {
  const listed = isDomainListed(hostname, patterns);
  return mode === "include" ? listed : !listed;
}
