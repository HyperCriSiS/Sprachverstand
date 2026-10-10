import { DomProcessor } from "../src/core/dom-processor";
import type { Rule } from "../src/core/rule";

const groessen = [1_000, 4_000, 10_000] as const;
const aufwaermungen = 2;
const messungen = 7;

function quantil(werte: readonly number[], anteil: number): number {
  const sortiert = [...werte].sort((a, b) => a - b);
  return sortiert[Math.ceil(sortiert.length * anteil) - 1] ?? 0;
}

function initialscan(anzahl: number): { dauerMs: number; aufrufe: number; ersetzungen: number } {
  // Gleicher DOM-Aufbau in beiden Versionen, außerhalb der Zeitmessung.
  document.body.replaceChildren();
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < anzahl; index += 1) {
    const absatz = document.createElement("p");
    absatz.textContent = "Nutzer:innen " + index;
    fragment.append(absatz);
  }
  document.body.append(fragment);

  let aufrufe = 0;
  const regel: Rule = {
    id: "audit.dom-native-scale",
    risk: "safe",
    apply(eingabe) {
      aufrufe += 1;
      const text = eingabe.replaceAll("Nutzer:innen", "Nutzer");
      return { text, replacements: text === eingabe ? 0 : 1 };
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
  const dauerMs = performance.now() - anfang;
  const ersetzungen = prozessor.getReplacementCount();
  prozessor.stop();
  document.body.replaceChildren();
  return { dauerMs, aufrufe, ersetzungen };
}

function messen() {
  const ergebnisse = [];
  for (const anzahl of groessen) {
    for (let index = 0; index < aufwaermungen; index += 1) {
      const wert = initialscan(anzahl);
      if (wert.aufrufe !== anzahl || wert.ersetzungen !== anzahl) {
        throw new Error("Ungültige Aufwärmverarbeitung: " + JSON.stringify({ anzahl, wert }));
      }
    }
    const samplesMs = [];
    for (let index = 0; index < messungen; index += 1) {
      const wert = initialscan(anzahl);
      if (wert.aufrufe !== anzahl || wert.ersetzungen !== anzahl) {
        throw new Error("Unvollständige Textverarbeitung: " + JSON.stringify({ anzahl, wert }));
      }
      samplesMs.push(Math.round(wert.dauerMs * 1_000) / 1_000);
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
  }
  return { warmups: aufwaermungen, iterations: messungen, scenarios: ergebnisse };
}

// Ausschließlich Test-Fixture. Kein Zugriff auf Erweiterungs- oder Store-Zustände.
(window as unknown as { __sprachverstandNativeScaleAudit: () => ReturnType<typeof messen> })
  .__sprachverstandNativeScaleAudit = messen;