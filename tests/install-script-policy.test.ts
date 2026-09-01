import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
  readonly allowScripts?: Record<string, boolean>;
  readonly devDependencies?: Record<string, string>;
};
const npmrc = readFileSync(".npmrc", "utf8");

describe("Install-Skript-Policy", () => {
  it("erlaubt ausschließlich die geprüfte esbuild-Version", () => {
    expect(packageJson.devDependencies?.esbuild).toBe("0.28.2");
    expect(packageJson.allowScripts).toEqual({
      "esbuild@0.28.2": true
    });
  });

  it("behandelt neue ungeprüfte Dependency-Skripte als Installationsfehler", () => {
    expect(npmrc).toMatch(/^strict-allow-scripts=true\s*$/u);
  });
});
