import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
  readonly allowScripts?: Record<string, boolean>;
  readonly devDependencies?: Record<string, string>;
};
const packageLock = JSON.parse(readFileSync("package-lock.json", "utf8")) as {
  readonly packages?: Record<
    string,
    {
      readonly version?: string;
      readonly dev?: boolean;
      readonly optional?: boolean;
      readonly os?: readonly string[];
      readonly hasInstallScript?: boolean;
    }
  >;
};
const npmrc = readFileSync(".npmrc", "utf8");

describe("Install-Skript-Policy", () => {
  it("erlaubt ausschließlich die beiden geprüften, versionsgenauen Install-Skripte", () => {
    expect(packageJson.devDependencies?.esbuild).toBe("0.28.2");
    expect(packageJson.allowScripts).toEqual({
      "esbuild@0.28.2": true,
      "fsevents@2.3.3": true
    });
  });

  it("hält fsevents als optionalen macOS-Entwicklungshelfer fest", () => {
    expect(packageLock.packages?.["node_modules/fsevents"]).toEqual(
      expect.objectContaining({
        version: "2.3.3",
        dev: true,
        optional: true,
        os: ["darwin"],
        hasInstallScript: true
      })
    );
  });

  it("behandelt neue ungeprüfte Dependency-Skripte als Installationsfehler", () => {
    expect(npmrc).toMatch(/^strict-allow-scripts=true\s*$/u);
  });
});
