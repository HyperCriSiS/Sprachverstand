import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string): string {
  return readFileSync(path.join(root, relativePath), "utf8");
}

describe("Branching-Policy", () => {
  it("schreibt main als einzige moderne Integrationslinie fest", () => {
    const branching = read("BRANCHING.md");

    expect(branching).toContain("`main` ist die einzige dauerhafte Produkt- und Integrationslinie");
    expect(branching).toContain("Der frühere `dev`-Branch ist nicht mehr Bestandteil des Entwicklungsworkflows");
    expect(branching).toContain("Die einzige bewusst dauerhafte Ausnahme ist `palemoon`");
  });

  it("verweist in der aktiven Roadmap nicht mehr auf dev als Merge- oder CI-Ziel", () => {
    const roadmap = read("ROADMAP.md");

    expect(roadmap).not.toContain("Nach `dev` mergen");
    expect(roadmap).not.toContain("`dev`-CI");
    expect(roadmap).toContain("Nach `main` mergen");
    expect(roadmap).toContain("`main`-CI");
  });

  it("führt moderne Workflows nicht auf dev aus", () => {
    const workflowDirectory = path.join(root, ".github", "workflows");
    const workflows = readdirSync(workflowDirectory)
      .filter((filename) => filename.endsWith(".yml") || filename.endsWith(".yaml"))
      .map((filename) => ({ filename, source: read(path.join(".github", "workflows", filename)) }));

    for (const { filename, source } of workflows) {
      expect(source, `${filename} enthält einen direkten dev-Branch-Trigger`).not.toMatch(
        /(?:branches|branches-ignore):[\s\S]{0,160}(?:^|\s)-?\s*dev(?:\s|$)/mu
      );
      expect(source, `${filename} referenziert refs/heads/dev`).not.toContain("refs/heads/dev");
    }
  });
});
