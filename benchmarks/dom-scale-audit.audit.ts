import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import type { Rule } from "../src/core/rule";

const groessen = [1000, 4000, 10000] as const;
const ergebnisse: Array<Record<string, unknown>> = [];

function quantil(werte: number[], anteil: number): number {
  const sortiert = [...werte].sort((a, b) => a - b);
  return sortiert[Math.ceil(sortiert.length * anteil) - 1] ?? 0;
}

function durchlauf(anzahl: number) {
  document.body.replaceChildren();
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < anzahl; index++) {
    const absatz = document.createElement("p");
    absatz.textContent = "Nutzer:innen " + index;
    fragment.append(absatz);
  }
  document.body.append(fragment);
  let aufrufe = 0;
  const regel: Rule = {
    id: "audit.dom-scale",
    risk: "safe",
    apply(input) {
      aufrufe++;
      const text = input.replaceAll("Nutzer:innen", "Nutzer");
      return { text, replacements: text === input ? 0 : 1 };
    }
  };
  const prozessor = new DomProcessor(document, {
    rules: [regel],
    profile: "conservative",
    processAccessibleAttributes: false
  });
  const anfang = performance.now();
  prozessor.start();
  // Historische synthetische Durchsatzmessung: vollständig synchron abschließen.
  prozessor.flush();
  const dauer = performance.now() - anfang;
  const ersetzungen = prozessor.getReplacementCount();
  prozessor.stop({ restore: true });
  return { dauer, aufrufe, ersetzungen };
}

afterAll(() => {
  const ausgabe = process.env.DOM_SCALE_REPORT_PATH;
  if (!ausgabe) throw new Error("DOM_SCALE_REPORT_PATH fehlt.");
  mkdirSync(path.dirname(path.resolve(ausgabe)), { recursive: true });
  const paket = JSON.parse(readFileSync("package.json", "utf8")) as { version: string };
  writeFileSync(ausgabe, JSON.stringify({
    schemaVersion: 1,
    sourceSha: process.env.DOM_SCALE_SOURCE_SHA ?? null,
    packageVersion: paket.version,
    nodeVersion: process.version,
    iterations: 7,
    warmups: 2,
    scenarios: ergebnisse
  }, null, 2) + "\n");
  document.body.replaceChildren();
});

describe("Audit DOM-02: identischer Initialscan", () => {
  for (const anzahl of groessen) {
    it("misst " + anzahl + " Textknoten", () => {
      for (let i = 0; i < 2; i++) {
        const wert = durchlauf(anzahl);
        expect(wert.aufrufe).toBe(anzahl);
        expect(wert.ersetzungen).toBe(anzahl);
      }
      const samplesMs: number[] = [];
      for (let i = 0; i < 7; i++) {
        const wert = durchlauf(anzahl);
        expect(wert.aufrufe).toBe(anzahl);
        expect(wert.ersetzungen).toBe(anzahl);
        samplesMs.push(Math.round(wert.dauer * 1000) / 1000);
      }
      ergebnisse.push({
        id: "initial-scan-" + anzahl,
        nodes: anzahl,
        samplesMs,
        medianMs: quantil(samplesMs, 0.5),
        p95Ms: quantil(samplesMs, 0.95),
        ruleCalls: anzahl,
        replacements: anzahl
      });
    }, 120000);
  }
});