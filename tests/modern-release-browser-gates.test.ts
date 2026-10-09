import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const release = readFileSync(".github/workflows/release.yml", "utf8");
const preflight = readFileSync(".github/workflows/release-preflight.yml", "utf8");

const gates = [
  ["Modernen Chromium-Browser vor Veröffentlichung testen", "npm run test:browser:chromium"],
  ["Video und Untertitel im modernen Chromium vor Veröffentlichung testen", "npm run test:browser:video:chromium"],
  ["Modernen Firefox-Browser vor Veröffentlichung testen", "npm run test:browser:firefox"]
] as const;

describe("Echte moderne Browser-Gates im Tag-Release", () => {
  it("verlangt die gleichen Live-Prüfungen wie der manuelle Preflight", () => {
    for (const [name, command] of gates) {
      const step = [
        "      - name: " + name,
        "        if: ${{ env.PRODUCT_LINE == 'modern' }}",
        "        run: " + command
      ].join("\n");
      expect(release).toContain(step);
      expect(preflight).toContain(command);
    }
  });

  it("schaltet Browser-Prüfungen nach Build und vor dem Erstellen und Veröffentlichen ein", () => {
    const buildPosition = release.indexOf("      - name: Vollständige Prüfung ausführen\n        run: npm run check");
    const packagePosition = release.indexOf("      - name: Release-Pakete und interne Arbeitsartefakte erstellen");
    const publishPosition = release.indexOf("      - name: GitHub-Release veröffentlichen");
    const metadataPosition = release.indexOf("      - name: Store-Metadaten für die moderne Release-Version erzeugen");
    expect(buildPosition).toBeGreaterThan(0);
    expect(metadataPosition).toBeGreaterThan(buildPosition);
    expect(packagePosition).toBeGreaterThan(metadataPosition);
    expect(publishPosition).toBeGreaterThan(packagePosition);
    let position = buildPosition;
    for (const [name] of gates) {
      const next = release.indexOf("      - name: " + name);
      expect(next).toBeGreaterThan(position);
      expect(next).toBeLessThan(metadataPosition);
      position = next;
    }
  });

  it("führt neue Prüfungen ausschließlich für die moderne Produktlinie aus", () => {
    for (const [name] of gates) {
      const begin = release.indexOf("      - name: " + name);
      expect(begin).toBeGreaterThan(0);
      const step = release.slice(begin, release.indexOf("\n\n", begin));
      expect(step).toContain("if: ${{ env.PRODUCT_LINE == 'modern' }}");
      expect(step).not.toContain("palemoon");
    }
    expect(release).toContain("SOURCE_BRANCH=palemoon");
  });

  it("belässt den Preflight nicht veröffentlichend", () => {
    expect(preflight).toContain("contents: read");
    expect(preflight).not.toContain("gh release create");
    expect(preflight).not.toContain("gh release upload");
  });
});
