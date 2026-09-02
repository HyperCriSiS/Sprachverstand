import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const releaseWorkflow = readFileSync(".github/workflows/release.yml", "utf8");

describe("Gemeinsamer Release-Flow", () => {
  it("bietet modern und palemoon über denselben Workflow an", () => {
    expect(releaseWorkflow).toContain("product_line:");
    expect(releaseWorkflow).toContain('- "modern"');
    expect(releaseWorkflow).toContain('- "palemoon"');
    expect(releaseWorkflow).toContain(
      "inputs.product_line == 'palemoon' && 'palemoon' || 'main'"
    );
  });

  it("bindet Pale-Moon-Releases an Branch und Tag-Schema", () => {
    expect(releaseWorkflow).toContain("SOURCE_BRANCH=palemoon");
    expect(releaseWorkflow).toContain("SOURCE_BRANCH=main");
    expect(releaseWorkflow).toContain("-palemoon\\.[0-9]+$");
    expect(releaseWorkflow).toContain(
      'git merge-base --is-ancestor "$TAG_SHA" "origin/${SOURCE_BRANCH}"'
    );
  });

  it("verhindert, dass Pale Moon den modernen Latest-Release verdrängt", () => {
    expect(releaseWorkflow).toContain('if [[ "$PRODUCT_LINE" == "palemoon" ]]; then');
    expect(releaseWorkflow).toContain('RELEASE_TITLE="Sprachverstand ${VERSION} – Pale Moon"');
    expect(releaseWorkflow).toContain("MAKE_LATEST=false");
  });

  it("erstellt je Produktlinie nur die passenden Pakete", () => {
    expect(releaseWorkflow).toContain("dist/palemoon");
    expect(releaseWorkflow).toContain("-palemoon.xpi");
    expect(releaseWorkflow).toContain("dist/chromium");
    expect(releaseWorkflow).toContain("dist/firefox");
    expect(releaseWorkflow).toContain("dist/edge");
    expect(releaseWorkflow).toContain("dist/opera");
  });
});
