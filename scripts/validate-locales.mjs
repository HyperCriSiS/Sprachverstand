import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const localeRoot = path.join(projectRoot, "static", "_locales");
const configuredLocales = JSON.parse(
  await readFile(path.join(projectRoot, "config", "locales.json"), "utf8")
);
const semanticContracts = JSON.parse(
  await readFile(path.join(projectRoot, "config", "locale-semantic-contracts.json"), "utf8")
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sorted(values) {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function placeholderTokens(message) {
  return sorted(message.match(/\$[A-Z0-9_]+\$/g) ?? []);
}

async function readMessages(locale) {
  const file = path.join(localeRoot, locale, "messages.json");
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    throw new Error(`${locale}: messages.json fehlt oder ist ungültig: ${error.message}`);
  }
}

assert(Array.isArray(configuredLocales), "config/locales.json muss eine Liste sein.");
assert(configuredLocales.length === 51, `Erwartet werden exakt 51 Locales, gefunden: ${configuredLocales.length}.`);

const configuredCodes = configuredLocales.map((locale) => locale.code);
assert(new Set(configuredCodes).size === configuredCodes.length, "Locale-Codes müssen eindeutig sein.");
assert(configuredCodes.includes("de") && configuredCodes.includes("en"), "Deutsch und Englisch müssen enthalten sein.");

for (const locale of configuredLocales) {
  assert(typeof locale.code === "string" && locale.code, "Jede Locale benötigt einen Code.");
  assert(typeof locale.name === "string" && locale.name, `${locale.code}: Anzeigename fehlt.`);
  assert(locale.direction === "ltr" || locale.direction === "rtl", `${locale.code}: Schreibrichtung muss ltr oder rtl sein.`);
}

const rtlCodes = sorted(configuredLocales.filter((locale) => locale.direction === "rtl").map((locale) => locale.code));
assert(JSON.stringify(rtlCodes) === JSON.stringify(["ar", "fa", "he"]), `RTL-Locales unerwartet: ${rtlCodes.join(", ")}.`);

const shippedCodes = sorted(
  (await readdir(localeRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
);
assert(
  JSON.stringify(shippedCodes) === JSON.stringify(sorted(configuredCodes)),
  `Ausgelieferte Locales stimmen nicht mit config/locales.json überein. Konfiguriert: ${sorted(configuredCodes).join(", ")}; ausgeliefert: ${shippedCodes.join(", ")}.`
);

const reference = await readMessages("de");
const referenceKeys = sorted(Object.keys(reference));
assert(referenceKeys.length === 165, `Die deutsche Referenz muss exakt 165 Nachrichten enthalten, gefunden: ${referenceKeys.length}.`);

for (const code of configuredCodes) {
  const messages = await readMessages(code);
  const keys = sorted(Object.keys(messages));
  assert(
    JSON.stringify(keys) === JSON.stringify(referenceKeys),
    `${code}: Nachrichten-Keys weichen von Deutsch ab.`
  );

  for (const key of referenceKeys) {
    const referenceEntry = reference[key];
    const entry = messages[key];
    assert(entry && typeof entry === "object", `${code}/${key}: Nachricht fehlt.`);
    assert(typeof entry.message === "string" && entry.message.trim(), `${code}/${key}: Nachricht ist leer.`);
    assert(
      JSON.stringify(placeholderTokens(entry.message)) === JSON.stringify(placeholderTokens(referenceEntry.message)),
      `${code}/${key}: Platzhalter in der Nachricht stimmen nicht mit Deutsch überein.`
    );
    assert(
      JSON.stringify(entry.placeholders ?? {}) === JSON.stringify(referenceEntry.placeholders ?? {}),
      `${code}/${key}: Platzhalterdefinitionen stimmen nicht mit Deutsch überein.`
    );
  }

  assert(messages.extensionName.message === "Sprachverstand", `${code}: Produktname Sprachverstand darf nicht übersetzt werden.`);
}


const productionPaths = [
  "src/options.ts",
  "src/popup.ts",
  "src/rules/catalog.ts",
  "static/options/options.html",
  "static/popup/popup.html",
  "static/legal/legal.html",
  "manifests/firefox.json",
  "manifests/chromium.json"
];
const productionSources = await Promise.all(
  productionPaths.map(async (relativePath) => ({
    relativePath,
    source: await readFile(path.join(projectRoot, relativePath), "utf8")
  }))
);
const productionText = productionSources.map(({ source }) => source).join("\n");

for (const { relativePath, source } of productionSources) {
  const referencedKeys = new Set();
  for (const match of source.matchAll(/\bt\(\s*["']([^"']+)["']/gu)) {
    referencedKeys.add(match[1]);
  }
  for (const match of source.matchAll(
    /\b(?:labelKey|descriptionKey):\s*["']([^"']+)["']/gu
  )) {
    referencedKeys.add(match[1]);
  }
  for (const match of source.matchAll(
    /data-i18n(?:-[a-z-]+)?=["']([^"']+)["']/gu
  )) {
    referencedKeys.add(match[1]);
  }

  for (const key of referencedKeys) {
    assert(
      referenceKeys.includes(key),
      `${relativePath}: unbekannter i18n-Key ${key}.`
    );
  }
}

const orphanedKeys = referenceKeys.filter((key) => !productionText.includes(key));
assert(
  orphanedKeys.length === 0,
  `Verwaiste i18n-Keys gefunden: ${orphanedKeys.join(", ")}.`
);

for (const [key, translations] of Object.entries(semanticContracts)) {
  assert(referenceKeys.includes(key), `Semantikvertrag verweist auf unbekannten Key: ${key}.`);
  assert(
    translations && typeof translations === "object" && !Array.isArray(translations),
    `${key}: Semantikvertrag muss ein Locale-Objekt sein.`
  );

  const contractCodes = sorted(Object.keys(translations));
  assert(
    JSON.stringify(contractCodes) === JSON.stringify(sorted(configuredCodes)),
    `${key}: Semantikvertrag muss exakt alle konfigurierten Locales enthalten.`
  );

  for (const code of configuredCodes) {
    const expected = translations[code];
    assert(typeof expected === "string" && expected.trim(), `${key}/${code}: erwartete Übersetzung fehlt.`);
    const messages = await readMessages(code);
    assert(
      messages[key]?.message === expected,
      `${code}/${key}: semantisch veraltete Übersetzung. Erwartet: ${JSON.stringify(expected)}; gefunden: ${JSON.stringify(messages[key]?.message)}.`
    );
  }
}

console.log(`i18n geprüft: ${configuredCodes.length} Locales mit jeweils ${referenceKeys.length} Nachrichten.`);
