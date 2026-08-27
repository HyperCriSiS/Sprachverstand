import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const checkOnly = process.argv.includes("--check");
const outputDirectory = path.join(root, "store", "generated");

const amoLocaleMap = new Map([
  ["de", "de"],
  ["en", "en-US"],
  ["es", "es-ES"],
  ["fr", "fr"],
  ["it", "it"],
  ["nl", "nl"],
  ["pl", "pl"],
  ["pt_BR", "pt-BR"],
  ["pt_PT", "pt-PT"],
  ["sv", "sv-SE"],
  ["no", "nb-NO"],
  ["fi", "fi"],
  ["cs", "cs"],
  ["sk", "sk"],
  ["hr", "hr"],
  ["sl", "sl"],
  ["sr", "sr"],
  ["hu", "hu"],
  ["ro", "ro"],
  ["ru", "ru"],
  ["uk", "uk"],
  ["el", "el"],
  ["tr", "tr"],
  ["he", "he"],
  ["ja", "ja"],
  ["ko", "ko"],
  ["vi", "vi"],
  ["zh_CN", "zh-CN"],
  ["zh_TW", "zh-TW"]
]);

function fail(message) {
  throw new Error(message);
}

function csvEscape(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function createCsv(rows) {
  const header = ["locale", "name", "short_description", "description"];
  const lines = [header.map(csvEscape).join(",")];
  for (const row of rows) {
    lines.push(
      [row.locale, row.name, row.summary, row.description]
        .map(csvEscape)
        .join(",")
    );
  }
  return `${lines.join("\n")}\n`;
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

const locales = await readJson(path.join(root, "config", "locales.json"));
if (!Array.isArray(locales) || locales.length !== 51) {
  fail("Für Store-Exporte werden exakt 51 konfigurierte Locales erwartet.");
}

const rows = [];
for (const locale of locales) {
  const code = locale.code;
  const messages = await readJson(
    path.join(root, "static", "_locales", code, "messages.json")
  );
  const listing = await readJson(
    path.join(root, "store", "listings", `${code}.json`)
  );
  const summary = messages.extensionDescription?.message;

  if (typeof summary !== "string" || !summary.trim()) {
    fail(`${code}: Kurzbeschreibung fehlt.`);
  }
  if (listing.locale !== code || listing.name !== "Sprachverstand") {
    fail(`${code}: Store-Listing passt nicht zur Locale-Matrix.`);
  }
  if (typeof listing.description !== "string" || !listing.description.trim()) {
    fail(`${code}: Vollbeschreibung fehlt.`);
  }

  rows.push({
    locale: code,
    name: "Sprachverstand",
    summary: summary.trim(),
    description: listing.description.trim()
  });
}

if (amoLocaleMap.size !== 29) {
  fail("Die AMO-Locale-Zuordnung muss exakt 29 unterstützte Listing-Locales enthalten.");
}

const configuredCodes = new Set(rows.map((row) => row.locale));
const amoTargets = new Set();
const amoSummary = {};
const amoDescription = {};

for (const [sourceLocale, amoLocale] of amoLocaleMap) {
  if (!configuredCodes.has(sourceLocale)) {
    fail(`AMO-Quell-Locale fehlt in der Konfiguration: ${sourceLocale}`);
  }
  if (amoTargets.has(amoLocale)) {
    fail(`AMO-Ziel-Locale ist doppelt belegt: ${amoLocale}`);
  }
  amoTargets.add(amoLocale);

  const row = rows.find((entry) => entry.locale === sourceLocale);
  amoSummary[amoLocale] = row.summary;
  amoDescription[amoLocale] = row.description;
}

const amoMetadata = {
  summary: amoSummary,
  description: amoDescription,
  categories: ["language-support"],
  version: {
    license: "AGPL-3.0-only"
  }
};

const universalCsv = createCsv(rows);
const outputs = new Map([
  ["amo-metadata.json", `${JSON.stringify(amoMetadata, null, 2)}\n`],
  ["chrome-dashboard.csv", universalCsv],
  ["edge-worklist.csv", universalCsv],
  ["opera-worklist.csv", universalCsv]
]);

if (!checkOnly) {
  await mkdir(outputDirectory, { recursive: true });
  for (const [filename, content] of outputs) {
    await writeFile(path.join(outputDirectory, filename), content, "utf8");
  }
}

console.log(
  `Store-Ausgaben geprüft: 51 gemeinsame Listings, ${amoLocaleMap.size} AMO-Listing-Locales${
    checkOnly ? "." : "; Dateien unter store/generated erzeugt."
  }`
);
