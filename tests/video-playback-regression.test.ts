import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const runner = readFileSync("scripts/video-playback-regression.mjs", "utf8");
const workflow = readFileSync(".github/workflows/ci.yml", "utf8");
const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
  readonly scripts: Record<string, string>;
};
const videoFixture = readFileSync(
  "tests/browser/video-playback-30fps.webm.b64",
  "utf8"
).trim();

describe("Video-Playback-Regression", () => {
  it("läuft als echter Chromium-Test und nicht als DOM-Benchmark", () => {
    expect(packageJson.scripts["test:browser:video:chromium"]).toBe(
      "node scripts/video-playback-regression.mjs"
    );
    expect(workflow).toContain("npm run test:browser:video:chromium");
    expect(workflow.indexOf("npm run test:browser:video:chromium")).toBeLessThan(
      workflow.indexOf("name: Performance")
    );
  });

  it("vergleicht lokale Baseline und Erweiterung ohne externes Videonetzwerk", () => {
    expect(runner).toContain('run(url, "baseline")');
    expect(runner).toContain('run(url, "extension")');
    expect(runner).toContain("measureVideoPair(fixture.url, 1)");
    expect(runner).toContain("requestVideoFrameCallback");
    expect(runner).toContain("getVideoPlaybackQuality");
    expect(runner).toContain("gapsOver120Ms");
    expect(runner).not.toMatch(/https:\/\//u);
  });

  it("bestätigt ausschließlich eine Frame-Ratio-Unterschreitung einmalig", () => {
    expect(runner).toContain("class VideoFrameRatioError extends Error");
    expect(runner).toContain("if (frameRatio < 0.8)");
    expect(runner).toContain("if (!(error instanceof VideoFrameRatioError))");
    expect(runner).toContain("measureVideoPair(fixture.url, 2)");
    expect(runner).toContain("validateComparison(baseline, extension);");
    expect(runner).not.toContain("measureVideoPair(fixture.url, 3)");
  });

  it("hält ein echtes eingebettetes WebM-Testvideo vor", () => {
    expect(videoFixture.length).toBeGreaterThan(1_500);
    expect(Buffer.from(videoFixture, "base64").subarray(0, 4).toString("hex")).toBe(
      "1a45dfa3"
    );
  });
});