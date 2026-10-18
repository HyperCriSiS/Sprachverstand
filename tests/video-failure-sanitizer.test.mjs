// @vitest-environment node
import {afterEach, expect, it} from "vitest";
import {mkdtemp, readFile, readdir, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {exportVideoFailures, sanitizeVideoFailure, videoBrowserVersion} from "../scripts/sanitize-video-failure.mjs";

const directories = [];
afterEach(async () => {
  for (const directory of directories.splice(0)) {
    if (!directory.startsWith(path.join(os.tmpdir(), "sprachverstand-video-filter-"))) throw Error("Unsafe cleanup");
    await rm(directory, {recursive:true, force:true});
  }
});
function fixture() {
  const role = mode => ({mode, browserVersion:"155.0.8059.0", driverVersion:"155.0.8059.39",
    currentTime:8, droppedVideoFrames:42, mutationTicks:160,
    dynamicCompletion:{total:480, expected:480, correct:480},
    frames:{callbacks:3, p95GapMs:66.7, maximumGapMs:66.7, gapsOver120Ms:0},
    frameSamples:[0, 1, 3].map((index, i) => ({nowMs:index * 1000 / 30, mediaTime:index / 30, presentedFrames:i + 1})),
    focused:true, visibilityState:"visible", longTaskSupported:null, longTasks:[], visibilityEvents:[]});
  return {browser:"chromium", sourceFps:30,
    sourceHash:"13f69752b5dc9e85842e1eacd71f03f36f83de9d3b6ce8321fd2fc4c09d842cd",
    pairOrder:"baseline-first", baseline:role("baseline"), extension:role("extension")};
}
it("retains source omissions while stripping arbitrary text, traces and identifiers", () => {
  const input = fixture();
  Object.assign(input, {sessionId:"PRIVATE", profile:"PRIVATE", traceFile:"PRIVATE"});
  Object.assign(input.extension, {staticText:"PRIVATE", errors:["PRIVATE"]});
  input.extension.frameSamples[0].deviceId = "PRIVATE";
  const result = sanitizeVideoFailure(input);
  expect(JSON.stringify(result)).not.toContain("PRIVATE");
  expect(result.extension.presentationProgress.locatedOmissionsModulo3).toEqual([0, 0, 1]);
  expect(result.extension.longTaskObservation).toBe("not-enabled");
  expect(result.extension.frameSamples[0].focused).toBeNull();
});
it("keeps observed long tasks separate from absent observations", () => {
  const input = fixture();
  input.extension.longTaskSupported = true;
  input.extension.longTasks = [{startMs:12, durationMs:52, private:"PRIVATE"}];
  const result = sanitizeVideoFailure(input);
  expect(result.extension.longTaskObservation).toBe("observed");
  expect(result.extension.longTasks).toEqual([{startMs:12, durationMs:52}]);
  expect(result.baseline.longTaskObservation).toBe("not-enabled");
});
it("rejects changed sources, invalid numbers, unknown versions and unbounded arrays", () => {
  const mutations = [p => p.sourceFps = 60, p => p.sourceHash = "other", p => p.browser = "firefox",
    p => p.extension.mode = "baseline", p => p.extension.currentTime = Infinity,
    p => p.extension.droppedVideoFrames = -1, p => p.extension.browserVersion = "PRIVATE",
    p => p.extension.frameSamples = Array(2049).fill(p.extension.frameSamples[0]),
    p => p.extension.frames.callbacks = 2, p => p.extension.focused = "true",
    p => p.extension.longTaskSupported = "unknown"];
  for (const mutate of mutations) {const input = fixture(); mutate(input); expect(() => sanitizeVideoFailure(input)).toThrow();}
});
it("extracts only version numbers from negotiated capability strings", () => {
  expect(videoBrowserVersion("155.0.8059.39 (driver build PRIVATE)")).toBe("155.0.8059.39");
  expect(videoBrowserVersion("157.0.1")).toBe("157.0.1");
  expect(videoBrowserVersion("157.0")).toBe("157.0");
  expect(videoBrowserVersion("0.36.0 (driver PRIVATE)")).toBe("0.36.0");
  expect(videoBrowserVersion("157")).toBe("unknown");
  expect(videoBrowserVersion("157.0.1.2.3")).toBe("unknown");
  expect(videoBrowserVersion("157.0.1/PRIVATE")).toBe("unknown");
  expect(videoBrowserVersion(undefined)).toBe("unknown");
  expect(videoBrowserVersion("file:///PRIVATE")).toBe("unknown");
});
it("exports only two fixed pair paths and never overwrites previous evidence", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "sprachverstand-video-filter-")); directories.push(directory);
  await writeFile(path.join(directory, "video-pair-chromium-30-1.json"), JSON.stringify(fixture()));
  await writeFile(path.join(directory, "video-browser-trace.json"), "PRIVATE");
  await writeFile(path.join(directory, "video-pair-chromium-60-1.json"), "PRIVATE");
  expect(await exportVideoFailures(directory)).toBe(1);
  const output = await readFile(path.join(directory, "sanitized-video-failure-1.json"), "utf8");
  expect(output).not.toContain("PRIVATE");
  expect((await readdir(directory)).filter(name => name.startsWith("sanitized-"))).toEqual(["sanitized-video-failure-1.json"]);
  await expect(exportVideoFailures(directory)).rejects.toThrow();
  expect(await readFile(path.join(directory, "sanitized-video-failure-1.json"), "utf8")).toBe(output);
});
it("reports absent pairs without manufacturing evidence and rejects oversized raw files", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "sprachverstand-video-filter-")); directories.push(directory);
  expect(await exportVideoFailures(directory)).toBe(0);
  await writeFile(path.join(directory, "video-pair-chromium-30-1.json"), " ".repeat(1024 * 1024 + 1));
  await expect(exportVideoFailures(directory)).rejects.toThrow("Oversized");
});
it('preserves numeric P99 while legacy missing observations stay unknown',()=>{
 const input=fixture();input.extension.frames.p99GapMs=83.3;
 const output=sanitizeVideoFailure(input);
 expect(output.extension.frames.p99GapMs).toBe(83.3);
 expect(output.baseline.frames.p99GapMs).toBeNull();
 for(const invalid of [-1,Infinity,'PRIVATE']){input.extension.frames.p99GapMs=invalid;expect(()=>sanitizeVideoFailure(input)).toThrow();}
});
