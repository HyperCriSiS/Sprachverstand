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
