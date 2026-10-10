import { describe, expect, it } from "vitest";
import { vergleicheNativeDomBerichte } from "../scripts/compare-dom-native-audit.mjs";

function bericht(faktor = 1) {
  return {
    schemaVersion: 1,
    sourceSha: "a".repeat(40), packageVersion: "0.6.6",
    nodeVersion: "v24.21.0", browser: "chromium", browserVersion: "140.0",
    passes: [0, 1].map(() => ({
      warmups: 2, iterations: 7,
      scenarios: [1000, 4000, 10000].map((nodes) => ({
        id: "initial-scan-" + nodes,
        nodes, ruleCalls: nodes, replacements: nodes,
        samplesMs: Array(7).fill(nodes / 100 * faktor),
        medianMs: nodes / 100 * faktor, p95Ms: nodes / 100 * faktor
      }))
    }))
  };
}

describe("DOM-02: native Vergleichsberichte", () => {
  it("vergleicht 14 vollständige Proben pro Knotengröße", () => {
    const wert = vergleicheNativeDomBerichte(bericht(), bericht(1.5));
    expect(wert.werte.map((x) => x.nodes)).toEqual([1000, 4000, 10000]);
    expect(wert.werte.map((x) => x.medianFaktor)).toEqual([1.5, 1.5, 1.5]);
    expect(wert.markdown).toContain("kein umfassendes Release-Performance-Gate");
  });
  it("weist fehlende Proben, falsche Ersetzungen und Browserwechsel zurück", () => {
    const fehlend = bericht();
    fehlend.passes[0]!.scenarios[0]!.samplesMs.pop();
    expect(() => vergleicheNativeDomBerichte(fehlend, bericht())).toThrow();
    const falsch = bericht();
    falsch.passes[1]!.scenarios[2]!.replacements = 0;
    expect(() => vergleicheNativeDomBerichte(falsch, bericht())).toThrow();
    const browser = bericht();
    browser.browser = "firefox";
    expect(() => vergleicheNativeDomBerichte(bericht(), browser)).toThrow();
  });
});
