import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
  readonly version: string;
  readonly scripts: Record<string, string>;
};

const chromiumManifest = JSON.parse(
  readFileSync("manifests/chromium.json", "utf8")
);
const edgeManifest = JSON.parse(readFileSync("manifests/edge.json", "utf8"));
const operaManifest = JSON.parse(readFileSync("manifests/opera.json", "utf8"));
const firefoxManifest = JSON.parse(
  readFileSync("manifests/firefox.json", "utf8")
);
const compatibilityBrowsers = JSON.parse(
  readFileSync("config/browser-compatibility.json", "utf8")
) as Array<{
  readonly name: string;
  readonly family: "chromium" | "gecko" | "webextension";
  readonly target: "chromium" | "firefox";
  readonly support?: "experimental";
  readonly reviewedApiNamespaces?: readonly string[];
  readonly knownPartialApis?: readonly string[];
}>;
const buildScript = readFileSync("scripts/build.mjs", "utf8");
const releaseWorkflow = readFileSync(".github/workflows/release.yml", "utf8");
const ciWorkflow = readFileSync(".github/workflows/ci.yml", "utf8");
const iconValidator = readFileSync("scripts/validate-icons.mjs", "utf8");
const readme = readFileSync("README.md", "utf8");

const standardCompatibilityBrowsers = compatibilityBrowsers.filter(
  (browser) => browser.family !== "webextension"
);
const orion = compatibilityBrowsers.find((browser) => browser.name === "Orion");

describe("Browser-Ziele", () => {
  it("baut Chromium und Firefox als gemeinsame Basisziele", () => {
    expect(buildScript).toContain(
      'const supportedTargets = ["chromium", "firefox"];'
    );
    expect(packageJson.scripts["build:edge"]).toBeUndefined();
    expect(packageJson.scripts["build:opera"]).toBeUndefined();
    expect(packageJson.scripts["build:chromium-family"]).toBe(
      "npm run build:chromium"
    );
  });

  it("hält Edge und Opera auf derselben minimalen Chromium-Berechtigungsbasis", () => {
    for (const manifest of [chromiumManifest, edgeManifest, operaManifest]) {
      expect(manifest.manifest_version).toBe(3);
      expect(manifest.version).toBe(packageJson.version);
      expect(manifest.permissions).toEqual(["storage"]);
      expect(manifest.content_scripts).toHaveLength(1);
      expect(manifest.content_scripts[0].matches).toEqual(["<all_urls>"]);
      expect(manifest.background).toEqual({ service_worker: "background.js" });
      expect(manifest.browser_specific_settings).toBeUndefined();
    }

    expect(edgeManifest).toEqual(chromiumManifest);
    expect(operaManifest).toEqual(chromiumManifest);
  });

  it("behält Firefox als bewusst getrennten WebExtension-Build", () => {
    expect(firefoxManifest.browser_specific_settings).toBeDefined();
    expect(firefoxManifest.background).toEqual({ scripts: ["background.js"] });
  });

  it("ordnet Browser ohne eigenen Release ihrem gemeinsamen Basis-Build zu", () => {
    expect(standardCompatibilityBrowsers).toEqual([
      { name: "Chromium", family: "chromium", target: "chromium" },
      { name: "Google Chrome", family: "chromium", target: "chromium" },
      { name: "Microsoft Edge", family: "chromium", target: "chromium" },
      { name: "Opera", family: "chromium", target: "chromium" },
      { name: "Brave", family: "chromium", target: "chromium" },
      { name: "Vivaldi", family: "chromium", target: "chromium" },
      { name: "Arc", family: "chromium", target: "chromium" },
      { name: "Thorium", family: "chromium", target: "chromium" },
      { name: "Ungoogled Chromium", family: "chromium", target: "chromium" },
      { name: "Waterfox", family: "gecko", target: "firefox" },
      { name: "LibreWolf", family: "gecko", target: "firefox" },
      { name: "Zen Browser", family: "gecko", target: "firefox" },
      { name: "Floorp", family: "gecko", target: "firefox" },
      { name: "FireDragon", family: "gecko", target: "firefox" },
      { name: "Midori", family: "gecko", target: "firefox" }
    ]);
  });

  it("führt Orion als experimentellen WebExtension-Sonderfall ohne eigenen Build", () => {
    expect(orion).toEqual({
      name: "Orion",
      family: "webextension",
      target: "chromium",
      support: "experimental",
      reviewedApiNamespaces: ["storage", "runtime", "action", "tabs", "i18n"],
      knownPartialApis: ["storage.sync"]
    });
    expect(buildScript).not.toContain('"orion"');
    expect(packageJson.scripts["build:orion"]).toBeUndefined();
    expect(releaseWorkflow.toLowerCase()).not.toContain("orion");
  });

  it("veröffentlicht für Chrome, Edge und Opera genau ein Chromium-Familienpaket", () => {
    expect(releaseWorkflow).toContain("dist/chromium");
    expect(releaseWorkflow).toContain("-chromium.zip");
    expect(releaseWorkflow).not.toContain("dist/edge");
    expect(releaseWorkflow).not.toContain("dist/opera");
    expect(releaseWorkflow).not.toContain("-edge.zip");
    expect(releaseWorkflow).not.toContain("-opera.zip");
  });

  it("prüft standardmäßig nur die tatsächlich erzeugten Icon-Verzeichnisse", () => {
    expect(iconValidator).toContain('"dist/chromium/icons"');
    expect(iconValidator).toContain('"dist/firefox/icons"');
    expect(iconValidator).not.toContain('"dist/edge/icons"');
    expect(iconValidator).not.toContain('"dist/opera/icons"');
  });

  it("bindet manuell erzeugte Release-Tags an die gewählte Produktlinie", () => {
    expect(releaseWorkflow).toContain("product_line:");
    expect(releaseWorkflow).toContain(
      "inputs.product_line == 'palemoon' && 'palemoon' || 'main'"
    );
    expect(releaseWorkflow).not.toContain("target_ref:");
    expect(releaseWorkflow).not.toContain("'dev'");
  });

  it("veröffentlicht einen im Workflow erzeugten Tag noch im selben Lauf", () => {
    expect(releaseWorkflow).toContain("needs: create_tag");
    expect(releaseWorkflow).toContain(
      "inputs.mode == 'create-tag' && needs.create_tag.result == 'success'"
    );
    expect(releaseWorkflow).not.toContain(
      "inputs.mode != 'create-tag'"
    );
  });

  it("prüft Gecko und Chromium getrennt und behält den erforderlichen Gesamtstatus", () => {
    expect(packageJson.scripts["validate:browsers:gecko"]).toBe(
      "node scripts/validate-browser-targets.mjs --family gecko"
    );
    expect(packageJson.scripts["validate:browsers:chromium"]).toBe(
      "node scripts/validate-browser-targets.mjs --family chromium"
    );
    expect(ciWorkflow).toContain("name: Gecko CI");
    expect(ciWorkflow).toContain("name: Chromium CI");
    expect(ciWorkflow).toContain("name: check");
    expect(ciWorkflow).toContain("npm run validate:browsers:gecko");
    expect(ciWorkflow).toContain("npm run validate:browsers:chromium");
    expect(ciWorkflow).toContain("npm run build:chromium");
    expect(ciWorkflow).not.toContain("branches: [main, dev]");
  });

  it("gliedert die README-Badges nach Engine und zeigt je Engine einen CI-Status", () => {
    expect(readme).toContain("<h3>Gecko</h3>");
    expect(readme).toContain("<h3>Blink / Chromium</h3>");
    expect(readme).toContain("<h3>Goanna</h3>");
    expect(readme).toContain("nameFilter=Gecko%20CI&label=Gecko%20CI");
    expect(readme).toContain("nameFilter=Chromium%20CI&label=Chromium%20CI");
    expect(readme).toContain("nameFilter=check&label=Goanna%20CI");
    for (const browser of [
      "Firefox",
      "Waterfox",
      "LibreWolf",
      "Zen Browser",
      "Floorp",
      "Google Chrome",
      "Chromium",
      "Microsoft Edge",
      "Opera",
      "Brave",
      "Vivaldi",
      "Arc",
      "Pale Moon"
    ]) {
      expect(readme).toContain(`alt="${browser}"`);
    }
  });
});
