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
});
