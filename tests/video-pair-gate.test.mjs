import {describe, expect, it} from "vitest";
import {aggregateVideoRole, settledDroppedFrames, videoPairOrders,
  videoPerformanceViolations} from "../scripts/video-pair-gate.mjs";

function role({callbacks = 230, p95 = 41.7, maximum = 50, over120 = 0, dropped = 1, settledStart} = {}) {
  return {frames: {callbacks, p95GapMs: p95, maximumGapMs: maximum, gapsOver120Ms: over120},
    droppedVideoFrames: dropped,
    ...(settledStart === undefined ? {} : {settledDroppedVideoFramesStart: settledStart})};
}

describe("Videovergleich über mehrere Paare", () => {
  it("bewertet den aufgezeichneten Startausreißer 1/9 Drops nicht als Regression", () => {
    // CI 39073664813: neun der dreizehn Auslassungen lagen im Start.
    const baseline = [role({dropped: 1, settledStart: 1}), role(), role()];
    const extension = [role({dropped: 13, settledStart: 9, maximum: 83.4}), role({dropped: 2}), role({dropped: 1})];
    expect(videoPerformanceViolations(baseline, extension).violations).toEqual([]);
  });

  it("schlägt bei gleichmäßig verschlechterter Wiedergabe weiterhin fehl", () => {
    // Gegenprobe: eine Erweiterung, die in jedem Paar Frames verliert und
    // lange Lücken erzeugt, darf durch den Median nicht verdeckt werden.
    const baseline = [role(), role(), role()];
    const slow = () => role({callbacks: 150, p95: 190, maximum: 520, over120: 6, dropped: 30, settledStart: 2});
    const {violations} = videoPerformanceViolations(baseline, [slow(), slow(), slow()]);
    expect(violations).toHaveLength(5);
  });

  it("verdeckt keine Regression, die in der Mehrheit der Paare auftritt", () => {
    const baseline = [role(), role(), role()];
    const extension = [role(), role({dropped: 20}), role({dropped: 25})];
    expect(videoPerformanceViolations(baseline, extension).violations)
      .toEqual([expect.stringMatching(/verworfene Videoframes/)]);
  });

  it("zählt ohne Startmarke alle Drops, damit alte Berichte nicht milder bewertet werden", () => {
    expect(settledDroppedFrames(role({dropped: 9}))).toBe(9);
    expect(settledDroppedFrames(role({dropped: 9, settledStart: 7}))).toBe(2);
    expect(settledDroppedFrames(role({dropped: 9, settledStart: 12}))).toBe(9);
  });

  it("verwendet den Median je Kennzahl", () => {
    expect(aggregateVideoRole([role({p95: 10}), role({p95: 40}), role({p95: 30})]).p95GapMs).toBe(30);
    expect(aggregateVideoRole([role({callbacks: 200}), role({callbacks: 220})]).callbacks).toBe(210);
  });

  it("wechselt die Reihenfolge und verlangt gleich viele Messungen", () => {
    expect(videoPairOrders(3)).toEqual(["baseline-first", "extension-first", "baseline-first"]);
    expect(() => videoPairOrders(0)).toThrow();
    expect(() => videoPerformanceViolations([role()], [])).toThrow(/ungleich/);
  });
});
