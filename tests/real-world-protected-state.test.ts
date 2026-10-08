import { describe, expect, it } from "vitest";
import {
  changedProtectedSelectors,
  compareProtectedRuns
} from "../scripts/real-world-protected-state.mjs";

describe("Vergleich geschützter DOM-Bereiche in Live-Messungen", () => {
  it("meldet nur tatsächliche Änderungen des gezählten und gehashten Zustands", () => {
    expect(changedProtectedSelectors(
      { input: { count: 1, hash: "abc" }, pre: { count: 1, hash: "same" } },
      { input: { count: 1, hash: "def" }, pre: { count: 1, hash: "same" } }
    )).toEqual(["input"]);
  });

  it("trennt normale Basislauf-Änderungen von nur im Erweiterungslauf beobachteten Änderungen", () => {
    const baseline = {
      protectedBefore: {
        input: { count: 1, hash: "a" },
        pre: { count: 1, hash: "p" }
      },
      protectedAfter: {
        input: { count: 1, hash: "b" },
        pre: { count: 1, hash: "p" }
      }
    };
    const extension = {
      protectedBefore: {
        input: { count: 1, hash: "a" },
        pre: { count: 1, hash: "p" }
      },
      protectedAfter: {
        input: { count: 1, hash: "b" },
        pre: { count: 1, hash: "q" }
      }
    };
    expect(compareProtectedRuns(baseline, extension)).toEqual({
      protectedBaselineChanged: ["input"],
      protectedExtensionChanged: ["input", "pre"],
      protectedOnlyExtensionChanged: ["pre"]
    });
  });

  it("ordnet gemeinsame dynamische Änderungen nicht allein der Erweiterung zu", () => {
    const unchanged = { input: { count: 1, hash: "a" } };
    const changed = { input: { count: 1, hash: "b" } };
    expect(compareProtectedRuns(
      { protectedBefore: unchanged, protectedAfter: changed },
      { protectedBefore: unchanged, protectedAfter: changed }
    )).toEqual({
      protectedBaselineChanged: ["input"],
      protectedExtensionChanged: ["input"],
      protectedOnlyExtensionChanged: []
    });
  });
});
