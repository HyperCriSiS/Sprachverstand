import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

function compile(payload: unknown) {
  const directory = mkdtempSync(join(tmpdir(), "sprachverstand-lexikon-build-"));
  const input = join(directory, "approved.json");
  const output = join(directory, "generated.ts");
  try {
    writeFileSync(input, JSON.stringify(payload), "utf8");
    execFileSync(
      process.execPath,
      [resolve("scripts/compile-person-lexicon.mjs"), input, output],
      { cwd: resolve("."), stdio: "pipe" }
    );
    return readFileSync(output, "utf8");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

describe("Generierter Personenwortschatz", () => {
  it("erzeugt nur normalisierte Produktdaten und sortiert deterministisch", () => {
    const source = compile({
      entries: [
        { base: "psycholog", plural: "psychologen", singular: "psychologe" },
        { base: "psychiater", plural: "psychiater", singular: "psychiater" }
      ]
    });

    expect(source).toContain('"psychiater"');
    expect(source).toContain('"psycholog"');
    expect(source.indexOf('"psychiater"')).toBeLessThan(source.indexOf('"psycholog"'));
    expect(source).not.toMatch(/source|quelle|url|license/i);
  });

  it("weist doppelte oder nicht normalisierte Basen zurück", () => {
    expect(() =>
      compile([
        { base: "Psychiater", plural: "psychiater" }
      ])
    ).toThrow();

    expect(() =>
      compile([
        { base: "psychiater", plural: "psychiater" },
        { base: "psychiater", plural: "psychiater" }
      ])
    ).toThrow();
  });
});
