import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

// Verifiziert Release- und Vorabarchive ohne Netzwerk-, Signatur- oder Uploadaktionen.
const [dir, label, version, commit, tag] = process.argv.slice(2);
assert(dir && label && version && commit && tag, "Paketverzeichnis, Label, Version, Commit und Tag fehlen");
assert(/^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(label), "Ungültiges Paketlabel");
assert(/^\d+\.\d+\.\d+$/u.test(version), "Ungültige Version");
assert(/^[a-f0-9]{40}$/u.test(commit), "Ungültiger Git-Commit");
assert(tag === "preflight" || /^v\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/u.test(tag),
  "Ungültige Tag-Kennung");
const prefix = path.join(dir, "sprachverstand-" + label);
const files = {
  chromium: prefix + "-chromium.zip",
  edge: prefix + "-edge.zip",
  opera: prefix + "-opera.zip",
  firefox: prefix + "-firefox.xpi",
  source: prefix + "-source.zip"
};
function list(file) {
  return execFileSync("unzip", ["-Z1", file], {
    encoding: "utf8", maxBuffer: 16 * 1024 * 1024
  }).split(/\r?\n/u).filter((name) => name && !name.endsWith("/")).sort();
}
function read(file, entry) {
  return execFileSync("unzip", ["-p", file, entry], { maxBuffer: 128 * 1024 * 1024 });
}
function json(file, entry) {
  return JSON.parse(read(file, entry).toString("utf8"));
}
const required = ["manifest.json", "content.js", "background.js",
  "popup/popup.html", "options/options.html", "_locales/de/messages.json"];
for (const target of ["chromium", "edge", "opera", "firefox"]) {
  const entries = list(files[target]);
  for (const name of required) {
    assert(entries.includes(name), target + ": Datei fehlt: " + name);
  }
  const manifest = json(files[target], "manifest.json");
  const expected = JSON.parse(readFileSync("manifests/" + target + ".json", "utf8"));
  assert.deepEqual(manifest, expected, target + ": Quellmanifest weicht ab");
  assert.equal(manifest.version, version, target + ": falsche Version");
  assert.equal(manifest.manifest_version, 3, target + ": Manifest V3 erwartet");
  if (target === "firefox") {
    assert(manifest.browser_specific_settings?.gecko?.id, "Firefox-ID fehlt");
    assert(!entries.some((entry) => entry.startsWith("META-INF/")),
      "Die Firefox-XPI darf nicht vorsigniert sein");
  } else {
    assert(manifest.background?.service_worker, target + ": Service Worker fehlt");
  }
}
const chromiumEntries = list(files.chromium).filter((entry) => entry !== "manifest.json");
for (const target of ["edge", "opera"]) {
  const candidates = list(files[target]).filter((entry) => entry !== "manifest.json");
  assert.deepEqual(candidates, chromiumEntries,
    target + ": Dateiliste unterscheidet sich vom Chromium-Build");
  for (const entry of chromiumEntries) {
    assert.deepEqual(read(files[target], entry), read(files.chromium, entry),
      target + ": Dateiinhalt weicht von Chromium ab: " + entry);
  }
}
const sourceEntries = list(files.source);
for (const name of ["package.json", "package-lock.json", "SOURCE_COMMIT.txt",
  "RELEASE_PROVENANCE.txt", "store/release-notes/" + version + ".json"]) {
  assert(sourceEntries.includes(name), "Quellpaketdatei fehlt: " + name);
}
const pkg = json(files.source, "package.json");
const lock = json(files.source, "package-lock.json");
const notes = json(files.source, "store/release-notes/" + version + ".json");
for (const [name, value] of [["Paket", pkg.version], ["Lock", lock.version],
  ["Lock-Wurzel", lock.packages?.[""]?.version], ["Release-Notes", notes.version]]) {
  assert.equal(value, version, name + ": Versionsabweichung");
}
for (const target of ["chromium", "edge", "opera", "firefox"]) {
  const sourceManifest = json(files.source, "manifests/" + target + ".json");
  assert.equal(sourceManifest.version, version, target + ": Quellversion weicht ab");
  assert.deepEqual(sourceManifest, json(files[target], "manifest.json"),
    target + ": Paket- und Quellmanifest unterscheiden sich");
}
assert.equal(read(files.source, "SOURCE_COMMIT.txt").toString("utf8").trim(), commit,
  "Falscher Quellcommit");
const provenance = read(files.source, "RELEASE_PROVENANCE.txt").toString("utf8");
for (const value of ["Produktlinie: modern", "Tag: " + tag, "Commit: " + commit,
  "Version: " + version, "git archive", "package.json", "package-lock.json",
  "manifests/edge.json", "manifests/opera.json"]) {
  assert(provenance.includes(value), "Provenienz fehlt: " + value);
}
console.log("Alle fünf modernen Archive validiert: " + version + ", " + tag);
