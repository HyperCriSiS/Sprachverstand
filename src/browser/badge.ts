export const badgeBackgroundColor = "#1f6feb";

export function formatBadgeCount(count: number): string {
  const normalizedCount = Math.max(0, Math.trunc(count));

  if (normalizedCount === 0) {
    return "";
  }

  return normalizedCount > 999 ? "999+" : String(normalizedCount);
}
