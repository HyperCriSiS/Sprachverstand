import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const groessen = [1000, 4000, 10000];

function pruefeBericht(bericht, name) {
  if (bericht?.schemaVersion !== 1 || !Array.isArray(bericht.scenarios) ||
      typeof bericht.sourceSha !== "string" || bericht.sourceSha.length !== 40 ||
      typeof bericht.packageVersion !== "string" || typeof bericht.nodeVersion !== "string") {
    throw new Error(name + ": Bericht oder Herkunftsangaben ungültig.");
  }
  const abbildung = new Map();
  for (const eintrag of bericht.scenarios) {
    if (!groessen.includes(eintrag.nodes) || abbildung.has(eintrag.nodes) ||
        eintrag.id !== "initial-scan-" + eintrag.nodes ||
        eintrag.ruleCalls !== eintrag.nodes || eintrag.replacements !== eintrag.nodes ||
        !Array.isArray(eintrag.samplesMs) || eintrag.samplesMs.length !== 7 ||
        !eintrag.samplesMs.every((wert) => Number.isFinite(wert) && wert >= 0) ||
        !Number.isFinite(eintrag.medianMs) || eintrag.medianMs <= 0 ||
        !Number.isFinite(eintrag.p95Ms) || eintrag.p95Ms < eintrag.medianMs) {
      throw new Error(name + ": fehlerhafte Messreihe.");
    }
    abbildung.set(eintrag.nodes, eintrag);
  }
  if (abbildung.size !== groessen.length) {
    throw new Error(name + ": unvollständige Messgrößen.");
  }
  return abbildung;
}

export function vergleicheDomSkalierung(baseline, aktuell) {
  const alt = pruefeBericht(baseline, "Baseline");
  const neu = pruefeBericht(aktuell, "Aktuell");
  const zeilen = groessen.map((nodes) => {
    const vorher = alt.get(nodes);
    const nachher = neu.get(nodes);
    return {
      nodes,
      baselineMedianMs: vorher.medianMs,
      currentMedianMs: nachher.medianMs,
      baselineP95Ms: vorher.p95Ms,
      currentP95Ms: nachher.p95Ms,
      medianRatio: Math.round(nachher.medianMs / vorher.medianMs * 1000) / 1000,
      p95Ratio: Math.round(nachher.p95Ms / vorher.p95Ms * 1000) / 1000
    };
  });
  const markdown = [
    "## DOM-02: JSDOM-Initialscan-Vergleich",
    "",
    "Referenz: " + baseline.sourceSha + " (Paket " + baseline.packageVersion + ", Node " + baseline.nodeVersion + ")",
    "Aktuell: " + aktuell.sourceSha + " (Paket " + aktuell.packageVersion + ", Node " + aktuell.nodeVersion + ")",
    "",
    "| Textknoten | Referenz Median | Aktuell Median | Verhältnis | Referenz P95 | Aktuell P95 | Verhältnis |",
    "| ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...zeilen.map((x) => "| " + x.nodes + " | " +
      x.baselineMedianMs + " ms | " + x.currentMedianMs + " ms | " +
      x.medianRatio + "x | " + x.baselineP95Ms + " ms | " +
      x.currentP95Ms + " ms | " + x.p95Ratio + "x |"),
    "",
    "Je Größe sieben Messungen und zwei Aufwärmrunden; DOM-Aufbauzeit nicht mitgemessen.",
    "Die CI-Stände verwenden historisch unterschiedliche Abhängigkeiten. Dies sind JSDOM-Zeiten und keine nativen Browserlaufzeiten oder Release-Freigaben.",
    "Ein Verhältnis über 1 bedeutet längere gemessene Laufzeit der aktuellen Version.",
    ""
  ].join("\n");
  return { zeilen, markdown };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [baselineDatei, aktuelleDatei, zielDatei] = process.argv.slice(2);
  if (!baselineDatei || !aktuelleDatei || !zielDatei) {
    throw new Error("Argumente: baseline.json current.json comparison.md");
  }
  const baseline = JSON.parse(readFileSync(baselineDatei, "utf8"));
  const aktuell = JSON.parse(readFileSync(aktuelleDatei, "utf8"));
  const vergleich = vergleicheDomSkalierung(baseline, aktuell);
  writeFileSync(zielDatei, vergleich.markdown, "utf8");
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, vergleich.markdown);
  }
  process.stdout.write(vergleich.markdown);
}
