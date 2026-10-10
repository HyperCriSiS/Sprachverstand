import { describe, expect, it, vi } from "vitest";
import { createVerified60FpsWebm } from "../scripts/verified-60fps-media.mjs";
import { readFileSync } from "node:fs";

const original = readFileSync("scripts/video-playback-regression.mjs", "utf8");
const workflow = readFileSync(".github/workflows/controlled-video-performance.yml", "utf8");
const header = Buffer.from("1a45dfa3", "hex");
const mockMedia = Buffer.concat([header, Buffer.alloc(2000)]);

describe("Manuelle lokale 60-FPS-Videodiagnose", () => {
  it("verifiziert die kodierte Framerate vor jedem Messlauf", () => {
    const run = vi.fn((command: string) => command === "ffmpeg"
      ? { status: 0, stdout: mockMedia }
      : { status: 0, stdout: "60/1\n" });
    expect(createVerified60FpsWebm(run)).toEqual(mockMedia);
    expect(run).toHaveBeenCalledTimes(2);
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
