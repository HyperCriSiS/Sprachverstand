import { appendFileSync, readFileSync, writeFileSync } from "node:fs";

const [browser, baselinePath, currentPath, output] = process.argv.slice(2);
if (!["chromium", "firefox"].includes(browser) || !baselinePath || !currentPath || !output) {
  throw new Error("Verwendung: browser baseline.json current.json output.md");
}
const references = [
  ["Referenz", JSON.parse(readFileSync(baselinePath, "utf8"))],
  ["Aktuell", JSON.parse(readFileSync(currentPath, "utf8"))]
];
const lines = [
  "## DOM-02 Funktionsprofil – " + browser,
  "",
  "Reine Diagnose im echten Browser; Profilierungs-Wrapper beeinflussen selbst die Laufzeiten.",
  "Die Zeiten sind exklusive, über sieben instrumentierte Proben aufsummierte Funktionszeiten.",
  "Unbekannte Methoden im historischen Code werden nicht als Nullkosten interpretiert.",
  ""
];
for (const [label, report] of references) {
  if (report.browser !== browser || !/^[a-f0-9]{40}$/.test(report.sourceSha) ||
      !Array.isArray(report.passes) || report.passes.length !== 2) {
    throw new Error(label + ": Herkunft oder Messblöcke ungültig.");
  }
  lines.push("### " + label + " – " + report.sourceSha + " (Paket " + report.packageVersion + ")", "");
  lines.push("| Knoten | Funktion | Aufrufe | Eigene Zeit | Gesamtzeit inkl. Aufrufe |",
    "| ---: | --- | ---: | ---: | ---: |");
  for (const nodes of [1000, 4000, 10000]) {
    const aggregate = new Map();
    for (const block of report.passes) {
      if (block.warmups !== 2 || block.iterations !== 7 ||
          !Array.isArray(block.scenarios) || block.scenarios.length !== 3) {
        throw new Error(label + ": falscher Profilvertrag.");
      }
      const scenario = block.scenarios.find((item) => item.nodes === nodes);
      if (!scenario || scenario.replacements !== nodes || scenario.ruleCalls !== nodes ||
          !scenario.methodProfile || typeof scenario.methodProfile !== "object") {
        throw new Error(label + ": Profil oder Ersetzungen fehlen für " + nodes);
      }
      for (const [name, item] of Object.entries(scenario.methodProfile)) {
        if (!Number.isInteger(item.calls) || item.calls < 0 ||
            !Number.isFinite(item.ownMs) || item.ownMs < 0 ||
            !Number.isFinite(item.totalMs) || item.totalMs < item.ownMs) {
          throw new Error(label + ": ungültige Methode " + name);
        }
        const old = aggregate.get(name) ?? { calls: 0, ownMs: 0, totalMs: 0 };
        aggregate.set(name, {
          calls: old.calls + item.calls,
          ownMs: old.ownMs + item.ownMs,
          totalMs: old.totalMs + item.totalMs
        });
      }
    }
    const ordered = [...aggregate.entries()].sort((a, b) => b[1].ownMs - a[1].ownMs);
    for (const [name, item] of ordered) {
      lines.push("| " + nodes + " | " + name + " | " + item.calls + " | " +
        item.ownMs.toFixed(2) + " ms | " + item.totalMs.toFixed(2) + " ms |");
    }
  }
  lines.push("");
}
const markdown = lines.join("\n") + "\n";
writeFileSync(output, markdown);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
process.stdout.write(markdown);
