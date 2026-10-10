import { describe, expect, it } from "vitest";
import { vergleicheDomSkalierung } from "../scripts/compare-dom-scale-audit.mjs";

function bericht(multiplikator = 1) {
  return {
    schemaVersion: 1, sourceSha: "a".repeat(40),
    packageVersion: "0.7.2", nodeVersion: "v24.0.0",
    scenarios: [1000, 4000, 10000].map((nodes) => ({
      id: "initial-scan-" + nodes, nodes,
      ruleCalls: nodes, replacements: nodes,
      samplesMs: Array(7).fill(nodes / 100 * multiplikator),
      medianMs: nodes / 100 * multiplikator,
      p95Ms: nodes / 100 * multiplikator
    }))
  };
}

describe("DOM-02-Berichtsvergleich", () => {
  it("bildet alle Größen und Verhältnisse korrekt", () => {
    const vergleich = vergleicheDomSkalierung(bericht(), bericht(1.5));
    expect(vergleich.zeilen.map((x) => x.nodes)).toEqual([1000, 4000, 10000]);
    expect(vergleich.zeilen.map((x) => x.medianRatio)).toEqual([1.5, 1.5, 1.5]);
    expect(vergleich.markdown).toContain("keine nativen Browserlaufzeiten");
  });
  it("verwirft fehlende, doppelte und unplausible Werte", () => {
    const fehlend = bericht();
    fehlend.scenarios.pop();
    expect(() => vergleicheDomSkalierung(fehlend, bericht())).toThrow();
    const doppelt = bericht();
    doppelt.scenarios[1]!.nodes = 1000;
    expect(() => vergleicheDomSkalierung(doppelt, bericht())).toThrow();
    const fehler = bericht();
    fehler.scenarios[0]!.replacements = 0;
    expect(() => vergleicheDomSkalierung(fehler, bericht())).toThrow();
  });
});
