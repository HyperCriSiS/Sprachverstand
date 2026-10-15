import {describe, expect, it} from "vitest";
import {videoGapEpisodes, videoCallbackGapEpisodes, videoPresentationProgress} from "../scripts/video-gap-episodes.mjs";

describe("Video callback gaps and actual frame progress", () => {
  it("keeps unreported presentations distinct from omitted source frames", () => {
    expect(videoPresentationProgress([
      {nowMs:0, mediaTime:0, presentedFrames:1},
      {nowMs:100, mediaTime:.1, presentedFrames:7}
    ], 60)).toEqual({sourceFps:60, sourceFrameSpan:6, presentedFrameSpan:6,
      callbackIntervals:1, unreportedPresentations:5, omittedSourceFrames:0,
      locatedOmissionsModulo3:[0,0,0], unlocatedOmissions:0});
  });
  it("locates omissions only between consecutive observed presentations", () => {
    expect(videoPresentationProgress([
      {nowMs:0, mediaTime:0, presentedFrames:1},
      {nowMs:33, mediaTime:.033, presentedFrames:2},
      {nowMs:100, mediaTime:.1, presentedFrames:4}
    ], 60)).toEqual({sourceFps:60, sourceFrameSpan:6, presentedFrameSpan:3,
      callbackIntervals:2, unreportedPresentations:1, omittedSourceFrames:3,
      locatedOmissionsModulo3:[0,1,0], unlocatedOmissions:2});
  });
  it("counts long source gaps without allocating a row per missing frame", () => {
    expect(videoPresentationProgress([
      {nowMs:0, mediaTime:0, presentedFrames:0},
      {nowMs:1, mediaTime:1000000, presentedFrames:1}
    ], 60)?.locatedOmissionsModulo3).toEqual([19999999,20000000,20000000]);
  });
  it("uses the explicit verified source rate", () => {
    const frames=[{nowMs:0, mediaTime:0, presentedFrames:1},
      {nowMs:33, mediaTime:1/30, presentedFrames:2}];
    expect(videoPresentationProgress(frames, 30)?.omittedSourceFrames).toBe(0);
    expect(videoPresentationProgress(frames, 60)?.omittedSourceFrames).toBe(1);
    expect(videoPresentationProgress(frames, 59.94)).toBeUndefined();
  });
  it("does not invent progress across looping media or reset presentation counters", () => {
    expect(videoPresentationProgress([
      {nowMs:0, mediaTime:11.9, presentedFrames:714},
      {nowMs:200, mediaTime:.1, presentedFrames:726}
    ], 60)).toBeUndefined();
    expect(videoPresentationProgress([
      {nowMs:0, mediaTime:0, presentedFrames:100},
      {nowMs:100, mediaTime:.1, presentedFrames:3}
    ], 60)).toBeUndefined();
  });
  it("rejects incomplete, invalid and inconsistent presentation data", () => {
    expect(videoPresentationProgress([],60)).toBeUndefined();
    const first={nowMs:0,mediaTime:0,presentedFrames:0};
    for(const last of [
      {nowMs:1,mediaTime:NaN,presentedFrames:1},
      {nowMs:1,mediaTime:.1,presentedFrames:1.5},
      {nowMs:1,mediaTime:.1,presentedFrames:0},
      {nowMs:1,mediaTime:.01,presentedFrames:2},
      {nowMs:1,mediaTime:.025,presentedFrames:1},
      {nowMs:1,mediaTime:Number.MAX_VALUE,presentedFrames:1}
    ])expect(videoPresentationProgress([first,last],60)).toBeUndefined();
  });
  it("uses observed callback entry instead of a stale rendering timestamp for task correlation", () => {
    const task = {startMs:40, durationMs:144};
    const frames = [
      {nowMs:10, callbackAtMs:12, mediaTime:1, presentedFrames:60},
      {nowMs:30, callbackAtMs:190, mediaTime:1.15, presentedFrames:69}
    ];
    expect(videoGapEpisodes(frames, [task])).toEqual([]);
    expect(videoCallbackGapEpisodes(frames, [task])).toEqual([
      {startMs:12, endMs:190, gapMs:178, presentedFramesDelta:9,
        mediaTimeDelta:1.15 - 1, longTasks:[task]}
    ]);
  });
  it("does not turn old or partially observed callback clocks into measurements", () => {
    expect(videoCallbackGapEpisodes([], [])).toBeUndefined();
    expect(videoCallbackGapEpisodes([{nowMs:10, mediaTime:1, presentedFrames:60}], [])).toBeUndefined();
    expect(videoCallbackGapEpisodes([
      {nowMs:10, callbackAtMs:12, mediaTime:1, presentedFrames:60},
      {nowMs:30, mediaTime:1.02, presentedFrames:61}
    ], [])).toBeUndefined();
  });
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
