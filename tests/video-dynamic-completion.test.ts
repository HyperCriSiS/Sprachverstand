import { expect, it } from "vitest";
import { videoDynamicCompletion } from "../scripts/video-dynamic-completion.mjs";

const neutral = () => Array.from({length: 480}, (_, index) => "Neutraler Inhalt " + index);
function produce(ticks: number, corrected = true) {
  const texts = neutral();
  for (let tick = 0; tick < ticks; tick += 1) {
    for (let offset = 0; offset < 48; offset += 1) {
      texts[(tick * 48 + offset) % 480] =
        (corrected ? "Nutzer " : "Nutzer:innen ") + tick + " / " + offset;
    }
  }
  return texts;
}

it("checks untouched slots before the first full rotation", () => {
  expect(videoDynamicCompletion(neutral(), 0, "extension").correct).toBe(480);
  expect(videoDynamicCompletion(produce(1), 1, "extension").correct).toBe(480);
  const incorrect = produce(1);
  incorrect[479] = "Nutzer 0 / 47";
  expect(videoDynamicCompletion(incorrect, 1, "extension").incorrectIndices).toEqual([479]);
});

it("requires the latest tick and offset after multiple rotations", () => {
  for (const ticks of [10, 11, 159, 160]) {
    expect(videoDynamicCompletion(produce(ticks), ticks, "extension").correct).toBe(480);
  }
  const stale = produce(11);
  stale[0] = "Nutzer 0 / 0";
  stale[479] = "Nutzer 9 / 46";
  expect(videoDynamicCompletion(stale, 11, "extension").incorrectIndices).toEqual([0, 479]);
});

it("requires raw marker texts in the baseline and corrected texts in the extension", () => {
  expect(videoDynamicCompletion(produce(12, false), 12, "baseline").correct).toBe(480);
  expect(videoDynamicCompletion(produce(12, false), 12, "extension").correct).toBe(0);
  expect(videoDynamicCompletion(produce(12), 12, "baseline").correct).toBe(0);
});

it("reports missing and extra slots without retaining page text", () => {
  const result = videoDynamicCompletion(produce(10).slice(0, 479), 10, "extension");
  expect(result).toEqual({total: 479, expected: 480, correct: 479, incorrectIndices: [479]});
  expect(videoDynamicCompletion([...produce(10), "extra"], 10, "extension").total).toBe(481);
  expect(JSON.stringify(result)).not.toContain("Nutzer");
});

it("rejects invalid tick observations", () => {
  for (const ticks of [-1, NaN, Infinity, 1.5]) {
    expect(() => videoDynamicCompletion(neutral(), ticks, "extension")).toThrow();
  }
});
