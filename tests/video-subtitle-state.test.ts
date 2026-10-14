import { expect, it } from "vitest";
import { isReadySubtitleState } from "../scripts/video-subtitle-state.mjs";

const off = {normal: "Nutzer", subtitle: "Nutzer:innen im Untertitel 1", ready: 4,
  paused: false, error: null, ticks: 1, timeUpdates: 3};

it("waits for playback and a new cue after a fast restoration", () => {
  expect(isReadySubtitleState(off, false)).toBe(true);
  expect(isReadySubtitleState(off, false, {ticks: 1, timeUpdates: 3})).toBe(false);
  expect(isReadySubtitleState({...off, timeUpdates: 4}, false, off)).toBe(false);
  expect(isReadySubtitleState({...off, ticks: 2}, false, off)).toBe(false);
  expect(isReadySubtitleState({...off, ticks: 2, timeUpdates: 4,
    subtitle: "Nutzer:innen im Untertitel 2"}, false, off)).toBe(true);
});

it("requires playback progress when enabling without demanding a new cue", () => {
  const on = {...off, subtitle: "Nutzer im Untertitel 1"};
  expect(isReadySubtitleState(on, true, {timeUpdates: 3})).toBe(false);
  expect(isReadySubtitleState({...on, timeUpdates: 4}, true, {timeUpdates: 3})).toBe(true);
});

it("does not accept the wrong extension or subtitle state", () => {
  expect(isReadySubtitleState(off, true)).toBe(false);
  expect(isReadySubtitleState({...off, normal: "Nutzer:innen"}, false)).toBe(false);
  expect(isReadySubtitleState({...off, subtitle: ""}, false)).toBe(false);
});

it("keeps stopped, undecoded and failed playback invalid", () => {
  for (const change of [{paused: true}, {ready: 1}, {ticks: 0}, {error: "decode failed"}]) {
    expect(isReadySubtitleState({...off, ...change}, false)).toBe(false);
  }
});
