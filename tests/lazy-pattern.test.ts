import {afterEach, describe, expect, it, vi} from "vitest";
import {lazyPattern} from "../src/core/lazy-pattern";

afterEach(() => vi.restoreAllMocks());

describe("lazy Unicode pattern construction", () => {
  it("constructs only when first requested and reuses the original pattern", () => {
    const construct = vi.spyOn(globalThis, "RegExp");
    const getPattern = lazyPattern(String.raw`\p{L}+`, "gu");
    expect(construct).not.toHaveBeenCalled();
    const pattern = getPattern();
    expect(construct).toHaveBeenCalledTimes(1);
    expect(pattern.exec("Äpfel 123")?.[0]).toBe("Äpfel");
    expect(getPattern()).toBe(pattern);
    expect(getPattern().lastIndex).toBe(5);
    expect(construct).toHaveBeenCalledTimes(1);
  });
});
