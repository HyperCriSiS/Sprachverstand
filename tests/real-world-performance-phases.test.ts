import { describe, expect, it } from "vitest";
import { comparePhaseDurations, realWorldPhaseNames, summarizePairedRuns } from "../scripts/real-world-performance-phases.mjs";

function paar(index: number, startDiff: number, visitDiff: number, longTaskDiff: number) {
  const baseline = {
    status: "ok",
    phasesMs: { browserStartupMs: 100, navigationMs: 30 },
    elapsedMs: 230
  };
  const extension = {
    status: "ok",
    phasesMs: { browserStartupMs: 100 + startDiff, navigationMs: 30 + visitDiff },
    elapsedMs: 230 + startDiff + visitDiff
  };
  return {
    pair: index,
    order: index % 2 === 1 ? ["baseline", "extension"] : ["extension", "baseline"],
    baseline, extension,
    comparison: {
      elapsedDeltaMs: startDiff + visitDiff,
      visitDeltaMs: visitDiff,
      totalLongTaskDeltaMs: longTaskDiff,
      afterObserverLongTaskDeltaMs: longTaskDiff / 2,
      phaseDeltaMs: comparePhaseDurations(baseline.phasesMs, extension.phasesMs)
    }
  };
}

describe("Gepaarte Live-Browsermessung", () => {
  it("trennt Browserstart und eigentlichen Besuch", () => {
    const pair = paar(1, 1700, 14, 100);
    expect(pair.comparison.elapsedDeltaMs).toBe(1714);
    expect(pair.comparison.visitDeltaMs).toBe(14);
    expect(pair.comparison.phaseDeltaMs.browserStartupMs).toBe(1700);
    expect(pair.comparison.phaseDeltaMs.navigationMs).toBe(14);
  });

  it("fasst Wiederholungen durch Median statt durch den letzten Lauf zusammen", () => {
    const result = summarizePairedRuns([
      paar(1, 1700, 14, 100),
      paar(2, 25, -10, 60),
      paar(3, 30, 8, 80)
    ]);
    expect(result.requestedPairs).toBe(3);
    expect(result.validPairs).toBe(3);
    expect(result.medianPhaseDeltaMs.browserStartupMs).toBe(30);
    expect(result.medianVisitDeltaMs).toBe(8);
    expect(result.medianLongTaskDeltaMs).toBe(80);
  });

  it("berücksichtigt nur vollständige A/B-Paare", () => {
    const broken = paar(2, 5, 5, 10);
    broken.extension.status = "error";
    const result = summarizePairedRuns([paar(1, 1, 2, 3), broken]);
    expect(result.requestedPairs).toBe(2);
    expect(result.validPairs).toBe(1);
    expect(result.medianElapsedDeltaMs).toBe(3);
  });

  it("liefert bei fehlender Vergleichbarkeit keine erfundenen Messwerte", () => {
    const result = summarizePairedRuns([{ baseline: { status: "error" }, extension: { status: "error" } }]);
    expect(result.validPairs).toBe(0);
    expect(result.medianVisitDeltaMs).toBeNull();
    expect(result.medianPhaseDeltaMs.navigationMs).toBeNull();
  });

  it("kennzeichnet jede nicht gemessene Phase ausdrücklich mit null", () => {
    const delta = comparePhaseDurations({ browserStartupMs: 5 }, { browserStartupMs: 8 });
    expect(delta.browserStartupMs).toBe(3);
    expect(delta.navigationMs).toBeNull();
    expect(Object.keys(delta)).toEqual([...realWorldPhaseNames]);
  });
});
