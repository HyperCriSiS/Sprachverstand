import {describe, expect, it} from "vitest";
import {mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {createHash} from "node:crypto";

describe("Isolierter DOM-Phasendiagnosebuild", () => {
  it("bewahrt Produktionsdateien und Berechtigungen und liefert abrufbare begrenzte Zeitdaten", () => {
    const fixture = mkdtempSync(path.join(tmpdir(), "sv-dom-phase-"));
    const production = path.join(fixture, "dist/chromium");
    const core = path.join(fixture, "src/core");
    mkdirSync(production, {recursive:true});
    mkdirSync(core, {recursive:true});
    const original = "production content without diagnostics\n";
    const manifest = JSON.stringify({manifest_version:3, permissions:["storage"]});
    writeFileSync(path.join(production, "content.js"), original);
    writeFileSync(path.join(production, "background.js"), "unchanged background");
    writeFileSync(path.join(production, "manifest.json"), manifest);
    writeFileSync(path.join(core, "dom-processor.ts"), `export class DomProcessor {
      start() {} processRoot() {} handleMutationRecords() {}
      flushRegularNodesBudgeted() {} flushSubtitleNodes() {} discoverLateShadowRoots() {}
      processTextNode() {} finishTextTransform() {} replaceTextKeepingRanges() {}
    }`);
    writeFileSync(path.join(fixture, "src/content.ts"),
      'import {DomProcessor} from "./core/dom-processor"; new DomProcessor().start();');
    try {
      const result = spawnSync(process.execPath, [path.resolve("scripts/build-dom-phase-diagnostic.mjs")],
        {cwd:fixture, encoding:"utf8", timeout:30_000});
      expect(result.status, result.stderr).toBe(0);
      expect(readFileSync(path.join(production, "content.js"), "utf8")).toBe(original);
      const diagnostic = path.join(fixture, "artifacts/dom-phase-diagnostic/chromium");
      expect(readFileSync(path.join(diagnostic, "manifest.json"), "utf8")).toBe(manifest);
      expect(readFileSync(path.join(diagnostic, "background.js"), "utf8")).toBe("unchanged background");
      const marker = JSON.parse(readFileSync(path.join(diagnostic, "dom-phase-diagnostic.json"), "utf8"));
      expect(marker.productionContentSha256).toBe(createHash("sha256").update(original).digest("hex"));
      expect(marker.maximumSlowSamples).toBe(128);
      expect(marker.minimumSlowDurationMs).toBe(8);
      const bundle = readFileSync(path.join(diagnostic, "content.js"), "utf8");
      new Function(bundle)();
      document.dispatchEvent(new Event("__svPhaseDiagnosticCollect"));
      const report = JSON.parse(document.documentElement.getAttribute("data-sv-phase-diagnostic")!);
      expect(report.methods.start.calls).toBe(1);
      expect(Object.keys(report.methods)).toHaveLength(9);
      expect(report.slow.length).toBeLessThanOrEqual(128);
    } finally {
      document.documentElement.removeAttribute("data-sv-phase-diagnostic");
      // Only the freshly created fixture under the OS temporary directory.
      expect(path.dirname(fixture)).toBe(path.resolve(tmpdir()));
      rmSync(fixture, {recursive:true, force:true});
    }
  }, 35_000);
});
