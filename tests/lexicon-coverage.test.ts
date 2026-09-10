import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

function runCoverage(
  observedGenderedBases: Array<{ base: string; count: number }>,
  extraArguments: string[] = []
) {
  const directory = mkdtempSync(join(tmpdir(), "sprachverstand-coverage-"));
  const inputPath = join(directory, "kandidaten.json");
  const outputPath = join(directory, "coverage.json");

  try {
    writeFileSync(
      inputPath,
      JSON.stringify({ version: 2, observedGenderedBases }),
      "utf8"
    );
    execFileSync(
      process.execPath,
      [
        resolve("scripts/lexicon-coverage.mjs"),
        inputPath,
        "--output",
        outputPath,
        ...extraArguments
      ],
      { cwd: resolve("."), stdio: "pipe" }
    );
    return JSON.parse(readFileSync(outputPath, "utf8")) as {
      stats: {
        uniqueObserved: number;
        knownUnique: number;
        unknownUnique: number;
        uniqueCoveragePercent: number;
        observedOccurrences: number;
        knownOccurrences: number;
        unknownOccurrences: number;
        occurrenceCoveragePercent: number;
      };
      unknown: Array<{ base: string; count: number }>;
      known: Array<{ base: string; count: number; replacement: string }>;
    };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

describe("Lexikon-Coverage-Audit", () => {
  it("weist alle produktiven Pluralpfade sowie unbekannte Formen getrennt aus", () => {
    const report = runCoverage([
      { base: "psychiater", count: 2 },
      { base: "psycholog", count: 1 },
      { base: "dozent", count: 1 },
      { base: "anbieter", count: 4 },
      { base: "speaker", count: 2 },
      { base: "quantenflauscher", count: 3 }
    ]);

    expect(report.known).toEqual(
      expect.arrayContaining([
        { base: "psychiater", count: 2, replacement: "psychiater" },
        { base: "psycholog", count: 1, replacement: "psychologen" },
        { base: "dozent", count: 1, replacement: "dozenten" },
        { base: "anbieter", count: 4, replacement: "anbieter" },
        { base: "speaker", count: 2, replacement: "speaker" }
      ])
    );
    expect(report.unknown).toEqual([
      { base: "quantenflauscher", count: 3 }
    ]);
    expect(report.stats).toMatchObject({
      uniqueObserved: 6,
      knownUnique: 5,
      unknownUnique: 1,
      uniqueCoveragePercent: 83.33,
      observedOccurrences: 13,
      knownOccurrences: 10,
      unknownOccurrences: 3,
      occurrenceCoveragePercent: 76.92
    });
  });

  it("kann einen späteren Mindestwert als CI-Grenze erzwingen", () => {
    expect(() =>
      runCoverage(
        [
          { base: "psychiater", count: 1 },
          { base: "quantenflauscher", count: 1 }
        ],
        ["--fail-under-unique", "90"]
      )
    ).toThrow();
  });
});
