import { readFile } from "node:fs/promises";
import path from "node:path";

export const amoLocaleMap = new Map([
  ["de", "de"], ["en", "en-US"], ["es", "es-ES"], ["fr", "fr"],
  ["it", "it"], ["nl", "nl"], ["pl", "pl"], ["pt_BR", "pt-BR"],
  ["pt_PT", "pt-PT"], ["sv", "sv-SE"], ["no", "nb-NO"], ["fi", "fi"],
  ["cs", "cs"], ["sk", "sk"], ["hr", "hr"], ["sl", "sl"],
  ["sr", "sr"], ["hu", "hu"], ["ro", "ro"], ["ru", "ru"],
  ["uk", "uk"], ["el", "el"], ["tr", "tr"], ["he", "he"],
  ["ja", "ja"], ["ko", "ko"], ["vi", "vi"], ["zh_CN", "zh-CN"],
  ["zh_TW", "zh-TW"]
]);

function fail(message) {
  throw new Error(message);
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

export function parseReleaseVersionArgument(argv = process.argv.slice(2)) {
  const inline = argv.find((entry) => entry.startsWith("--release-version="));
  if (inline) {
    return inline.slice("--release-version=".length).trim();
  }

  const index = argv.indexOf("--release-version");
  if (index >= 0) {
    return argv[index + 1]?.trim();
  }

  return undefined;
}

export async function loadStoreReleaseNotes(root, requestedVersion) {
  let version = requestedVersion?.trim();
  if (!version) {
    const current = await readJson(
      path.join(root, "store", "release-notes", "current.json")
    );
    version = current?.version?.trim();
  }

  if (!version || !/^\d+\.\d+\.\d+$/u.test(version)) {
    fail(`Ungültige Store-Release-Version: ${version ?? "<leer>"}`);
  }

  const configuredLocales = await readJson(path.join(root, "config", "locales.json"));
  if (!Array.isArray(configuredLocales) || configuredLocales.length !== 51) {
    fail("Für Store-Release-Notes werden exakt 51 konfigurierte Locales erwartet.");
  }

  const document = await readJson(
    path.join(root, "store", "release-notes", `${version}.json`)
  );
  if (document?.version !== version || typeof document?.locales !== "object") {
    fail(`${version}: Release-Notes-Datei hat ein ungültiges Format.`);
  }

  const configuredCodes = configuredLocales.map((locale) => locale.code);
  const providedCodes = Object.keys(document.locales).sort();
  const expectedCodes = [...configuredCodes].sort();
  if (JSON.stringify(providedCodes) !== JSON.stringify(expectedCodes)) {
    fail(`${version}: Release-Notes müssen exakt alle 51 Store-Locales enthalten.`);
  }

  for (const code of configuredCodes) {
    const entry = document.locales[code];
    if (
      typeof entry?.heading !== "string" ||
      !entry.heading.trim() ||
      typeof entry?.notes !== "string" ||
      !entry.notes.trim()
    ) {
      fail(`${version}/${code}: Überschrift oder Release-Notes fehlen.`);
    }
  }

  if (amoLocaleMap.size !== 29) {
    fail("Die AMO-Locale-Zuordnung muss exakt 29 unterstützte Locales enthalten.");
  }

  return {
    version,
    configuredLocales,
    locales: document.locales
  };
}

export function createAmoReleaseNotes(releaseNotes) {
  const translated = {};
  for (const [sourceLocale, amoLocale] of amoLocaleMap) {
    translated[amoLocale] = releaseNotes.locales[sourceLocale].notes.trim();
  }
  return translated;
}

export function createChromeDescription(baseDescription, localeCode, releaseNotes) {
  const entry = releaseNotes.locales[localeCode];
  if (!entry) {
    fail(`Release-Notes fehlen für Chrome-Locale ${localeCode}.`);
  }
  return `${entry.heading.trim()}\n${entry.notes.trim()}\n\n${baseDescription.trim()}`;
}
