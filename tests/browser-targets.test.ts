import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
  readonly version: string;
  readonly scripts: Record<string, string>;
};

const chromiumManifest = JSON.parse(
  readFileSync("manifests/chromium.json", "utf8")
);
const edgeManifest = JSON.parse(readFileSync("manifests/edge.json", "utf8"));
const operaManifest = JSON.parse(readFileSync("manifests/opera.json", "utf8"));
const firefoxManifest = JSON.parse(
  readFileSync("manifests/firefox.json", "utf8")
);
const buildScript = readFileSync("scripts/build.mjs", "utf8");
const releaseWorkflow = readFileSync(".github/workflows/release.yml", "utf8");
const ciWorkflow = readFileSync(".github/workflows/ci.yml", "utf8");

describe("Browser-Ziele", () => {
  it("baut Chromium, Edge, Opera und Firefox als explizite Ziele", () => {
    expect(buildScript).toContain(
      'const supportedTargets = ["chromium", "edge", "opera", "firefox"];'
    );
    expect(packageJson.scripts["build:edge"]).toBe(
      "node scripts/build.mjs --target edge"
    );
    expect(packageJson.scripts["build:opera"]).toBe(
      "node scripts/build.mjs --target opera"
    );
  });

  it("hält Edge und Opera auf derselben minimalen Chromium-Berechtigungsbasis", () => {
    for (const manifest of [chromiumManifest, edgeManifest, operaManifest]) {
      expect(manifest.manifest_version).toBe(3);
      expect(manifest.version).toBe(packageJson.version);
      expect(manifest.permissions).toEqual(["storage"]);
      expect(manifest.content_scripts).toHaveLength(1);
      expect(manifest.content_scripts[0].matches).toEqual(["<all_urls>"]);
      expect(manifest.background).toEqual({ service_worker: "background.js" });
      expect(manifest.browser_specific_settings).toBeUndefined();
    }

    expect(edgeManifest).toEqual(chromiumManifest);
    expect(operaManifest).toEqual(chromiumManifest);
  });

  it("behält Firefox als bewusst getrennten WebExtension-Build", () => {
    expect(firefoxManifest.browser_specific_settings).toBeDefined();
    expect(firefoxManifest.background).toEqual({ scripts: ["background.js"] });
  });

  it("packt Edge und Opera sowohl in CI als auch in Releases", () => {
    for (const target of ["edge", "opera"]) {
      expect(ciWorkflow).toContain(`dist/${target}`);
      expect(ciWorkflow).toContain(`-${target}.zip`);
      expect(releaseWorkflow).toContain(`dist/${target}`);
      expect(releaseWorkflow).toContain(`-${target}.zip`);
    }
  });
});
