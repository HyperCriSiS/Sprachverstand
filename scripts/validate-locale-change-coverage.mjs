import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const baseRef = process.env.GITHUB_BASE_REF?.trim();
if (!baseRef) {
  console.log("Kein Pull-Request-Basisbranch gesetzt; semantischer Locale-Diff wird übersprungen.");
  process.exit(0);
}

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8" });
}

function readJsonAt(ref, path) {
  try {
    return JSON.parse(git("show", `${ref}:${path}`));
  } catch {
    return undefined;
  }
}

function currentJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return undefined;
  }
}

function entryFingerprint(entry) {
  if (entry === undefined) return "__MISSING__";
  return JSON.stringify(entry);
}

function changedKeys(before, after) {
  const keys = new Set([
    ...Object.keys(before ?? {}),
    ...Object.keys(after ?? {})
  ]);
  return new Set(
    [...keys].filter(
      (key) => entryFingerprint(before?.[key]) !== entryFingerprint(after?.[key])
    )
  );
}

const remoteBase = `refs/remotes/origin/${baseRef}`;
git("fetch", "--no-tags", "--depth=1", "origin", `${baseRef}:${remoteBase}`);

const localeConfig = JSON.parse(readFileSync("config/locales.json", "utf8"));
const codes = localeConfig.map((locale) => locale.code);

const sourceLocales = ["de", "en"];
const sourceChanges = sourceLocales.map((code) => {
  const path = `static/_locales/${code}/messages.json`;
  return changedKeys(readJsonAt(remoteBase, path), currentJson(path));
});

const semanticKeys = [...sourceChanges[0]].filter((key) => sourceChanges[1].has(key));
if (semanticKeys.length === 0) {
  console.log("Keine gleichzeitig in Deutsch und Englisch geänderten i18n-Keys gefunden.");
  process.exit(0);
}

const failures = [];
for (const key of semanticKeys) {
  for (const code of codes) {
    if (sourceLocales.includes(code)) continue;
    const path = `static/_locales/${code}/messages.json`;
    const before = readJsonAt(remoteBase, path);
    const after = currentJson(path);
    if (entryFingerprint(before?.[key]) === entryFingerprint(after?.[key])) {
      failures.push(`${code}/${key}`);
    }
  }
}

if (failures.length > 0) {
  throw new Error(
    `Semantische DE/EN-Änderungen wurden nicht in allen Locales nachvollzogen: ${failures.join(", ")}.`
  );
}

console.log(
  `Semantische i18n-Änderungen vollständig abgedeckt: ${semanticKeys.join(", ")} in ${codes.length} Locales.`
);
