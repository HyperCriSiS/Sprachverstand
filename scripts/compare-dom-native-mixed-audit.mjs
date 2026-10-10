import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const groessen = [200, 1000, 4000];
const anteil = 50;

function quantil(werte, q) {
  const sortiert = [...werte].sort((a, b) => a - b);
  return sortiert[Math.ceil(sortiert.length * q) - 1] ?? 0;
}
function validieren(bericht, bezeichnung) {
  if (bericht?.schemaVersion !== 1 ||
      !/^[a-f0-9]{40}$/u.test(bericht.sourceSha ?? "") ||
      bericht.packageVersion !== "0.7.2" ||
      !["chromium", "firefox"].includes(bericht.browser) ||
      !Array.isArray(bericht.passes) || bericht.passes.length !== 2) {
    throw new Error(bezeichnung + ": ungültige Herkunft oder Paketversion.");
  }
  for (const durchlauf of bericht.passes) {
    if (durchlauf?.warmups !== 2 || durchlauf?.iterations !== 7 ||
        durchlauf.scenarios?.length !== groessen.length) {
      throw new Error(bezeichnung + ": falscher Messvertrag.");
    }
    for (const [index, knoten] of groessen.entries()) {
      const s = durchlauf.scenarios[index];
      const erwartet = Math.ceil(knoten / anteil);
      if (s?.id !== "mixed-scan-" + knoten || s.nodes !== knoten ||
          s.ruleCalls !== knoten || s.replacements !== erwartet ||
          s.samplesMs?.length !== 7 || !s.samplesMs.every(x => Number.isFinite(x) && x > 0) ||
          Math.abs(s.medianMs - quantil(s.samplesMs, 0.5)) > 0.0001 ||
          Math.abs(s.p95Ms - quantil(s.samplesMs, 0.95)) > 0.0001) {
        throw new Error(bezeichnung + ": unvollständige Mischlast für " + knoten);
      }
    }
  }
}
export function vergleichen(vorher, nachher) {
  validieren(vorher, "Referenz");
  validieren(nachher, "Aktuell");
  if (vorher.browser !== nachher.browser || vorher.browserVersion !== nachher.browserVersion ||
      vorher.nodeVersion !== nachher.nodeVersion ||
      vorher.sourceSha !== "aef8584db39cd2b19d5aa30a16b9966de8c61818") {
    throw new Error("Unterschiedliche Browserumgebung oder falscher Referenzcommit.");
  }
  const zeilen = [
    "## DOM-02: synthetische Mischlast – " + vorher.browser,
    "",
    "Referenz: " + vorher.sourceSha + " · aktuell: " + nachher.sourceSha,
    "",
    "2 % künstlich markierte Absätze, 98 % unveränderter Text. Code und Eingabefeld sind geschützt.",
    "Diese Verteilung ist eine Testannahme, **kein empirischer Wert typischer Webseiten**.",
    "Nur synchroner Initialscan im echten Browser, ohne vollständig installiertes Add-on, Navigation, Video oder Benutzerinteraktionen.",
    "",
    "| Textknoten | Ersetzungen | Vorher Median | Aktuell Median | Faktor |",
    "| ---: | ---: | ---: | ---: | ---: |"
  ];
  for (const [index, knoten] of groessen.entries()) {
    const samples = x => x.passes.flatMap(p => p.scenarios[index].samplesMs);
    const a = quantil(samples(vorher), 0.5), b = quantil(samples(nachher), 0.5);
    zeilen.push("| " + knoten + " | " + Math.ceil(knoten / anteil) +
      " | " + a.toFixed(3) + " ms | " + b.toFixed(3) +
      " ms | " + (b / a).toFixed(3) + "× |");
  }
  zeilen.push("", "Zwei gepaarte Messblöcke je Version, 7 Proben und 2 Warmups pro Block.",
    "Reihenfolge Referenz/Aktuell/Aktuell/Referenz. Das separate 100-%-Stressprofil bleibt erhalten.", "");
  return zeilen.join("\n");
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [referenz, aktuell, ausgabe] = process.argv.slice(2);
  if (!referenz || !aktuell || !ausgabe) throw new Error("Aufruf: referenz.json aktuell.json bericht.md");
  const markdown = vergleichen(JSON.parse(readFileSync(referenz, "utf8")),
    JSON.parse(readFileSync(aktuell, "utf8")));
  writeFileSync(ausgabe, markdown);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
  console.log(markdown);
}
