import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

function runCandidateExtractor(input: string) {
  const directory = mkdtempSync(join(tmpdir(), "sprachverstand-lexikon-"));
  const inputPath = join(directory, "eingabe.txt");
  const outputPath = join(directory, "ausgabe.json");

  try {
    writeFileSync(inputPath, input, "utf8");
    execFileSync(
      process.execPath,
      [resolve("scripts/lexicon-candidates.mjs"), inputPath, "--output", outputPath],
      { cwd: resolve("."), stdio: "pipe" }
    );
    return JSON.parse(readFileSync(outputPath, "utf8")) as {
      stats: { pairs: number; observedBases: number };
      pairs: Array<{ base: string; masculine: string; feminine: string }>;
      observedBases: string[];
    };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

describe("Lexikon-Kandidatenextraktion", () => {
  it("findet reguläre, schwache und umlautende Personenpaare", () => {
    const result = runCandidateExtractor(`
      Lehrer Lehrerin Lehrerinnen
      Psychologe Psychologin Psychologinnen
      Arzt Ärztin Ärztinnen
      Anwalt Anwältin Anwältinnen
      Koch Köchin Köchinnen
    `);

    expect(result.pairs).toEqual(
      expect.arrayContaining([
        { base: "lehrer", masculine: "lehrer", feminine: "lehrerin" },
        {
          base: "psycholog",
          masculine: "psychologe",
          feminine: "psychologin"
        },
        { base: "ärzt", masculine: "arzt", feminine: "ärztin" },
        { base: "anwält", masculine: "anwalt", feminine: "anwältin" },
        { base: "köch", masculine: "koch", feminine: "köchin" }
      ])
    );
  });

  it("vereinheitlicht beobachtete Gender-Schreibweisen auf ihren Stamm", () => {
    const result = runCandidateExtractor(`
      Psychiater:innen Psychiater*innen Psychiater_innen
      PsychiaterInnen Psychiater/-innen Psychiater/in
    `);

    expect(result.observedBases).toEqual(["psychiater"]);
  });

  it("übernimmt keine bloß ähnlich aussehenden Wörter ohne maskulines Gegenstück", () => {
    const result = runCandidateExtractor("Berlin Medizin Aspirin");

    expect(result.pairs).toEqual([]);
    expect(result.observedBases).toEqual([]);
  });
});
