import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const releaseWorkflow = readFileSync(".github/workflows/release.yml", "utf8");
const amoInstructions = readFileSync("docs/AMO-SOURCE-INSTRUCTIONS.md", "utf8");

const releaseVersionFiles = [
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
      `printf '%s\\n' "$RELEASE_SHA" > artifacts/SOURCE_COMMIT.txt`
    );
    expect(releaseWorkflow).toContain(
      "cat > artifacts/RELEASE_PROVENANCE.txt <<EOF"
    );
    expect(releaseWorkflow).toContain(
      'cp artifacts/SOURCE_COMMIT.txt artifacts/RELEASE_PROVENANCE.txt "$SOURCE_DIR/"'
    );
    expect(releaseWorkflow).toContain("RELEASE_PROVENANCE.txt \\");
  });

  it("dokumentiert vollständig die sechs release-spezifisch vorbereiteten Dateien", () => {
    for (const path of releaseVersionFiles) {
      expect(amoInstructions).toContain(`- \`${path}\``);
      expect(releaseWorkflow).toContain(path);
    }

    expect(amoInstructions).toContain(
      "Andere Quelldateien werden vor dem Packen nicht verändert."
    );
  });
});
