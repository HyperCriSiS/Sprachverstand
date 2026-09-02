import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

interface RealWorldSite {
  readonly id: number;
  readonly slug: string;
  readonly url: string;
  readonly focus: string;
}

const sites = JSON.parse(
  readFileSync("config/real-world-sites.json", "utf8")
) as RealWorldSite[];
const documentation = readFileSync(
  "docs/REAL-WORLD-TEST-MATRIX.md",
  "utf8"
);
const workflow = readFileSync(".github/workflows/real-world.yml", "utf8");
const runner = readFileSync("scripts/real-world-browser-matrix.mjs", "utf8");
const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
  readonly scripts: Record<string, string>;
};

describe("Real-World-Browsermatrix", () => {
  it("hält genau die zehn dokumentierten Referenzseiten zentral fest", () => {
    expect(sites).toHaveLength(10);
    expect(sites.map((site) => site.id)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10
    ]);
    expect(new Set(sites.map((site) => site.slug)).size).toBe(10);
    expect(new Set(sites.map((site) => site.url)).size).toBe(10);

    for (const site of sites) {
      expect(site.slug).toMatch(/^[a-z0-9-]+$/u);
      expect(site.url).toMatch(/^https:\/\//u);
      expect(site.focus.trim()).not.toBe("");
      expect(documentation).toContain(site.url);
    }
  });

  it("bleibt ein bewusst manueller und nicht blockierender Live-Workflow", () => {
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).not.toMatch(/^\s*pull_request:/mu);
    expect(workflow).not.toMatch(/^\s*push:/mu);
    expect(workflow).not.toMatch(/^\s*schedule:/mu);
    expect(workflow).toContain("if: ${{ always() }}");
    expect(workflow).toContain("npm run test:browser:chromium");
    expect(workflow).toContain("npm run test:real-world");
  });

  it("macht die wichtigsten Live-Messwerte ohne Artefakt-Download sichtbar", () => {
    expect(workflow).toContain("Live-Ergebnisse kompakt ausgeben");
    expect(workflow).toContain("REAL-WORLD");
    expect(workflow).toContain("GITHUB_STEP_SUMMARY");
    expect(workflow).toContain("remainingPatterns=");
    expect(workflow).toContain("longTaskDeltaMs=");
    expect(workflow).toContain("javascriptErrors=");
    expect(workflow).toContain("unhandledRejections=");
  });

  it("erfasst Baseline und Erweiterung statt absolute Live-Grenzwerte zu erzwingen", () => {
    expect(runner).toContain('runSiteMode(site, "baseline")');
    expect(runner).toContain('runSiteMode(site, "extension")');
    expect(runner).toContain("elapsedDeltaMs");
    expect(runner).toContain("totalLongTaskDeltaMs");
    expect(runner).toContain("protectedBefore");
    expect(runner).toContain("protectedAfter");
    expect(runner).toContain("remainingPatterns");
  });

  it("validiert die Konfiguration in der normalen Kernprüfung ohne Live-Netzwerk", () => {
    expect(packageJson.scripts["test:real-world"]).toBe(
      "node scripts/real-world-browser-matrix.mjs"
    );
    expect(packageJson.scripts["validate:real-world"]).toBe(
      "node scripts/real-world-browser-matrix.mjs --list"
    );
    expect(packageJson.scripts.check).toContain("npm run validate:real-world");
  });
});
