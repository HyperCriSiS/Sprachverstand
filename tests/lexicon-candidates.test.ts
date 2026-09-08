import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

interface PairCandidate {
  base: string;
  masculine: string;
  feminine: string;
  evidence: {
    feminineSingular: boolean;
    femininePlural: boolean;
  };
  confidence: "strong" | "weak";
}

interface CandidateResult {
  version: number;
  stats: {
    words: number;
    pairs: number;
    strongPairs: number;
    weakPairs: number;
    observedBases: number;
    observedOccurrences: number;
  };
  pairs: PairCandidate[];
  observedBases: string[];
  observedGenderedBases: Array<{ base: string; count: number }>;
}

function runCandidateExtractor(input: string): CandidateResult {
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
    return JSON.parse(readFileSync(outputPath, "utf8")) as CandidateResult;
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function runCandidateDirectory(files: Record<string, string>): CandidateResult {
  const directory = mkdtempSync(join(tmpdir(), "sprachverstand-lexikon-"));
  const inputDirectory = join(directory, "roh");
  const nestedDirectory = join(inputDirectory, "unterordner");
  const outputPath = join(directory, "ausgabe.json");

  try {
    mkdirSync(nestedDirectory, { recursive: true });
    for (const [name, content] of Object.entries(files)) {
      writeFileSync(join(nestedDirectory, name), content, "utf8");
    }
    writeFileSync(join(nestedDirectory, "ignorieren.bin"), "Psychiater:innen", "utf8");

    execFileSync(
      process.execPath,
      [
        resolve("scripts/lexicon-candidates.mjs"),
        inputDirectory,
        "--output",
        outputPath
      ],
      { cwd: resolve("."), stdio: "pipe" }
    );
    return JSON.parse(readFileSync(outputPath, "utf8")) as CandidateResult;
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
        expect.objectContaining({
          base: "lehrer",
          masculine: "lehrer",
          feminine: "lehrerin",
          confidence: "strong"
        }),
        expect.objectContaining({
          base: "psycholog",
          masculine: "psychologe",
          feminine: "psychologin",
          confidence: "strong"
        }),
        expect.objectContaining({
          base: "ärzt",
          masculine: "arzt",
          feminine: "ärztin",
          confidence: "strong"
        }),
        expect.objectContaining({
          base: "anwält",
          masculine: "anwalt",
          feminine: "anwältin",
          confidence: "strong"
        }),
        expect.objectContaining({
          base: "köch",
          masculine: "koch",
          feminine: "köchin",
          confidence: "strong"
        })
      ])
    );
    expect(result.stats.strongPairs).toBe(5);
    expect(result.stats.weakPairs).toBe(0);
  });

  it("trennt schwache Kandidaten von vollständig belegten Paaren", () => {
    const result = runCandidateExtractor("Lehrer Lehrerin");

    expect(result.pairs).toEqual([
      expect.objectContaining({
        base: "lehrer",
        confidence: "weak",
        evidence: {
          feminineSingular: true,
          femininePlural: false
        }
      })
    ]);
  });

  it("zählt beobachtete Gender-Schreibweisen und vereinheitlicht ihren Stamm", () => {
    const result = runCandidateExtractor(`
      Psychiater:innen Psychiater:innen Psychiater*innen
      Psychiater_innen PsychiaterInnen Psychiater/-innen Psychiater/in
    `);

    expect(result.observedBases).toEqual(["psychiater"]);
    expect(result.observedGenderedBases).toEqual([
      { base: "psychiater", count: 7 }
    ]);
    expect(result.stats.observedOccurrences).toBe(7);
  });

  it("verarbeitet Textdateien in Verzeichnissen rekursiv", () => {
    const result = runCandidateDirectory({
      "eins.txt": "Lehrer Lehrerin Lehrerinnen",
      "zwei.jsonl": "Psychiater:innen"
    });

    expect(result.pairs).toContainEqual(
      expect.objectContaining({ base: "lehrer", confidence: "strong" })
    );
    expect(result.observedBases).toEqual(["psychiater"]);
    expect(result.stats.observedOccurrences).toBe(1);
  });

  it("übernimmt keine bloß ähnlich aussehenden Wörter ohne maskulines Gegenstück", () => {
    const result = runCandidateExtractor("Berlin Medizin Aspirin");

    expect(result.pairs).toEqual([]);
    expect(result.observedBases).toEqual([]);
  });
});
