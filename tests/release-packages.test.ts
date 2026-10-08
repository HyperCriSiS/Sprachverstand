import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const release = readFileSync(".github/workflows/release.yml", "utf8");
const preflight = readFileSync(".github/workflows/release-preflight.yml", "utf8");
const validator = readFileSync("scripts/verify-release-packages.mjs", "utf8");

describe("Paketprüfung moderner Browser", () => {
  it("leitet Edge und Opera aus Chromium ab und prüft die Inhalte", () => {
    for (const content of [release, preflight]) {
      expect(content).toContain("for target in edge opera; do");
      expect(content).toContain('cp -a dist/chromium/. "$TARGET_DIR/"');
      expect(content).toContain('cp "manifests/' + "$" + '{target}.json"');
      expect(content).toContain("verify-release-packages.mjs");
      expect(content).toContain("sha256sum -c SHA256SUMS.txt");
    }
    expect(validator).toContain("assert.deepEqual(candidates, chromiumEntries");
    expect(validator).toContain("assert.deepEqual(read(files[target], entry)");
  });

  it("verlangt die Quellprovenienz und alle vier Manifestvarianten", () => {
    for (const content of [release, preflight]) {
      expect(content).toContain('"$SOURCE_DIR/SOURCE_COMMIT.txt"');
      expect(content).toContain('"$SOURCE_DIR/RELEASE_PROVENANCE.txt"');
      expect(content).toContain("Tag:");
      expect(content).toContain("Commit:");
      expect(content).toContain("Version:");
    }
    expect(validator).toContain("SOURCE_COMMIT.txt");
    expect(validator).toContain("RELEASE_PROVENANCE.txt");
    expect(validator).toContain('["chromium", "edge", "opera", "firefox"]');
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
