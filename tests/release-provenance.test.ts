import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const releaseWorkflow = readFileSync(".github/workflows/release.yml", "utf8");

const paleMoonReleaseVersionFiles = [
  "package.json",
  "package-lock.json",
  "manifests/chromium.json",
  "manifests/firefox.json"
] as const;

describe("Release-Provenienz", () => {
  it("hält Provenienz intern und veröffentlicht keine Provenienzdateien", () => {
    expect(releaseWorkflow).toContain(
      `printf '%s\\n' "$RELEASE_SHA" > artifacts/internal/SOURCE_COMMIT.txt`
    );
    expect(releaseWorkflow).not.toContain("artifacts/public/RELEASE_PROVENANCE.txt");
    expect(releaseWorkflow).not.toContain("RELEASE_PROVENANCE.txt");
    expect(releaseWorkflow).not.toContain(
      'cp artifacts/internal/SOURCE_COMMIT.txt "$SOURCE_DIR/"'
    );
  });

  it("verwendet für Pale Moon nur dessen vorhandene release-spezifische Versionsdateien", () => {
    for (const path of paleMoonReleaseVersionFiles) {
      expect(releaseWorkflow).toContain(path);
    }

    expect(releaseWorkflow).toContain('if [[ "$PRODUCT_LINE" == "modern" ]]; then');
    expect(releaseWorkflow).toContain("VERSION_FILES=(");
  });
});
