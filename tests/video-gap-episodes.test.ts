import {describe, expect, it} from "vitest";
import {videoGapEpisodes} from "../scripts/video-gap-episodes.mjs";

describe("Video callback gaps and actual frame progress", () => {
  it("does not label continued presentation during delayed callbacks as lost frames", () => {
    expect(videoGapEpisodes([
      {nowMs: 10, mediaTime: 1, presentedFrames: 60},
      {nowMs: 210, mediaTime: 1.2, presentedFrames: 72}
    ], [])).toEqual([{startMs: 10, endMs: 210, gapMs: 200,
      presentedFramesDelta: 12, mediaTimeDelta: 1.2 - 1, longTasks: []}]);
  });
  it("includes a long task beginning before the callback gap and excludes boundary-only contact", () => {
    const overlapping = {startMs: 5, durationMs: 150};
    expect(videoGapEpisodes([
      {nowMs: 10, mediaTime: 1, presentedFrames: 60},
      {nowMs: 210, mediaTime: 1.02, presentedFrames: 61}
    ], [{startMs: 0, durationMs: 10}, overlapping,
      {startMs: 210, durationMs: 50}])[0]?.longTasks).toEqual([overlapping]);
  });
  it("preserves media time resets from looping instead of inventing forward progress", () => {
    expect(videoGapEpisodes([
      {nowMs: 10, mediaTime: 11.9, presentedFrames: 714},
      {nowMs: 210, mediaTime: 0.1, presentedFrames: 726}
    ], [])[0]?.mediaTimeDelta).toBeLessThan(0);
  });
  it("ignores ordinary frame intervals and empty sequences", () => {
    expect(videoGapEpisodes([], [])).toEqual([]);
    expect(videoGapEpisodes([
      {nowMs: 0, mediaTime: 0, presentedFrames: 0},
      {nowMs: 120, mediaTime: 0.12, presentedFrames: 7}
    ], [])).toEqual([]);
  });
});
