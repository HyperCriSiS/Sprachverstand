import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

function runVerification(candidateSet: unknown, flexions: unknown) {
  const directory = mkdtempSync(join(tmpdir(), "sprachverstand-flexion-"));
  const candidates = join(directory, "candidates.json");
  const data = join(directory, "flexion.json");
  const output = join(directory, "verified.json");
  try {
    writeFileSync(candidates, JSON.stringify(candidateSet), "utf8");
    writeFileSync(data, JSON.stringify(flexions), "utf8");
    execFileSync(
      process.execPath,
      [
        resolve("scripts/lexicon-verify-flexion.mjs"),
        candidates,
        data,
        "--output",
        output
      ],
      { cwd: resolve("."), stdio: "pipe" }
    );
    return JSON.parse(readFileSync(output, "utf8"));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function masculineNoun(
  lemma: string,
  plural: string,
  accusative = lemma,
  dative = accusative,
  genitive = `${lemma}s`
) {
  return {
    lemma,
    type: "noun",
    gender: "m",
    translations: { en: ["wird nicht übernommen"] },
    frequency: 0.123,
    cases: {
      nominative: { singular: lemma, plural },
      accusative: { singular: accusative, plural },
      dative: { singular: dative, plural },
      genitive: { singular: genitive, plural }
    }
  };
}

describe("Automatische Flexionsgegenprüfung", () => {
  it("übernimmt nur neue, starke und eindeutig flektierte Personenformen", () => {
    const result = runVerification(
      {
        pairs: [
          {
            base: "neuanalyst",
            masculine: "neuanalyst",
            feminine: "neuanalystin",
            confidence: "strong"
          },
          {
            base: "anbieter",
            masculine: "anbieter",
            feminine: "anbieterin",
            confidence: "strong"
          },
          {
            base: "quantenflauscher",
            masculine: "quantenflauscher",
            feminine: "quantenflauscherin",
            confidence: "strong"
          },
          {
            base: "halbbelegt",
            masculine: "halbbelegt",
            feminine: "halbbelegtin",
            confidence: "weak"
          }
        ]
      },
      [
        masculineNoun(
          "Neuanalyst",
          "Neuanalysten",
          "Neuanalysten",
          "Neuanalysten",
          "Neuanalysten"
        )
      ]
    );

    expect(result.entries).toEqual([
      {
        base: "neuanalyst",
        plural: "neuanalysten",
        singular: "neuanalyst",
        feminineSingular: "neuanalystin",
        obliqueSingular: "neuanalysten",
        genitiveSingular: "neuanalysten"
      }
    ]);
    expect(result.stats).toMatchObject({
      candidatePairs: 4,
      strongCandidatePairs: 3,
      verified: 1,
      alreadyCovered: 1,
      missingFlexion: 1
    });
    expect(JSON.stringify(result)).not.toMatch(/translations|frequency|source|quelle|url/i);
  });

  it("verwirft widersprüchliche oder nicht gemeinsam darstellbare Flexion", () => {
    const pairs = [
      {
        base: "testling",
        masculine: "testling",
        feminine: "testlingin",
        confidence: "strong"
      }
    ];

    const ambiguous = runVerification(
      { pairs },
      [
        masculineNoun("Testling", "Testlinge"),
        masculineNoun("Testling", "Testlingen")
      ]
    );
    expect(ambiguous.entries).toEqual([]);
    expect(ambiguous.stats.ambiguousFlexion).toBe(1);

    const incompatible = runVerification(
      { pairs },
      [masculineNoun("Testling", "Testlinge", "Testling", "Testlinge")]
    );
    expect(incompatible.entries).toEqual([]);
    expect(incompatible.stats.incompatibleFlexion).toBe(1);
  });
});
