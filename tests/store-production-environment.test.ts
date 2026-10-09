import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(".github/workflows/store-publish.yml", "utf8");
const audit = readFileSync(".github/workflows/store-production-audit.yml", "utf8");
const tool = "scripts/verify-store-production-environment.mjs";
const valid = { name: "store-production", can_admins_bypass: false,
  protection_rules: [{ type: "required_reviewers", prevent_self_review: true,
    reviewers: [{ type: "User", reviewer: { id: 42 } }] }],
  deployment_branch_policy: { protected_branches: true, custom_branch_policies: false }
};
function check(value: unknown) {
  return spawnSync("node", [tool], {
    input: typeof value === "string" ? value : JSON.stringify(value), encoding: "utf8"
  });
}
describe("Store-Produktionsschutz", () => {
  it("lässt korrekt geschützte Umgebungen zu", () => {
    expect(check(valid).status).toBe(0);
  });
  it.each([
    ["anderer Name", { ...valid, name: "copilot" }],
    ["keine Regeln", { ...valid, protection_rules: [] }],
    ["kein Reviewer", { ...valid, protection_rules: [{
      type: "required_reviewers", prevent_self_review: true, reviewers: []
    }] }],
    ["Selbstfreigabe", { ...valid, protection_rules: [{
      type: "required_reviewers", prevent_self_review: false,
      reviewers: [{ type: "User", reviewer: { id: 42 } }]
    }] }],
    ["Admin-Bypass", { ...valid, can_admins_bypass: true }],
    ["ungeschützte Branches", { ...valid, deployment_branch_policy: {
      protected_branches: false, custom_branch_policies: true
    } }],
    ["fehlende Umgebung", { message: "Not Found" }],
    ["leere Antwort", ""]
  ])("sperrt %s", (_beschreibung, payload) => {
    const outcome = check(payload);
    expect(outcome.status).not.toBe(0);
    expect(outcome.stderr).toContain("Store-Einreichung gesperrt:");
  });
  it("prüft vor und nach dem Deployment und lässt validate unabhängig", () => {
    expect(workflow.split("node scripts/verify-store-production-environment.mjs")).toHaveLength(4);
    expect(workflow).toContain("if: ${{ inputs.mode == 'submit' }}");
    expect(workflow).toContain("environment: store-production");
    expect(workflow).toContain("STORE-SUBMIT:${TAG}:${TARGET}");
    expect(workflow).toContain('"validate"');
  });
  it("gewährt dem Store-Workflow nur die notwendige Leseberechtigung für GitHub-Umgebungen", () => {
    expect(workflow).toContain("permissions:\n  actions: read\n  contents: read");
    expect(workflow).toContain(
      "    permissions:\n      actions: read\n      contents: read\n      id-token: write"
    );
  });

  it("bietet einen manuellen, nicht veröffentlichenden Umgebungs-Audit ohne Secrets", () => {
    expect(audit).toContain("workflow_dispatch:");
    expect(audit).toContain("permissions:\n  actions: read\n  contents: read");
    expect(audit).toContain('refs/heads/main');
    expect(audit).toContain('gh api "repos/${GITHUB_REPOSITORY}/environments/store-production"');
    expect(audit).toContain("node scripts/verify-store-production-environment.mjs");
    expect(audit).not.toContain("environment: store-production");
    expect(audit).not.toContain("secrets.");
    expect(audit).not.toContain("id-token: write");
    expect(audit).not.toContain("gh release ");
    expect(audit).not.toContain("Store Publish");
  });
});
