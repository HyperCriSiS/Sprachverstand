import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const releaseWorkflow = readFileSync(".github/workflows/release.yml", "utf8");
const amoInstructions = readFileSync("docs/AMO-SOURCE-INSTRUCTIONS.md", "utf8");

const modernReleaseVersionFiles = [
  "package.json",
  "package-lock.json",
  "manifests/chromium.json",
  "manifests/edge.json",
  "manifests/opera.json",
  "manifests/firefox.json"
] as const;

describe("Release-Provenienz", () => {
  it("legt Commit und Release-Provenienz dem Source-ZIP bei", () => {
    expect(releaseWorkflow).toContain(
      `printf '%s\\n' "$RELEASE_SHA" > artifacts/internal/SOURCE_COMMIT.txt`
    );
    expect(releaseWorkflow).toContain(
      "> artifacts/public/RELEASE_PROVENANCE.txt"
    );
    expect(releaseWorkflow).toContain(
      'cp artifacts/internal/SOURCE_COMMIT.txt "$SOURCE_DIR/"'
    );
    expect(releaseWorkflow).toContain(
      'cp artifacts/public/RELEASE_PROVENANCE.txt "$SOURCE_DIR/"'
    );
    expect(releaseWorkflow).toContain("artifacts/public/RELEASE_PROVENANCE.txt");
  });

  it("dokumentiert vollständig die sechs modernen release-spezifisch vorbereiteten Dateien", () => {
    for (const path of modernReleaseVersionFiles) {
      expect(amoInstructions).toContain(`- \`${path}\``);
      expect(releaseWorkflow).toContain(path);
    }

    expect(amoInstructions).toContain(
      "Andere Quelldateien werden vor dem Packen nicht verändert."
    );
  });

  it("verwendet für Pale Moon nur dessen vorhandene Versionsdateien", () => {
    expect(releaseWorkflow).toContain('if [[ "$PRODUCT_LINE" == "modern" ]]; then');
    expect(releaseWorkflow).toContain("VERSION_FILES=(");
    expect(releaseWorkflow).toContain("manifests/chromium.json");
    expect(releaseWorkflow).toContain("manifests/firefox.json");
  });
});
