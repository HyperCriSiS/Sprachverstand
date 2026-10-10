import { DomProcessor } from "../src/core/dom-processor";
import type { Rule } from "../src/core/rule";

// Bewusst modellierte Mischlast, keine repräsentativ erhobene Web-Korrekturrate.
const groessen = [200, 1000, 4000] as const;
const abstand = 50; // 2 % der verarbeitbaren Textknoten benötigen eine Ersetzung.
const aufwaermungen = 2;
const messungen = 7;
const wiederholungenProProbe = 10; // Kurze Scans auch bei grober Firefox-Uhrauflösung erfassen.

function quantil(werte: readonly number[], anteil: number): number {
  const sortiert = [...werte].sort((a, b) => a - b);
  return sortiert[Math.ceil(sortiert.length * anteil) - 1] ?? 0;
}

function initialscan(anzahl: number) {
  document.body.replaceChildren();
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < anzahl; index++) {
    const absatz = document.createElement("p");
    const satz = [
      "Die Einstellungen bleiben während der Navigation unverändert.",
      "Der Beitrag beschreibt die aktuellen Funktionen der Anwendung.",
      "Weitere Informationen finden sich in der Dokumentation und Übersicht.",
      "Die Inhalte werden nach dem Laden dynamisch aktualisiert.",
      "Dieses Beispiel enthält überwiegend ganz normalen Seitentext."
    ][index % 5];
    absatz.textContent = index % abstand === 0
      ? "Nutzer:innen lesen den Beitrag. " + satz
      : satz;
    fragment.append(absatz);
  }
  const code = document.createElement("code");
  code.textContent = "Nutzer:innen";
  const eingabe = document.createElement("textarea");
  eingabe.value = "Nutzer:innen";
  fragment.append(code, eingabe);
  document.body.append(fragment);

  let aufrufe = 0;
  const regel: Rule = {
    id: "audit.dom02-mixed-density",
    risk: "safe",
    apply(eingabe) {
      aufrufe++;
      const text = eingabe.replaceAll("Nutzer:innen", "Nutzer");
      return { text, replacements: text === eingabe ? 0 : 1 };
    }
  };
  const prozessor = new DomProcessor(document, {
    rules: [regel], profile: "conservative", processAccessibleAttributes: false
  });
  const anfang = performance.now();
  prozessor.start();
  const dauerMs = performance.now() - anfang;
  const ersetzungen = prozessor.getReplacementCount();
  const geschuetzt = code.textContent === "Nutzer:innen" &&
    eingabe.value === "Nutzer:innen";
  prozessor.stop();
  document.body.replaceChildren();
  return { dauerMs, aufrufe, ersetzungen, geschuetzt };
}

function messen() {
  const ergebnisse = [];
  for (const anzahl of groessen) {
    const erwartet = Math.ceil(anzahl / abstand);
    const proben: number[] = [];
    for (let index = 0; index < aufwaermungen + messungen; index++) {
      let gemesseneDauer = 0;
      for (let wiederholung = 0; wiederholung < wiederholungenProProbe; wiederholung++) {
        const wert = initialscan(anzahl);
        if (wert.aufrufe !== anzahl || wert.ersetzungen !== erwartet || !wert.geschuetzt) {
          throw new Error("Mischlast-Vertrag verletzt: " + JSON.stringify({ anzahl, erwartet, wert }));
        }
        gemesseneDauer += wert.dauerMs;
      }
      if (index >= aufwaermungen) {
        // Nur die reine Processor-Dauer mitteln, nicht den Fixture-DOM-Aufbau.
        proben.push(Math.round(gemesseneDauer * 1000 / wiederholungenProProbe) / 1000);
      }
    }
    ergebnisse.push({
      id: "mixed-scan-" + anzahl, nodes: anzahl, samplesMs: proben,
      medianMs: quantil(proben, 0.5), p95Ms: quantil(proben, 0.95),
      ruleCalls: anzahl, replacements: erwartet
    });
  }
  return { warmups: aufwaermungen, iterations: messungen, repetitionsPerSample: wiederholungenProProbe, scenarios: ergebnisse };
}

// Einheitliche Browsertreiber-Schnittstelle; ausschließlich synthetische Fixture.
(window as unknown as { __sprachverstandNativeScaleAudit: () => ReturnType<typeof messen> })
  .__sprachverstandNativeScaleAudit = messen;