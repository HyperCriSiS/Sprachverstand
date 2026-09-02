import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const workflowDirectory = ".github/workflows";
const workflowPaths = readdirSync(workflowDirectory)
  .filter((name) => name.endsWith(".yml") || name.endsWith(".yaml"))
  .sort()
  .map((name) => path.join(workflowDirectory, name));
const workflows = workflowPaths.map((workflowPath) => ({
  path: workflowPath,
  source: readFileSync(workflowPath, "utf8")
}));
const expectedActionRefs = new Set([
  "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1",
  "actions/setup-node@820762786026740c76f36085b0efc47a31fe5020",
  "actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a"
]);

function requiredActionRef(match: RegExpMatchArray, workflowPath: string): string {
  const actionRef = match[1];
  if (!actionRef) {
    throw new Error(
      `${workflowPath}: Action-Referenz konnte nicht gelesen werden.`
    );
  }
  return actionRef;
}

describe("GitHub-Actions-Supply-Chain", () => {
  it("prüft automatisch jeden Workflow im Repository", () => {
    expect(workflowPaths).toContain(".github/workflows/ci.yml");
    expect(workflowPaths).toContain(".github/workflows/release.yml");
    expect(workflowPaths).toContain(".github/workflows/real-world.yml");
  });

  it("pinnt jede verwendete Action auf einen vollständigen Commit-SHA", () => {
    let actionCount = 0;

    for (const { path: workflowPath, source } of workflows) {
      for (const line of source.split("\n")) {
        const match = line.match(/^\s*uses:\s*([^\s#]+)(?:\s+#.*)?$/u);
        if (!match) {
          continue;
        }

        actionCount += 1;
        const actionRef = requiredActionRef(match, workflowPath);
        const separatorIndex = actionRef.lastIndexOf("@");
        expect(
          separatorIndex,
          `${workflowPath}: Action ohne Referenz`
        ).toBeGreaterThan(0);
        expect(
          actionRef.slice(separatorIndex + 1),
          `${workflowPath}: ${actionRef} ist nicht unveränderlich gepinnt`
        ).toMatch(/^[0-9a-f]{40}$/u);
      }
    }

    expect(actionCount).toBeGreaterThan(0);
  });

  it("verwendet nur die ausdrücklich geprüften offiziellen Actions", () => {
    const actualRefs = new Set<string>();

    for (const { path: workflowPath, source } of workflows) {
      for (const match of source.matchAll(
        /^\s*uses:\s*([^\s#]+)(?:\s+#.*)?$/gmu
      )) {
        actualRefs.add(requiredActionRef(match, workflowPath));
      }
    }

    expect(actualRefs).toEqual(expectedActionRefs);
  });

  it("dokumentiert die lesbare Major-Version neben jedem SHA-Pin", () => {
    for (const { path: workflowPath, source } of workflows) {
      for (const line of source.split("\n")) {
        if (!line.trimStart().startsWith("uses:")) {
          continue;
        }
        expect(line, `${workflowPath}: Versionskommentar fehlt`).toMatch(
          /\s+# v7\s*$/u
        );
      }
    }
  });
});
