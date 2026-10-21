#!/usr/bin/env node
// Diagnostic-only: loads the pinned official Chrome for Testing build and its
// chromedriver into artifacts/local-tools (gitignored) for local live checks.
// The Windows counterpart of setup-chrome-for-testing.sh; nothing is bundled
// in the addon, and the folder never needs archiving: run this again instead.
import {execFileSync} from "node:child_process";
import {existsSync, mkdirSync, rmSync, writeFileSync} from "node:fs";
import {dirname, join, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const version = process.env.CFT_VERSION ?? "155.0.8059.39";
if (!/^\d+\.\d+\.\d+\.\d+$/u.test(version)) throw new Error(`Ungültige Version: ${version}`);
const platform = process.platform === "win32" ? "win64"
  : process.platform === "darwin" ? (process.arch === "arm64" ? "mac-arm64" : "mac-x64")
  : "linux64";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "artifacts", "local-tools");
const force = process.argv.includes("--force");
mkdirSync(root, {recursive: true});

function extract(archive, destination) {
  // Windows ships bsdtar, which reads zip archives; elsewhere unzip is standard.
  if (process.platform === "win32") {
    execFileSync(join(process.env.SystemRoot ?? "C:\\Windows", "System32", "tar.exe"),
      ["-xf", archive, "-C", destination], {stdio: "inherit"});
  } else {
    execFileSync("unzip", ["-q", "-o", archive, "-d", destination], {stdio: "inherit"});
  }
}

for (const component of ["chrome", "chromedriver"]) {
  const folder = join(root, `${component}-${platform}`);
  if (existsSync(folder) && !force) {
    console.log(`${component}: vorhanden (${folder}), --force lädt neu`);
    continue;
  }
  rmSync(folder, {recursive: true, force: true});
  const url = `https://storage.googleapis.com/chrome-for-testing-public/${version}/${platform}/${component}-${platform}.zip`;
  console.log(`${component}: lade ${url}`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${component}: HTTP ${response.status}`);
  const archive = join(root, `${component}-${platform}.zip`);
  writeFileSync(archive, Buffer.from(await response.arrayBuffer()));
  extract(archive, root);
  rmSync(archive);
}

const suffix = process.platform === "win32" ? ".exe" : "";
const driver = join(root, `chromedriver-${platform}`, `chromedriver${suffix}`);
const driverVersion = execFileSync(driver, ["--version"], {encoding: "utf8"}).trim();
if (!driverVersion.includes(version)) {
  throw new Error(`chromedriver passt nicht zur Version ${version}: ${driverVersion}`);
}
console.log(`fertig: ${driverVersion}`);
console.log(`Chrome: ${join(root, `chrome-${platform}`)}`);
