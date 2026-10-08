import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(".github/workflows/source-ingest.yml", "utf8");

describe("Begrenzte Browser-Nachprüfung der fehlenden GENDERATOR-Seiten", () => {
  it("verwendet eine eigene manuelle Auswahl statt des vollständigen Imports", () => {
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("genderator-recovery-14");
    expect(workflow).toContain("collect_genderator_targeted_recovery.py --dry-run");
    expect(workflow).toContain("collect_genderator_targeted_recovery.py --delay 2.0");
    expect(workflow).toContain("if: inputs.source == 'genderator-recovery-14'");
    expect(workflow).toContain("playwright==1.56.0");
  });

  it("behält das vertrauliche Repository als einzigen Daten-Speicherort", () => {
    expect(workflow).toContain("repository: ${{ env.DATASTORE_REPOSITORY }}");
    expect(workflow).toContain("secrets.GENERIC_DATASTORE_TOKEN");
    expect(workflow).toContain("sprachverstand/raw/*|sprachverstand/normalized/*|sprachverstand/derived/*");
    expect(workflow).not.toContain("actions/upload-artifact");
  });
});
