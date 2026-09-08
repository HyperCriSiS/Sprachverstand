import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

function runApproval(
  entries: Array<Record<string, unknown>>,
  evidence: Array<Record<string, unknown>>
) {
  const directory = mkdtempSync(join(tmpdir(), "sprachverstand-approve-"));
  const verified = join(directory, "verified.json");
  const proof = join(directory, "evidence.json");
  const output = join(directory, "approved.json");

  try {
    writeFileSync(verified, JSON.stringify({ entries }), "utf8");
    writeFileSync(proof, JSON.stringify({ entries: evidence }), "utf8");
    execFileSync(
      process.execPath,
      [resolve("scripts/lexicon-approve.mjs"), verified, proof, output],
      { cwd: resolve("."), stdio: "pipe" }
    );
    return JSON.parse(readFileSync(output, "utf8")) as {
      stats: { verified: number; approved: number; rejected: number };
      entries: Array<{ base: string }>;
      rejected: Array<{
        base: string;
        usageVariants: number;
        semanticConfirmations: number;
        feminineFlexionConfirmed: boolean;
      }>;
    };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

const verified = (base: string) => ({
  base,
  plural: `${base}e`,
  singular: base,
  feminineSingular: `${base}in`,
  obliqueSingular: base,
  genitiveSingular: `${base}s`
});

describe("Konservative Lexikonfreigabe", () => {
  it("akzeptiert breit beobachtete Formen ohne zusätzliche Semantikmarkierung", () => {
    const result = runApproval(
      [verified("psychiater")],
      [{ base: "psychiater", usageVariants: 4 }]
    );

    expect(result.stats).toEqual({ verified: 1, approved: 1, rejected: 0 });
    expect(result.entries).toEqual([
      expect.objectContaining({ base: "psychiater" })
    ]);
  });

  it("akzeptiert drei Schreibweisen nur bei bestätigter femininer Flexion", () => {
    const result = runApproval(
      [verified("sänger"), verified("scheinwort")],
      [
        {
          base: "sänger",
          usageVariants: 3,
          feminineFlexionConfirmed: true
        },
        {
          base: "scheinwort",
          usageVariants: 3,
          feminineFlexionConfirmed: false
        }
      ]
    );

    expect(result.entries.map((entry) => entry.base)).toEqual(["sänger"]);
    expect(result.rejected.map((entry) => entry.base)).toEqual(["scheinwort"]);
  });

  it("akzeptiert zwei Schreibweisen nur mit unabhängiger semantischer Bestätigung", () => {
    const result = runApproval(
      [verified("analphabet"), verified("oktober")],
      [
        {
          base: "analphabet",
          usageVariants: 2,
          semanticConfirmations: 1
        },
        {
          base: "oktober",
          usageVariants: 2,
          semanticConfirmations: 0
        }
      ]
    );

    expect(result.entries.map((entry) => entry.base)).toEqual(["analphabet"]);
    expect(result.rejected).toContainEqual(
      expect.objectContaining({ base: "oktober" })
    );
  });

  it("vereinigt anonyme Evidenz für denselben Stamm ohne Herkunftsdaten", () => {
    const result = runApproval(
      [verified("brite")],
      [
        { base: "Brite", usageVariants: 1, semanticConfirmations: 1 },
        { base: "brite", usageVariants: 2, semanticConfirmations: 1 }
      ]
    );

    expect(result.entries.map((entry) => entry.base)).toEqual(["brite"]);
    expect(JSON.stringify(result)).not.toMatch(/source|quelle|url/i);
  });
});
