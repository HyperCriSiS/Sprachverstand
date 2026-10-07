import { describe, expect, it } from "vitest";
import { buildCoverageReport } from "../scripts/lexicon-coverage.mjs";

describe("Lexikon-Coverage", () => {
  it("prüft reale Oberflächenformen gegen die vollständige Default-Runtime", async () => {
    const report = await buildCoverageReport({
      observedGenderedForms: [
        { base: "bürgermeisters", surface: "Bürgermeisters/in", count: 7 },
        { base: "athleten", surface: "Athleten*innen", count: 3 },
        { base: "physikingenieure", surface: "Physikingenieure/innen", count: 1 },
        { base: "bürgermeister", surface: "Bürgermeister*innen", count: 2 },
        { base: "datei", surface: "Datei:In", count: 4 },
        { base: "gewerkschaftern", surface: "Gewerkschaftern/innen", count: 1 }
      ]
    });

    expect(report.version).toBe(2);
    expect(report.coverageMode).toBe("surface-runtime");
    expect(report.stats).toMatchObject({
      uniqueObserved: 6,
      knownUnique: 4,
      unknownUnique: 2,
      observedOccurrences: 18,
      knownOccurrences: 13,
      unknownOccurrences: 5,
      distinctSurfaces: 6,
      knownSurfaces: 4,
      unknownSurfaces: 2
    });
    expect(report.unknown.map((entry) => entry.base)).toEqual([
      "datei",
      "gewerkschaftern"
    ]);
  });

  it("behält den bisherigen Basen-/Pluralmodus für bestehende Audits bei", async () => {
    const report = await buildCoverageReport({
      observedGenderedBases: [
        { base: "nutzer", count: 2 },
        { base: "keinepersonform", count: 1 }
      ]
    });

    expect(report.version).toBe(1);
    expect(report.coverageMode).toBe("base-plural-legacy");
    expect(report.stats.knownUnique).toBe(1);
    expect(report.stats.unknownUnique).toBe(1);
    expect(report.unknown).toEqual([{ base: "keinepersonform", count: 1 }]);
  });
});
