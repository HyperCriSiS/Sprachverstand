import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(".github/workflows/release-preflight.yml", "utf8");

describe("Manuelle Vorabprüfung moderner Releases", () => {
  it("startet ausschließlich manuell und nur mit Leserechten", () => {
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).not.toMatch(/^\s*push:/mu);
    expect(workflow).not.toMatch(/^\s*pull_request:/mu);
    expect(workflow).not.toMatch(/^\s*schedule:/mu);
    expect(workflow).toContain("contents: read");
    expect(workflow).not.toContain("contents: write");
    expect(workflow).toContain("ref: main");
    expect(workflow).toContain("refs/heads/main");
  });

  it("prüft beide modernen Browser, Video und die vollständige Produktpipeline", () => {
    expect(workflow).toContain("npm run check");
    expect(workflow).toContain("npm run test:browser:chromium");
    expect(workflow).toContain("npm run test:browser:video:chromium");
    expect(workflow).toContain("npm run test:browser:firefox");
    expect(workflow).toContain("scripts/generate-store-metadata.mjs");
    expect(workflow).toContain("scripts/generate-chrome-dashboard.mjs");
  });

  it("validiert konkrete Archive samt Version, AMO-Signaturgrenze und Checksummen", () => {
    expect(workflow).toContain("git archive HEAD");
    expect(workflow).toContain("sha256sum -c SHA256SUMS.txt");
    expect(workflow).toContain("unzip -t");
    expect(workflow).toContain("META-INF/");
    expect(workflow).toContain("sourceNotes.version");
    expect(workflow).toContain("sourcePackage.version");
    expect(workflow).toContain("manifest.version");
    expect(workflow).toContain("actions/upload-artifact@");
  });

  it("veröffentlicht und signiert keine Artefakte oder Store-Pakete", () => {
    expect(workflow).not.toContain("gh release create");
    expect(workflow).not.toContain("gh release upload");
    expect(workflow).not.toContain("git push");
    expect(workflow).not.toContain("amo-api-v5.mjs submit");
    expect(workflow).not.toContain("chrome-web-store-v2.mjs publish");
    expect(workflow).not.toContain("store-production");
    expect(workflow).not.toContain("id-token: write");
  });
});