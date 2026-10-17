export function isReadySubtitleState(state, corrected, previous) {
  const expected = corrected ? /^Nutzer im Untertitel \d+$/u : /^Nutzer:innen im Untertitel \d+$/u;
  return state.normal === "Nutzer" && expected.test(state.subtitle ?? "") &&
    state.ready >= 2 && !state.paused && !state.error && state.ticks >= 1 &&
    (!previous || (state.timeUpdates > previous.timeUpdates &&
      (previous.ticks === undefined || state.ticks > previous.ticks)));
}
