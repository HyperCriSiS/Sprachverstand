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
    expect(runner).toContain('runMode(fixture.url, "baseline")');
    expect(runner).toContain('runMode(fixture.url, "extension")');
    expect(runner).toContain("requestVideoFrameCallback");
    expect(runner).toContain("getVideoPlaybackQuality");
    expect(runner).toContain("gapsOver120Ms");
    expect(runner).not.toMatch(/https:\/\//u);
  });

  it("hält ein echtes eingebettetes WebM-Testvideo vor", () => {
    expect(videoFixture.length).toBeGreaterThan(5_000);
    expect(Buffer.from(videoFixture, "base64").subarray(0, 4).toString("hex")).toBe(
      "1a45dfa3"
    );
  });
});
