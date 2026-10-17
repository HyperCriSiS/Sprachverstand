import {expect, it} from "vitest";
import {videoSchedulingProgress, type SchedulingObservation} from "../scripts/video-scheduling-progress.mjs";

const episode = {startMs: 100, endMs: 500};
const observation = (): SchedulingObservation => ({supported: true, startedAtMs: 20, finishedAtMs: 8000,
  truncated: false, timerSamples: [120, 170, 220, 270, 320, 370, 420, 470].map(nowMs => ({nowMs})),
  animationSamples: [{callbackAtMs: 80}, {callbackAtMs: 520}]});

it("distinguishes continuing page tasks from absent animation callbacks", () => {
  expect(videoSchedulingProgress(episode, observation())).toEqual({observed: true,
    timer: {callbacks: 8, maximumSilenceMs: 50}, animation: {callbacks: 0, maximumSilenceMs: 400}});
});

it("uses callback entry instead of the rendering-step timestamp", () => {
  const sampled = {...observation(), animationSamples: [
    {nowMs: 40, callbackAtMs: 120}, {nowMs: 50, callbackAtMs: 320}, {nowMs: 60, callbackAtMs: 480}]};
  const result = videoSchedulingProgress(episode, sampled);
  expect(result?.observed ? result.animation : undefined).toEqual({callbacks: 3, maximumSilenceMs: 200});
});

it("does not count callbacks at both episode boundaries twice", () => {
  const sampled = {...observation(), animationSamples: [100, 300, 500].map(callbackAtMs => ({callbackAtMs}))};
  const result = videoSchedulingProgress(episode, sampled);
  expect(result?.observed ? result.animation : undefined).toEqual({callbacks: 1, maximumSilenceMs: 200});
});

it("keeps unsupported and older unobserved data explicitly unmeasured", () => {
  expect(videoSchedulingProgress(episode, undefined)).toBeUndefined();
  expect(videoSchedulingProgress(episode, null)).toBeUndefined();
  expect(videoSchedulingProgress(episode, {...observation(), supported: false})).toBeUndefined();
});

it("does not attribute silence after the observer finished", () => {
  expect(videoSchedulingProgress(episode, {...observation(), finishedAtMs: 480,
    animationSamples: [{callbackAtMs: 80}]})).toEqual(
    {observed: false, reason: "outside-observation-window"});
});

it("does not attribute silence before registration or after truncation", () => {
  expect(videoSchedulingProgress(episode, {...observation(), startedAtMs: 110,
    animationSamples: [{callbackAtMs: 520}]})).toEqual(
    {observed: false, reason: "outside-observation-window"});
  expect(videoSchedulingProgress(episode, {...observation(), truncated: true})).toEqual(
    {observed: false, reason: "truncated"});
});

it("rejects invalid clocks rather than reporting zero progress", () => {
  for (const animationSamples of [[{callbackAtMs: NaN}], [{callbackAtMs: 9000}],
    [{callbackAtMs: 130}, {callbackAtMs: 120}]]) {
    expect(() => videoSchedulingProgress(episode, {...observation(), animationSamples})).toThrow();
  }
  expect(() => videoSchedulingProgress({startMs: 500, endMs: 100}, observation())).toThrow();
});

it("records an empty callback stream as observed only inside its coverage", () => {
  const empty = {...observation(), timerSamples: [], animationSamples: []};
  expect(videoSchedulingProgress(episode, empty)).toEqual({observed: true,
    timer: {callbacks: 0, maximumSilenceMs: 400}, animation: {callbacks: 0, maximumSilenceMs: 400}});
});

it("rejects reports that exceed the bounded observation size", () => {
  expect(() => videoSchedulingProgress(episode, {...observation(),
    timerSamples: Array.from({length: 2049}, () => ({nowMs: 120}))})).toThrow();
});
