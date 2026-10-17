import { describe, expect, it } from "vitest";
import { assessExternalVideoPlayback, assessExternalSubtitlePlayback } from "../scripts/real-world-media-validation.mjs";

const validVideos = {
  count: 1,
  playingCount: 1,
  currentTimeSeconds: 4.5,
  frameCallbacks: 80,
  textTrackCount: 1,
  showingTextTrackCount: 1
};

describe("Externe Videobelege in der Live-Matrix", () => {
  it("verlangt Caption-Wechsel und nachgewiesene Wiedergabe für aktive Untertitel", () => {
    expect(assessExternalSubtitlePlayback(true,{changes:3,initialText:true},{state:"measured"}))
      .toEqual({requested:true,captionChanges:3,initialText:true,measured:true});
    expect(assessExternalSubtitlePlayback(true,{changes:3},{state:"unavailable"}).measured).toBe(false);
    expect(assessExternalSubtitlePlayback(true,{changes:0},{state:"measured"}).measured).toBe(false);
    expect(assessExternalSubtitlePlayback(false,{changes:3},{state:"measured"}).measured).toBeNull();
  });
  it.each([undefined,null,{changes:-1},{changes:NaN},{changes:"3"},{changes:Infinity}])
    ("wertet ungültige Caption-Beobachtungen nicht als Untertitelnachweis: %j", observations => {
      expect(assessExternalSubtitlePlayback(true,observations,{state:"measured"}).measured).toBe(false);
    });
  it("kennzeichnet Webseiten ohne Videofokus nicht als Videomessung", () => {
    expect(assessExternalVideoPlayback("github-sprachverstand", validVideos, 0)).toBeUndefined();
  });

  it("wertet nur nachgewiesene Wiedergabe mit Frames und Fortschritt als gemessen", () => {
    for (const siteSlug of ["videojs-player-demo", "youtube-big-buck-bunny"]) {
      const result = assessExternalVideoPlayback(siteSlug, validVideos, 3);
      expect(result.state).toBe("measured");
      expect(result.progressedSeconds).toBe(1.5);
      expect(result.frameCallbacks).toBe(80);
    }
  });

  it("lässt YouTube ohne Framecallbacks explizit ungemessen", () => {
    expect(assessExternalVideoPlayback(
      "youtube-big-buck-bunny", { ...validVideos, frameCallbacks: 0 }, 3
    ).state).toBe("unavailable");
  });

  it("akzeptiert weder nur vorhandene noch pausierte oder stehende Medien", () => {
    expect(assessExternalVideoPlayback(
      "videojs-player-demo", { ...validVideos, count: 0 }, 3
    ).state).toBe("unavailable");
    expect(assessExternalVideoPlayback(
      "videojs-player-demo", { ...validVideos, playingCount: 0 }, 3
    ).state).toBe("unavailable");
    expect(assessExternalVideoPlayback(
      "videojs-player-demo", { ...validVideos, currentTimeSeconds: 3.2 }, 3
    ).state).toBe("unavailable");
  });

  it("behandelt einen unbekannten Ausgangszeitpunkt als nicht messbar", () => {
    const result = assessExternalVideoPlayback("youtube-big-buck-bunny", validVideos, undefined);
    expect(result.state).toBe("unavailable");
    expect(result.progressedSeconds).toBeNull();
  });
});
