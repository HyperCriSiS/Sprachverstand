import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const runner = readFileSync("scripts/chromium-cpu-mutation-profile.mjs", "utf8");
const workflow = readFileSync(".github/workflows/chromium-cpu-mutation-profile.yml", "utf8");

describe("Chromium-CPU-Diagnose unter Mutationslast", () => {
  it("nutzt den echten lokalen Chromium-Profilierer und archiviert Rohdaten", () => {
    expect(runner).toContain('"/goog/cdp/execute"');
    expect(runner).toContain('"Profiler.start"');
    expect(runner).toContain('"Profiler.stop"');
    expect(runner).toContain('"Profiler.setSamplingInterval"');
    expect(runner).toContain("profile.samples");
    expect(runner).toContain("profile.timeDeltas");
    expect(runner).toContain("JSON.stringify(profile)");
    expect(runner).toContain('server.listen(0, "127.0.0.1"');
  });

  it("vergleicht beide Browsermodi und zählt sämtliche Marker", () => {
    expect(runner).toContain('"--load-extension="');
    expect(runner).toContain('["baseline", "extension"]');
    expect(runner).toContain('["extension", "baseline"]');
    expect(runner).toContain("480");
    expect(runner).toContain("1400");
    expect(runner).toContain("offset < 48");
    expect(runner).toContain("unkorrigiert: spans.filter");
    expect(runner).toContain("nach400Ms");
    expect(runner).toContain("nach3900Ms");
  });

  it("bleibt ein manueller, nur lesender Diagnoseworkflow", () => {
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("contents: read");
    expect(workflow).toContain("actions/upload-artifact@");
    expect(workflow).not.toMatch(/^\s*(push|pull_request|schedule):/mu);
    expect(runner).not.toContain("https://");
  });
});
