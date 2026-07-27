import catalogJson from "../data/neutral-context-catalog.json";
import { describe, expect, it } from "vitest";

interface ContextEntry {
  readonly id: string;
  readonly source: string;
  readonly replacement: string | null;
  readonly context: string;
  readonly confidence: "safe" | "contextual" | "candidate" | "unsafe";
  readonly status: "collect" | "implemented" | "reject";
  readonly ruleGroup: string | null;
}

interface ContextCatalog {
  readonly schemaVersion: number;
  readonly entries: readonly ContextEntry[];
}

const catalog = catalogJson as ContextCatalog;

describe("Kontextkatalog für neutrale Umschreibungen", () => {
  it("enthält eindeutige IDs und vollständige Entscheidungen", () => {
    const ids = catalog.entries.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(catalog.schemaVersion).toBe(1);

    for (const entry of catalog.entries) {
      expect(entry.id.length).toBeGreaterThan(0);
      expect(entry.source.length).toBeGreaterThan(0);
      expect(entry.context.length).toBeGreaterThan(0);

      if (entry.status === "implemented") {
        expect(entry.replacement).not.toBeNull();
        expect(entry.ruleGroup).not.toBeNull();
      }

      if (entry.status === "reject") {
        expect(entry.replacement).toBeNull();
      }
    }
  });

  it("enthält umgesetzte, gesammelte und abgelehnte Kontexte", () => {
    expect(catalog.entries.some((entry) => entry.status === "implemented")).toBe(true);
    expect(catalog.entries.some((entry) => entry.status === "collect")).toBe(true);
    expect(catalog.entries.some((entry) => entry.status === "reject")).toBe(true);
  });
});
