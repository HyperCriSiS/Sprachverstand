import { describe, expect, it } from "vitest";
import { formatBadgeCount } from "../src/browser/badge";

describe("formatBadgeCount", () => {
  it("blendet null aus und zeigt normale Zahlen vollständig", () => {
    expect(formatBadgeCount(0)).toBe("");
    expect(formatBadgeCount(1)).toBe("1");
    expect(formatBadgeCount(999)).toBe("999");
  });

  it("begrenzt sehr große Zähler auf eine lesbare Badge", () => {
    expect(formatBadgeCount(1000)).toBe("999+");
    expect(formatBadgeCount(-4)).toBe("");
    expect(formatBadgeCount(2.9)).toBe("2");
  });
});
