import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

// Jeder PR legt seinen Changelog-Eintrag als eigene Datei unter
// changes/unreleased/ ab. Zwei PRs ändern so nie dieselbe Datei.
// `--check` prüft die Fragmente, `--collect` überträgt sie in den Abschnitt
// „Unveröffentlicht“ von CHANGELOG.md und entfernt sie.

export const categories = [
  "Hinzugefügt",
  "Geändert",
  "Leistung",
  "Behoben",
  "Sicherheit",
  "Entfernt",
  "Tests"
];

const fragmentName = /^[a-z0-9][a-z0-9-]*\.md$/u;

export function parseFragment(name, text) {
  if (!fragmentName.test(name)) {
    throw new Error(`${name}: Dateiname nur aus Kleinbuchstaben, Ziffern und Bindestrichen, Endung .md.`);
  }
  const normalized = text.replaceAll("\r\n", "\n");
  const match = /^kategorie: ([^\n]+)\n\n([\s\S]+)$/u.exec(normalized);
  if (!match) {
    throw new Error(`${name}: erste Zeile „kategorie: …“, dann eine Leerzeile, dann der Eintrag.`);
  }
  const category = match[1].trim();
  if (!categories.includes(category)) {
    throw new Error(`${name}: unbekannte Kategorie „${category}“ (erlaubt: ${categories.join(", ")}).`);
  }
  const body = match[2].trimEnd();
  if (!body.startsWith("- ")) {
    throw new Error(`${name}: der Eintrag beginnt mit „- “ wie im Changelog.`);
  }
  return { name, category, body };
}

export async function readFragments(directory) {
  const names = (await readdir(directory)).filter((name) => name !== "README.md").sort();
  return Promise.all(names.map(async (name) =>
    parseFragment(name, await readFile(path.join(directory, name), "utf8"))));
}

// Inserts each fragment at the top of its category below „Unveröffentlicht“;
// missing category headings are created in the canonical order.
export function insertFragments(changelog, fragments) {
  const normalized = changelog.replaceAll("\r\n", "\n");
  const start = normalized.indexOf("\n## Unveröffentlicht\n");
  if (start < 0) throw new Error("CHANGELOG.md hat keinen Abschnitt „## Unveröffentlicht“.");
  const sectionStart = start + "\n## Unveröffentlicht\n".length;
  const next = normalized.indexOf("\n## ", sectionStart);
  const sectionEnd = next < 0 ? normalized.length : next + 1;
  let section = normalized.slice(sectionStart, sectionEnd);

  for (const category of [...categories].reverse()) {
    const entries = fragments.filter((fragment) => fragment.category === category);
    if (!entries.length) continue;
    const block = entries.map((entry) => entry.body).join("\n");
    const heading = `\n### ${category}\n\n`;
    const at = section.indexOf(heading);
    if (at >= 0) {
      const insertAt = at + heading.length;
      section = `${section.slice(0, insertAt)}${block}\n${section.slice(insertAt)}`;
      continue;
    }
    const later = categories.slice(categories.indexOf(category) + 1)
      .map((name) => section.indexOf(`\n### ${name}\n`))
      .filter((index) => index >= 0);
    const insertAt = later.length ? Math.min(...later) : section.trimEnd().length;
    section = `${section.slice(0, insertAt)}${heading}${block}\n${section.slice(insertAt)}`;
  }
  return normalized.slice(0, sectionStart) + section + normalized.slice(sectionEnd);
}

async function main() {
  const root = process.cwd();
  const directory = path.join(root, "changes", "unreleased");
  const fragments = await readFragments(directory);
  if (process.argv.includes("--collect")) {
    const changelogPath = path.join(root, "CHANGELOG.md");
    const changelog = await readFile(changelogPath, "utf8");
    await writeFile(changelogPath, insertFragments(changelog, fragments));
    await Promise.all(fragments.map((fragment) => rm(path.join(directory, fragment.name))));
    console.log(`Changelog-Fragmente übertragen: ${fragments.length}.`);
    return;
  }
  console.log(`Changelog-Fragmente geprüft: ${fragments.length}.`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await main();
}
