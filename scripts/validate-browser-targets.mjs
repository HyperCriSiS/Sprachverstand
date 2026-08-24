import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const projectRoot = process.cwd();
const chromiumTargets = ["chromium", "edge", "opera"];
const allTargets = [...chromiumTargets, "firefox"];
const packageJson = JSON.parse(
  await readFile(path.join(projectRoot, "package.json"), "utf8")
);

const requiredFiles = [
  "background.js",
  "content.js",
  "i18n-bootstrap.js",
  "popup/popup.html",
  "popup/popup.css",
  "popup/popup.js",
  "options/options.html",
  "options/options.css",
  "options/options.js",
  "icons/icon32.png",
  "icons/icon48.png",
  "icons/icon128.png",
  "_locales/de/messages.json",
  "_locales/en/messages.json",
  "legal/LICENSE.txt",
  "legal/TRADEMARKS.md",
  "legal/NOTICE.txt"
];

async function fileExists(filePath) {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}

async function listFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = path.posix.join(prefix, entry.name);
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(absolutePath, relativePath)));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }

  return files.sort();
}

async function digest(filePath) {
  const data = await readFile(filePath);
  return createHash("sha256").update(data).digest("hex");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function validateCommonManifest(target, manifest) {
  assert(manifest.manifest_version === 3, `${target}: Manifest V3 erwartet.`);
  assert(manifest.version === packageJson.version, `${target}: Versionsabweichung.`);
  assert(manifest.name === "__MSG_extensionName__", `${target}: lokalisierter Name fehlt.`);
  assert(
    manifest.description === "__MSG_extensionDescription__",
    `${target}: lokalisierte Beschreibung fehlt.`
  );
  assert(manifest.default_locale === "de", `${target}: default_locale muss de sein.`);
  assert(
    JSON.stringify(manifest.permissions) === JSON.stringify(["storage"]),
    `${target}: unerwartete Berechtigungen.`
  );
  assert(
    manifest.content_scripts?.length === 1 &&
      JSON.stringify(manifest.content_scripts[0].matches) === JSON.stringify(["<all_urls>"]),
    `${target}: der Seitenzugriff muss genau über das bestehende Content-Script erfolgen.`
  );
  assert(
    manifest.action?.default_popup === "popup/popup.html",
    `${target}: Popup-Einstieg fehlt.`
  );
  assert(
    manifest.options_ui?.page === "options/options.html",
    `${target}: Einstellungsseite fehlt.`
  );
}

const manifests = new Map();

for (const target of allTargets) {
  const outputDirectory = path.join(projectRoot, "dist", target);
  const manifestPath = path.join(outputDirectory, "manifest.json");
  assert(await fileExists(manifestPath), `${target}: dist/${target}/manifest.json fehlt.`);

  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifests.set(target, manifest);
  validateCommonManifest(target, manifest);

  for (const relativePath of requiredFiles) {
    assert(
      await fileExists(path.join(outputDirectory, relativePath)),
      `${target}: ${relativePath} fehlt im Build.`
    );
  }
}

for (const target of chromiumTargets) {
  const manifest = manifests.get(target);
  assert(
    manifest.background?.service_worker === "background.js",
    `${target}: Manifest-V3-Service-Worker fehlt.`
  );
  assert(
    !("browser_specific_settings" in manifest),
    `${target}: Firefox-spezifische Einstellungen dürfen nicht enthalten sein.`
  );
}

const firefoxManifest = manifests.get("firefox");
assert(
  Array.isArray(firefoxManifest.background?.scripts) &&
    firefoxManifest.background.scripts.includes("background.js"),
  "firefox: Hintergrundskript fehlt."
);
assert(
  "browser_specific_settings" in firefoxManifest,
  "firefox: Gecko-spezifische Einstellungen fehlen."
);

const referenceDirectory = path.join(projectRoot, "dist", "chromium");
const referenceFiles = (await listFiles(referenceDirectory)).filter(
  (relativePath) => relativePath !== "manifest.json"
);

for (const target of ["edge", "opera"]) {
  const targetDirectory = path.join(projectRoot, "dist", target);
  const targetFiles = (await listFiles(targetDirectory)).filter(
    (relativePath) => relativePath !== "manifest.json"
  );

  assert(
    JSON.stringify(targetFiles) === JSON.stringify(referenceFiles),
    `${target}: Dateiliste weicht vom Chromium-Build ab.`
  );

  for (const relativePath of referenceFiles) {
    const [referenceDigest, targetDigest] = await Promise.all([
      digest(path.join(referenceDirectory, relativePath)),
      digest(path.join(targetDirectory, relativePath))
    ]);

    assert(
      referenceDigest === targetDigest,
      `${target}: ${relativePath} weicht unerwartet vom Chromium-Build ab.`
    );
  }
}

console.log(
  "Browser-Ziele geprüft: Chromium, Microsoft Edge, Opera und Firefox."
);
