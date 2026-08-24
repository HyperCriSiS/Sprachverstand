import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const projectRoot = process.cwd();

const browserProfiles = [
  { name: "Brave", family: "Chromium", target: "chromium" },
  { name: "Vivaldi", family: "Chromium", target: "chromium" },
  { name: "Arc", family: "Chromium", target: "chromium" },
  { name: "LibreWolf", family: "Gecko", target: "firefox" },
  { name: "Zen Browser", family: "Gecko", target: "firefox" },
  { name: "Floorp", family: "Gecko", target: "firefox" }
];

async function fileExists(filePath) {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

for (const profile of browserProfiles) {
  const outputDirectory = path.join(projectRoot, "dist", profile.target);
  const manifestPath = path.join(outputDirectory, "manifest.json");

  assert(
    await fileExists(manifestPath),
    `${profile.name}: Basis-Build dist/${profile.target} fehlt.`
  );

  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

  assert(
    manifest.manifest_version === 3,
    `${profile.name}: Manifest V3 wird als gemeinsamer Kompatibilitätsvertrag erwartet.`
  );
  assert(
    manifest.content_scripts?.some((entry) => entry.matches?.includes("<all_urls>")),
    `${profile.name}: Content-Script für Webseiten fehlt.`
  );
  assert(
    manifest.action?.default_popup === "popup/popup.html",
    `${profile.name}: Popup-Einstieg fehlt.`
  );
  assert(
    manifest.options_ui?.page === "options/options.html",
    `${profile.name}: Einstellungsseite fehlt.`
  );

  if (profile.family === "Chromium") {
    assert(
      manifest.background?.service_worker === "background.js",
      `${profile.name}: Chromium-Service-Worker fehlt.`
    );
    assert(
      !("browser_specific_settings" in manifest),
      `${profile.name}: Firefox-spezifische Manifestdaten im Chromium-Build gefunden.`
    );
  } else {
    assert(
      Array.isArray(manifest.background?.scripts) && manifest.background.scripts.includes("background.js"),
      `${profile.name}: Gecko-Hintergrundskript fehlt.`
    );
    assert(
      "browser_specific_settings" in manifest,
      `${profile.name}: Gecko-spezifische Manifestdaten fehlen.`
    );
  }
}

const grouped = browserProfiles.reduce((result, profile) => {
  result[profile.family] ??= [];
  result[profile.family].push(profile.name);
  return result;
}, {});

for (const [family, browsers] of Object.entries(grouped)) {
  console.log(`${family}-Kompatibilität geprüft: ${browsers.join(", ")}.`);
}
