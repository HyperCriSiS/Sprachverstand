import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const overlay = readFileSync(
  "legacy/palemoon/palemoon/browser-overlay.xul",
  "utf8"
);
const controller = readFileSync("src/palemoon/controller.ts", "utf8");
const browserOptions = readFileSync("src/browser/options.ts", "utf8");
const legacyApi = readFileSync("legacy/palemoon/palemoon/legacy-api.js", "utf8");
const popup = readFileSync("src/popup.ts", "utf8");
const popupHtml = readFileSync("static/popup/popup.html", "utf8");
const popupCss = readFileSync("static/popup/popup.css", "utf8");
const paleMoonContent = readFileSync("src/palemoon/content.ts", "utf8");
const coreDomProcessor = readFileSync("src/core/dom-processor.ts", "utf8");
const transformText = readFileSync("src/core/transform-text.ts", "utf8");
const options = readFileSync("static/options/options.html", "utf8");
const releaseWorkflow = readFileSync(".github/workflows/release.yml", "utf8");

describe("Pale-Moon-Port Regressionen", () => {
  it("verwendet den nativen Toolbar-Badge-Button", () => {
    expect(overlay).toContain("badged-button");
    expect(overlay).toContain('badge=""');
    expect(controller).toContain('button.setAttribute("badge", text)');
    expect(controller).not.toContain('button.setAttribute("sprachverstand-count", text)');
  });

  it("öffnet die Einstellungen über die implementierte Pale-Moon-Legacy-API und erhält den Tabkontext", () => {
    expect(browserOptions).toContain("api.runtime.openOptionsPage()");
    expect(browserOptions).toContain("api.tabs.query(");
    expect(browserOptions).toContain('type: "sprachverstand.set-inspected-tab"');
    expect(browserOptions).not.toContain("api.tabs.create(");
    expect(legacyApi).toContain("openOptionsPage: function ()");
    expect(legacyApi).toContain("bridge.openOptions()");
  });

  it("liefert dem Popup den vollständigen Ersetzungsstatus über die Legacy-Bridge", () => {
    expect(popup).toContain('type: "sprachverstand.get-replacement-state"');
    expect(popup).toContain("readonly replacements?: unknown");
    expect(controller).toContain("replacementSummaryFromSandbox");
    expect(controller).toContain("replacementSummaryForDocument");
    expect(paleMoonContent).toContain("getReplacementSummary()");
    expect(coreDomProcessor).toContain("getReplacementSummary(): ReplacementSummaryEntry[]");
    expect(transformText).toContain("transformTextWithSummary");
  });

  it("bietet dieselbe detaillierte Änderungsansicht wie die moderne Linie", () => {
    for (const id of [
      "main-view",
      "open-replacements",
      "details-view",
      "details-count",
      "details-unique-count",
      "replacement-list",
      "replacement-empty",
      "close-replacements"
    ]) {
      expect(popupHtml).toContain(`id="${id}"`);
    }

    expect(popup).toContain("renderReplacementDetails");
    expect(popup).toContain("refreshReplacementState");
    expect(popupCss).toContain(".replacement-item");
    expect(popupCss).toContain(".details-summary");
  });

  it("nutzt für die Änderungsansicht den gemeinsamen Statuspfad ohne moderne Tab-Erzeugungs-API", () => {
    expect(popup).toContain('type: "sprachverstand.state-updated"');
    expect(popup).toContain('type: "sprachverstand.get-replacement-state"');
    expect(popup).not.toContain("window.setInterval");
    expect(popup).not.toContain("api.tabs.create(");
    expect(browserOptions).not.toContain("api.tabs.create(");
  });

  it("wendet Ausschluss- und Einschlussmodus auch im Pale-Moon-Controller an", () => {
    expect(controller).toContain("shouldProcessDomain(");
    expect(controller).toContain("settings.domainListMode");
    expect(controller).not.toContain("!isDomainExcluded(");
  });

  it("enthält nicht wieder den entfernten Einstellungszähler", () => {
    expect(options).not.toContain("Korrekturen im aktuell aktiven Tab");
    expect(options).toMatch(
      /<output\b(?=[^>]*\bid="count")(?=[^>]*\bhidden(?:="")?)(?=[^>]*\baria-hidden="true")[^>]*>0<\/output>/u
    );
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

  it("veröffentlicht Pale Moon normal, aber niemals als Latest", () => {
    expect(releaseWorkflow).toMatch(
      /if \[\[ "\$PRODUCT_LINE" == "palemoon" \]\]; then[\s\S]*?IS_PRERELEASE=false/
    );
    expect(releaseWorkflow).toMatch(
      /if \[\[ "\$PRODUCT_LINE" == "palemoon" \]\]; then[\s\S]*?MAKE_LATEST=false/
    );
    expect(releaseWorkflow).toContain("RELEASE_ARGS+=(--latest=false)");
  });

  it("veröffentlicht keine Release-Provenienz als öffentliches Asset", () => {
    expect(releaseWorkflow).not.toContain("RELEASE_PROVENANCE.txt");
    expect(releaseWorkflow).toContain("artifacts/internal/SOURCE_COMMIT.txt");
  });
});
