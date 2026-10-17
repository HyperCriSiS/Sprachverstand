const externalVideoSites = new Set([
  "videojs-player-demo",
  "youtube-big-buck-bunny"
]);

/**
 * Eine vorhandene Videospur allein ist kein Wiedergabenachweis.
 * Beide verglichenen Sitzungen müssen echte Framecallbacks und
 * einen messbaren zeitlichen Fortschritt vorweisen.
 */
export function assessExternalVideoPlayback(siteSlug, videos, beforePlayback) {
  if (!externalVideoSites.has(siteSlug)) {
    return undefined;
  }

  const frameCallbacks = Number(videos?.frameCallbacks ?? 0);
  const currentTime = Number(videos?.currentTimeSeconds ?? 0);
  const initialTime = Number(beforePlayback);
  const progressedSeconds = currentTime - initialTime;
  const measurable = Number(videos?.count ?? 0) > 0 &&
    Number(videos?.playingCount ?? 0) > 0 &&
    frameCallbacks >= 2 &&
    Number.isFinite(progressedSeconds) &&
    progressedSeconds >= 0.5;

  return {
    state: measurable ? "measured" : "unavailable",
    progressedSeconds: Number.isFinite(progressedSeconds)
      ? progressedSeconds : null,
    frameCallbacks,
    textTracks: Number(videos?.textTrackCount ?? 0),
    showingTextTracks: Number(videos?.showingTextTrackCount ?? 0)
  };
}

export function assessExternalSubtitlePlayback(requested, observations, mediaValidation) {
  const changes = observations?.changes;
  const captionChanges = Number.isSafeInteger(changes) && changes >= 0 ? changes : 0;
  return {
    requested,
    captionChanges,
    initialText: observations?.initialText === true,
    measured: requested ? mediaValidation?.state === "measured" && captionChanges > 0 : null
  };
}
