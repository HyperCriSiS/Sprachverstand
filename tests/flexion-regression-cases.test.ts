import catalogJson from "../data/flexion-regression-cases.json";
import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";
import {
  defaultEnabledRuleGroupIds,
  disabledRuleIdsForGroups
} from "../src/rules/catalog";

interface SourceEntry {
  readonly id: string;
  readonly label: string;
  readonly url?: string;
}

interface RegressionCase {
  readonly id: string;
  readonly source: string;
  readonly input: string;
  readonly expected: string;
}

interface RegressionCatalog {
  readonly schemaVersion: number;
  readonly sources: readonly SourceEntry[];
  readonly cases: readonly RegressionCase[];
}

const catalog = catalogJson as RegressionCatalog;
const disabledRuleIds = disabledRuleIdsForGroups(defaultEnabledRuleGroupIds);

describe("kuratierter Flexions- und Sonderformenkatalog", () => {
  it("enthält eindeutige und vollständig referenzierte Einträge", () => {
    expect(catalog.schemaVersion).toBe(1);
    const sourceIds = new Set(catalog.sources.map((source) => source.id));
    const caseIds = catalog.cases.map((entry) => entry.id);
    expect(new Set(caseIds).size).toBe(caseIds.length);

    for (const entry of catalog.cases) {
      expect(entry.id.length).toBeGreaterThan(0);
      expect(entry.input.length).toBeGreaterThan(0);
      expect(sourceIds.has(entry.source)).toBe(true);
    }
  });

  it.each(catalog.cases)("verarbeitet $id", ({ input, expected }) => {
    expect(
      transformText(input, defaultRules, {
        profile: "aggressive",
        disabledRuleIds
      }).text
    ).toBe(expected);
  });
});
