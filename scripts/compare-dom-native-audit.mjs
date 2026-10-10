import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const groessen = [1000, 4000, 10000];

function quantil(werte, anteil) {
  const sortiert = [...werte].sort((a, b) => a - b);
  return sortiert[Math.ceil(sortiert.length * anteil) - 1] ?? 0;
}

function validieren(daten, quelle) {
  if (daten?.schemaVersion !== 1 || !/^[a-f0-9]{40}$/.test(daten.sourceSha ?? "") ||
      typeof daten.packageVersion !== "string" ||
      typeof daten.nodeVersion !== "string" ||
      !["chromium", "firefox"].includes(daten.browser) ||
      !Array.isArray(daten.passes) || daten.passes.length !== 2) {
    throw new Error(quelle + ": ungültiger Bericht oder Quellnachweis.");
  }
  for (const durchlauf of daten.passes) {
    if (durchlauf?.warmups !== 2 || durchlauf?.iterations !== 7 ||
        !Array.isArray(durchlauf.scenarios) || durchlauf.scenarios.length !== 3) {
      throw new Error(quelle + ": falscher Messvertrag.");
    }
    for (const [index, nodes] of groessen.entries()) {
      const eintrag = durchlauf.scenarios[index];
      if (!eintrag || eintrag.id !== "initial-scan-" + nodes || eintrag.nodes !== nodes ||
          eintrag.ruleCalls !== nodes || eintrag.replacements !== nodes ||
          !Array.isArray(eintrag.samplesMs) || eintrag.samplesMs.length !== 7 ||
          !eintrag.samplesMs.every((wert) => Number.isFinite(wert) && wert > 0) ||
          Math.abs(eintrag.medianMs - quantil(eintrag.samplesMs, 0.5)) > 0.0001 ||
          Math.abs(eintrag.p95Ms - quantil(eintrag.samplesMs, 0.95)) > 0.0001) {
        throw new Error(quelle + ": ungültige Probe für " + nodes + " Knoten.");
      }
    }
  }
}

export function vergleicheNativeDomBerichte(baseline, aktuell) {
  validieren(baseline, "Referenz");
  validieren(aktuell, "Aktuell");
  if (baseline.browser !== aktuell.browser || baseline.browserVersion !== aktuell.browserVersion ||
      baseline.nodeVersion !== aktuell.nodeVersion) {
    throw new Error("Browser- oder Node-Laufzeit nicht identisch.");
  }
  const werte = groessen.map((nodes, index) => {
    const alle = (bericht) => bericht.passes.flatMap((x) => x.scenarios[index].samplesMs);
    const vorher = alle(baseline);
    const nachher = alle(aktuell);
    const referenzMedianMs = quantil(vorher, 0.5);
    const aktuellMedianMs = quantil(nachher, 0.5);
    const referenzP95Ms = quantil(vorher, 0.95);
    const aktuellP95Ms = quantil(nachher, 0.95);
    return {
      nodes, referenzMedianMs, aktuellMedianMs, referenzP95Ms, aktuellP95Ms,
      medianFaktor: Math.round(aktuellMedianMs / referenzMedianMs * 1000) / 1000,
      p95Faktor: Math.round(aktuellP95Ms / referenzP95Ms * 1000) / 1000
    };
  });
  const bericht = [
    "## DOM-02: nativer " + baseline.browser + "-Initialscan",
    "",
    "- Browser: " + baseline.browser + " " + baseline.browserVersion,
    "- Referenz: " + baseline.sourceSha + " (Paket " + baseline.packageVersion + ")",
    "- Aktuell: " + aktuell.sourceSha + " (Paket " + aktuell.packageVersion + ")",
    "- Node.js im Treiber: " + baseline.nodeVersion,
    "",
    "| Knoten | Referenz Median | Aktuell Median | Faktor | Referenz P95 | Aktuell P95 | Faktor |",
    "| ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...werte.map((wert) => "| " + wert.nodes + " | " +
      wert.referenzMedianMs.toFixed(3) + " ms | " + wert.aktuellMedianMs.toFixed(3) +
      " ms | " + wert.medianFaktor + "x | " + wert.referenzP95Ms.toFixed(3) +
      " ms | " + wert.aktuellP95Ms.toFixed(3) + " ms | " + wert.p95Faktor + "x |"),
    "",
    "Pro Version und Größe: zwei Messblöcke zu je sieben Proben und zwei Aufwärmrunden.",
    "Reihenfolge Referenz/Aktuell/Aktuell/Referenz im selben echten Browser.",
    "Der DOM-Aufbau ist ausgeschlossen; gemessen wird synchron DomProcessor.start().",
    "Keine Erweiterungsinstallation, kein Video, keine Hintergrundjobs: Kernisolierung, kein umfassendes Release-Performance-Gate.",
    "Historischer Tag v0.7.1 enthält Paketversion 0.6.6. Abhängigkeiten und Funktionsumfang unterscheiden sich.",
    ""
  ].join("\n");
  return { werte, markdown: bericht };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [vorher, nachher, ausgabe] = process.argv.slice(2);
  if (!vorher || !nachher || !ausgabe) {
    throw new Error("Parameter: baseline.json current.json vergleich.md");
  }
  const resultat = vergleicheNativeDomBerichte(
    JSON.parse(readFileSync(vorher, "utf8")),
    JSON.parse(readFileSync(nachher, "utf8"))
  );
  writeFileSync(ausgabe, resultat.markdown, "utf8");
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, resultat.markdown);
  }
  process.stdout.write(resultat.markdown);
}
