import { describe, expect, it, vi } from "vitest";
import { createVerified60FpsWebm } from "../scripts/verified-60fps-media.mjs";
import { existsSync, readFileSync } from "node:fs";
import {spawnSync} from "node:child_process";
import path from "node:path";

const original = readFileSync("scripts/video-playback-regression.mjs", "utf8");
const workflow = readFileSync(".github/workflows/controlled-video-performance.yml", "utf8");
const header = Buffer.from("1a45dfa3", "hex");
const mockMedia = Buffer.concat([header, Buffer.alloc(2000)]);

describe("Manuelle lokale 60-FPS-Videodiagnose", () => {
  it.each([
    {mode:"unknown", args:["--browser", "chromium", "--browser-trace"]},
    {mode:"no-concurrent-recompilation", args:["--browser", "chromium"]},
    {mode:"no-concurrent-recompilation", args:["--browser", "firefox", "--browser-trace"]},
    {mode:"no-concurrent-recompilation", args:["--browser", "chromium", "--browser-trace", "--subtitle-only"]}
  ])("verweigert unbekannte oder uninstrumentierte Engine-Gegenproben: $args", ({mode, args}) => {
    const result = spawnSync(process.execPath, [path.resolve("scripts/video-playback-regression.mjs"), ...args], {
      env:{...process.env, VIDEO_ENGINE_CONTROL:mode}, encoding:"utf8", timeout:10_000
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Engine-Gegenprobe");
    expect(result.stdout).not.toContain("Verifiziertes lokales Videomaterial");
  });
  it("verifiziert die kodierte Framerate vor jedem Messlauf", () => {
    const temporaryFiles: string[] = [];
    const run = vi.fn((command: string, args: string[]) => {
      if (command === "ffmpeg") return { status: 0, stdout: mockMedia };
      const filename = args.at(-1);
      expect(filename).toBeTruthy();
      expect(readFileSync(filename!)).toEqual(mockMedia);
      temporaryFiles.push(filename!);
      return { status: 0, stdout: "60/1\n" };
    });
    expect(createVerified60FpsWebm(run)).toEqual(mockMedia);
    expect(run).toHaveBeenCalledTimes(2);
    expect(temporaryFiles).toHaveLength(1);
    expect(existsSync(temporaryFiles[0]!)).toBe(false);
    expect(run.mock.calls[0]?.[0]).toBe("ffmpeg");
    expect(run.mock.calls[1]?.[0]).toBe("ffprobe");
  });

  it("verweigert eine irreführende 30-FPS-Datei als 60-FPS-Messquelle", () => {
    const run = (command: string) => command === "ffmpeg"
      ? { status: 0, stdout: mockMedia }
      : { status: 0, stdout: "30/1\n" };
    expect(() => createVerified60FpsWebm(run)).toThrow("Verifizierung");
  });

  it("verweigert fehlende oder beschädigte Medien", () => {
    expect(() => createVerified60FpsWebm(() => ({
      status: 1, stdout: Buffer.from("Fehler"), stderr: "Kodierung fehlgeschlagen"
    }))).toThrow("WebM-Erzeugung");
  });

  it("bewahrt den bisherigen 30-FPS-Pflichtlauf unverändert als Standard", () => {
    expect(original).toContain('const diagnosticFps = fpsArgumentIndex < 0 ? 30');
    expect(original).toContain('diagnosticFps === 60');
    expect(original).toContain('Buffer.from(readFileSync(videoPath, "utf8").trim(), "base64")');
    expect(original).toContain("await validateSubtitleToggle(fixture.subtitleUrl)");
    expect(original).toContain("window.__subtitleCueLatenciesMs.push(");
  });

  it("führt die neue Videodiagnose nur manuell und ohne Releaseaktionen aus", () => {
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("--fps 60");
    expect(workflow).toContain("ffmpeg -version");
    expect(workflow).not.toMatch(/^\s*push:/mu);
    expect(workflow).not.toMatch(/^\s*pull_request:/mu);
    expect(workflow).not.toContain("release:");
  });
});
