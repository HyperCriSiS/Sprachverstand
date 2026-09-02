import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const overlay = readFileSync(
  "legacy/palemoon/palemoon/browser-overlay.xul",
  "utf8"
);
const controller = readFileSync("src/palemoon/controller.ts", "utf8");
const options = readFileSync("static/options/options.html", "utf8");
const releaseWorkflow = readFileSync(".github/workflows/release.yml", "utf8");

describe("Pale-Moon-Port Regressionen", () => {
  it("verwendet den nativen Toolbar-Badge-Button", () => {
    expect(overlay).toContain("badged-button");
    expect(overlay).toContain('badge=""');
    expect(controller).toContain('button.setAttribute("badge", text)');
    expect(controller).not.toContain('button.setAttribute("sprachverstand-count", text)');
  });

  it("enthält nicht wieder den entfernten Einstellungszähler", () => {
    expect(options).not.toContain("Korrekturen im aktuell aktiven Tab");
    expect(options).toContain('<output id="count" hidden aria-hidden="true">0</output>');
  });

  it("veröffentlicht keine Pale-Moon-Einreichungsnotiz als Release-Asset", () => {
    expect(releaseWorkflow).not.toContain(
      "cp docs/PALEMOON-SUBMISSION.md artifacts/"
    );
  });

  it("bindet Pale-Moon-Releases an die gemeinsame Produktlinienlogik", () => {
    expect(releaseWorkflow).toMatch(
      /product_line:[\s\S]*?options:[\s\S]*?- "modern"[\s\S]*?- "palemoon"/
    );
    expect(releaseWorkflow).toContain(
      "ref: ${{ inputs.product_line == 'palemoon' && 'palemoon' || 'main' }}"
    );
    expect(releaseWorkflow).toContain("SOURCE_BRANCH=palemoon");
    expect(releaseWorkflow).toContain(
      "Pale-Moon-Releases müssen das Schema vX.Y.Z-palemoon.N verwenden."
    );
  });

  it("kann einen Pale-Moon-Release niemals als Latest markieren", () => {
    expect(releaseWorkflow).toMatch(
      /if \[\[ "\$PRODUCT_LINE" == "palemoon" \]\]; then[\s\S]*?MAKE_LATEST=false/
    );
    expect(releaseWorkflow).toMatch(
      /if \[\[ "\$PRODUCT_LINE" == "modern" && "\$TAG" == "v\$\{VERSION\}" \]\]; then[\s\S]*?IS_PRERELEASE=false[\s\S]*?else[\s\S]*?IS_PRERELEASE=true/
    );
  });
});
