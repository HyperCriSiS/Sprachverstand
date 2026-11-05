import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const release = readFileSync(".github/workflows/release.yml", "utf8");
const preflight = readFileSync(".github/workflows/release-preflight.yml", "utf8");
const validator = readFileSync("scripts/verify-release-packages.mjs", "utf8");

describe("Paketprüfung moderner Browser", () => {
  it("veröffentlicht für die Chromium-Familie nur ein gemeinsames Paket", () => {
    for (const content of [release, preflight, validator]) {
      expect(content).toContain("-chromium.zip");
      expect(content).not.toContain("-edge.zip");
      expect(content).not.toContain("-opera.zip");
    }
    for (const content of [release, preflight]) {
      expect(content).toContain("verify-release-packages.mjs");
      expect(content).toContain("sha256sum -c SHA256SUMS.txt");
    }
  });

  it("verlangt die Quellprovenienz und beide Manifestvarianten", () => {
    for (const content of [release, preflight]) {
      expect(content).toContain('"$SOURCE_DIR/SOURCE_COMMIT.txt"');
      expect(content).toContain('"$SOURCE_DIR/RELEASE_PROVENANCE.txt"');
      expect(content).toContain("Tag:");
      expect(content).toContain("Commit:");
      expect(content).toContain("Version:");
    }
    expect(validator).toContain("SOURCE_COMMIT.txt");
    expect(validator).toContain("RELEASE_PROVENANCE.txt");
    expect(validator).toContain('["chromium", "firefox"]');
    expect(validator).toContain("assert.deepEqual(sourceManifest");
  });

  it("belässt Pale Moon und vermeidet Veröffentlichungen im Preflight", () => {
    expect(release).toContain('if [[ "$PRODUCT_LINE" == "modern" ]]');
    expect(release).toContain("dist/palemoon");
    expect(release).toContain("palemoon.xpi");
    expect(preflight).toContain("contents: read");
    expect(preflight).not.toContain("gh release create");
    expect(preflight).not.toContain("store-production");
    expect(preflight).not.toContain("chrome-web-store-v2.mjs publish");
  });
});
