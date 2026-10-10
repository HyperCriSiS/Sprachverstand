import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const runner = readFileSync("scripts/controlled-interaction-performance.mjs", "utf8");
const workflow = readFileSync(".github/workflows/controlled-interaction-performance.yml", "utf8");
const ci = readFileSync(".github/workflows/ci.yml", "utf8");
const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
  readonly scripts: Record<string, string>;
};

describe("Lokale echte Chromium-Interaktionsdiagnose", () => {
  it("nutzt frische Sessions, alternierende Paare und eine feste lokale HTML-Fixture", () => {
    expect(runner).toContain('const reihenfolge = index % 2 === 0');
    expect(runner).toContain('["baseline", "extension"]');
    expect(runner).toContain('["extension", "baseline"]');
    expect(runner).toContain('server.listen(0, "127.0.0.1"');
    expect(runner).toContain('pageLoadStrategy: "eager"');
    expect(runner).not.toContain("https://");
  });

  it("sendet echte WebDriver-Klicks und Tastaturereignisse", () => {
    expect(runner).toContain('"/element/" + button + "/click"');
    expect(runner).toContain('"/element/" + eingabe + "/value"');
    expect(runner).toContain('text: " test"');
    expect(runner).toContain('m.mutationTicks++');
    expect(runner).toContain('requestAnimationFrame');
  });

  it("wertet geschützte Bereiche, tatsächliche Frames und Long Tasks aus", () => {
    expect(runner).toContain('protectedOk:');
    expect(runner).toContain('m.longTaskSupported');
    expect(runner).toContain('obs.observe({ type: "longtask" })');
    expect(runner).toContain('rafMaximumMs:');
    expect(runner).toContain('clickNextFrameMs:');
    expect(runner).toContain('inputNextFrameMs:');
    expect(runner).toContain('pruefePaar(paar)');
  });

  it("behält die numerischen Leistungswerte diagnostisch und schützt semantische Invarianten", () => {
    expect(pkg.scripts["test:browser:interaction:chromium"]).toBe(
      "node scripts/controlled-interaction-performance.mjs"
    );
    expect(ci).toContain("npm run test:browser:interaction:chromium -- --pairs 1");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).not.toMatch(/^\s*schedule:/mu);
    expect(workflow).not.toMatch(/^\s*push:/mu);
    expect(workflow).not.toMatch(/^\s*pull_request:/mu);
    expect(workflow).toContain("actions/upload-artifact@");
  });
});
