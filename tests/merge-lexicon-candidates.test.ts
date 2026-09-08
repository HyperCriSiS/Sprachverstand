import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

function runMerge(inputs: unknown[]) {
  const directory = mkdtempSync(join(tmpdir(), "sprachverstand-lexikon-merge-"));
  const output = join(directory, "merged.json");
  try {
    const files = inputs.map((input, index) => {
      const path = join(directory, `${index}.json`);
      writeFileSync(path, JSON.stringify(input), "utf8");
      return path;
    });
    execFileSync(
      process.execPath,
      [resolve("scripts/merge-lexicon-candidates.mjs"), ...files, "--output", output],
      { cwd: resolve("."), stdio: "pipe" }
    );
    return JSON.parse(readFileSync(output, "utf8"));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

describe("Quellenneutrale Kandidatenbestätigung", () => {
  it("zählt nur Bestätigungen und übernimmt keine Herkunftsdaten", () => {
    const pair = {
      base: "psychiater",
      masculine: "psychiater",
      feminine: "psychiaterin",
      confidence: "strong"
    };
    const result = runMerge([
      {
        pairs: [pair],
        observedGenderedBases: [{ base: "psychiater", count: 2 }]
      },
      {
        pairs: [pair],
        observedGenderedBases: [{ base: "psychiater", count: 3 }]
      }
    ]);

    expect(result.pairs[0]).toEqual({
      base: "psychiater",
      masculine: "psychiater",
      feminine: "psychiaterin",
      confirmations: 2,
      strongConfirmations: 2
    });
    expect(result.observedGenderedBases[0]).toEqual({
      base: "psychiater",
      count: 5,
      confirmations: 2
    });
    expect(JSON.stringify(result)).not.toMatch(/source|quelle|url/i);
  });
});
