import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { analysiereVideoCpu, frameLuecken } from "../scripts/video-frame-cpu-metrics.mjs";

describe("Frame-Lücken und CPU-Samples zeitlich korrelieren", () => {
  it("ignoriert die ersten 15 Video-Frameintervalle", () => {
    const frames = Array.from({ length: 18 }, (_, index) => index * 17);
    frames[15] = 450;
    frames[16] = 466;
    frames[17] = 617;
    expect(frameLuecken(frames)).toEqual([
      { index: 17, startMs: 466, endMs: 617, dauerMs: 151 }
    ]);
  });

  it("ordnet einen Erweiterungs-Hotspot nur der zugehörigen Frame-Lücke zu", () => {
    const profile = {
      startTime: 1_000_000,
      nodes: [
        { id: 1, callFrame: { functionName: "beispiel", url: "chrome-extension://abcdefgh/content.js" } },
        { id: 2, callFrame: { functionName: "(idle)", url: "" } }
      ],
      samples: [2, 1, 1, 2],
      timeDeltas: [50_000, 100_000, 90_000, 20_000]
    };
    const frames = Array.from({ length: 16 }, (_, i) => i * 10);
    frames.push(350);
    const result = analysiereVideoCpu(profile, -1000, frames,
      [{ startMs: 200, dauerMs: 80 }]);
    expect(result.achsePlausibel).toBe(true);
    expect(result.lueckenAb120Ms).toBe(1);
    expect(result.spitzen[0]!.longTasks).toHaveLength(1);
    expect(result.spitzen[0]!.sampledCpuMs.erweiterung).toBe(190);
    expect(result.spitzen[0]!.topFunktionen[0]!.name).toContain("beispiel");
  });

  it("meldet eine unplausible Zeitachse statt eine scheinbare Korrelation", () => {
    const result = analysiereVideoCpu({
      startTime: 9_000_000,
      nodes: [{ id: 1, callFrame: { functionName: "x", url: "" } }],
      samples: [1], timeDeltas: [1000]
    }, 0, [0, 100]);
    expect(result.achsePlausibel).toBe(false);
  });

  it("hält CI und Release-Gates unverändert", () => {
    const runner = readFileSync("scripts/video-frame-cpu-correlation.mjs", "utf8");
    const workflow = readFileSync(".github/workflows/video-frame-cpu-correlation.yml", "utf8");
    expect(runner).toContain('"Profiler.start"');
    expect(runner).toContain('"Profiler.stop"');
    expect(runner).toContain('"Performance.getMetrics"');
    expect(runner).toContain("createVerified60FpsWebm");
    expect(runner).toContain("requestVideoFrameCallback");
    expect(runner).toContain("48");
    expect(runner).toContain("480");
    expect(runner).toContain("longtask");
    expect(runner).not.toContain("https://");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("contents: read");
    expect(workflow).not.toMatch(/^\s*(push|pull_request|schedule):/mu);
  });
});
