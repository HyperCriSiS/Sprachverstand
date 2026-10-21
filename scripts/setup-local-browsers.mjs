#!/usr/bin/env node
// Diagnostic-only: loads pinned official browser builds and their WebDriver
// into artifacts/local-tools (gitignored) for local live checks:
//   - Chrome for Testing + chromedriver (storage.googleapis.com)
//   - Firefox (archive.mozilla.org, SHA256SUMS-checked) + geckodriver
//     (github.com/mozilla/geckodriver releases)
// The local counterpart of setup-chrome-for-testing.sh; nothing is bundled in
// the addon, and the folder never needs archiving: run this again instead.
//   node scripts/setup-local-browsers.mjs [--only chrome|firefox] [--force]
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readdirSync, renameSync, rmSync, writeFileSync} from "node:fs";
import {dirname, join, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const versions = {
  chrome: process.env.CFT_VERSION ?? "155.0.8059.39",
  firefox: process.env.FIREFOX_VERSION ?? "158.0.1",
  geckodriver: process.env.GECKODRIVER_VERSION ?? "0.37.1"
};
const versionPattern = /^\d+\.\d+(?:\.\d+){0,2}$/u;
for (const [name, version] of Object.entries(versions)) {
  if (!versionPattern.test(version)) throw new Error(`Ungültige ${name}-Version: ${version}`);
}

const windows = process.platform === "win32";
const mac = process.platform === "darwin";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "artifacts", "local-tools");
const force = process.argv.includes("--force");
const onlyIndex = process.argv.indexOf("--only");
const only = onlyIndex >= 0 ? process.argv[onlyIndex + 1] : undefined;
if (only !== undefined && only !== "chrome" && only !== "firefox") {
  throw new Error("--only erwartet chrome oder firefox");
}
mkdirSync(root, {recursive: true});

async function download(url, file) {
  console.log(`lade ${url}`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  writeFileSync(file, bytes);
  return bytes;
}

function unzip(archive, destination) {
  // Windows ships bsdtar, which reads zip archives; elsewhere unzip is standard.
  if (windows) {
    execFileSync(join(process.env.SystemRoot ?? "C:\\Windows", "System32", "tar.exe"),
      ["-xf", archive, "-C", destination], {stdio: "inherit"});
  } else {
    execFileSync("unzip", ["-q", "-o", archive, "-d", destination], {stdio: "inherit"});
  }
}

function prepare(folder) {
  if (existsSync(folder) && !force) {
    console.log(`vorhanden: ${folder} (--force lädt neu)`);
    return false;
  }
  rmSync(folder, {recursive: true, force: true});
  return true;
}

function versionOf(executable, expected, label) {
  const output = execFileSync(executable, ["--version"], {encoding: "utf8"}).trim();
  if (!output.includes(expected)) throw new Error(`${label} passt nicht zu ${expected}: ${output}`);
  console.log(`geprüft: ${output}`);
}

async function setupChrome() {
  const platform = windows ? "win64" : mac ? (process.arch === "arm64" ? "mac-arm64" : "mac-x64") : "linux64";
  for (const component of ["chrome", "chromedriver"]) {
    const folder = join(root, `${component}-${platform}`);
    if (!prepare(folder)) continue;
    const archive = join(root, `${component}-${platform}.zip`);
    await download(`https://storage.googleapis.com/chrome-for-testing-public/${versions.chrome}/${platform}/${component}-${platform}.zip`, archive);
    unzip(archive, root);
    rmSync(archive);
  }
  versionOf(join(root, `chromedriver-${platform}`, `chromedriver${windows ? ".exe" : ""}`), versions.chrome, "chromedriver");
}

// The Windows installer is a 7-Zip self-extractor; its `core` folder is the
// complete browser. The official standalone 7zr.exe reads it.
async function sevenZip() {
  const tool = join(root, "7zr.exe");
  if (!existsSync(tool)) await download("https://www.7-zip.org/a/7zr.exe", tool);
  return tool;
}

async function setupFirefox() {
  if (mac) {
    console.log("Firefox: unter macOS bitte die offizielle .dmg nutzen; übersprungen.");
  } else {
    const folder = join(root, `firefox-${versions.firefox}`);
    if (prepare(folder)) {
      const path = windows
        ? `win64/en-US/Firefox Setup ${versions.firefox}.exe`
        : `linux-x86_64/en-US/firefox-${versions.firefox}.tar.xz`;
      const base = `https://archive.mozilla.org/pub/firefox/releases/${versions.firefox}`;
      const archive = join(root, windows ? "firefox-setup.exe" : "firefox.tar.xz");
      const bytes = await download(`${base}/${encodeURI(path)}`, archive);
      const sums = await (await fetch(`${base}/SHA256SUMS`)).text();
      const expected = sums.split("\n").find((line) => line.endsWith(`  ${path}`))?.slice(0, 64);
      const actual = createHash("sha256").update(bytes).digest("hex");
      if (!expected || expected !== actual) throw new Error(`Firefox: SHA256 stimmt nicht (${actual})`);
      console.log("Firefox: SHA256 geprüft");
      mkdirSync(folder, {recursive: true});
      if (windows) {
        const extracted = join(root, "firefox-setup");
        rmSync(extracted, {recursive: true, force: true});
        execFileSync(await sevenZip(), ["x", "-y", `-o${extracted}`, archive], {stdio: "ignore"});
        for (const entry of readdirSync(join(extracted, "core"))) renameSync(join(extracted, "core", entry), join(folder, entry));
        rmSync(extracted, {recursive: true, force: true});
      } else {
        execFileSync("tar", ["-xJf", archive, "-C", folder, "--strip-components=1"], {stdio: "inherit"});
      }
      rmSync(archive);
    }
    const firefox = join(folder, windows ? "firefox.exe" : "firefox");
    // firefox.exe --version writes to a console only through the redirect below.
    const reported = execFileSync(firefox, ["--version"], {encoding: "utf8", stdio: ["ignore", "pipe", "ignore"]}).trim();
    if (reported && !reported.includes(versions.firefox)) throw new Error(`Firefox passt nicht zu ${versions.firefox}: ${reported}`);
    console.log(`geprüft: Firefox ${versions.firefox}${reported ? ` (${reported})` : ""}`);
  }

  const platform = windows ? "win64" : mac ? (process.arch === "arm64" ? "macos-aarch64" : "macos") : "linux64";
  const folder = join(root, `geckodriver-${platform}`);
  if (prepare(folder)) {
    mkdirSync(folder, {recursive: true});
    const name = `geckodriver-v${versions.geckodriver}-${platform}.${windows ? "zip" : "tar.gz"}`;
    const archive = join(root, name);
    await download(`https://github.com/mozilla/geckodriver/releases/download/v${versions.geckodriver}/${name}`, archive);
    if (windows) unzip(archive, folder);
    else execFileSync("tar", ["-xzf", archive, "-C", folder], {stdio: "inherit"});
    rmSync(archive);
  }
  versionOf(join(folder, `geckodriver${windows ? ".exe" : ""}`), versions.geckodriver, "geckodriver");
}

if (only !== "firefox") await setupChrome();
if (only !== "chrome") await setupFirefox();
console.log(`fertig: ${root}`);
