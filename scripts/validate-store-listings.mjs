import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const localeConfigPath = path.join(root, "config", "locales.json");
const listingsDirectory = path.join(root, "store", "listings");
const maximumSummaryLength = 132;
const minimumDescriptionLength = 500;
const requiredDescriptionMarkers = [
  "Sprachverstand",
  "Nutzer:innen",
  "Mitarbeiter*innen",
  "JSON",
  "aria-label"
];

function fail(message) {
  throw new Error(message);
}

function characterLength(value) {
  return [...value].length;
}

const locales = JSON.parse(await readFile(localeConfigPath, "utf8"));
const localeCodes = new Set(locales.map((locale) => locale.code));

for (const locale of locales) {
  const messagesPath = path.join(
    root,
    "static",
    "_locales",
    locale.code,
    "messages.json"
  );
  const messages = JSON.parse(await readFile(messagesPath, "utf8"));
  const summary = messages.extensionDescription?.message;

  if (typeof summary !== "string" || !summary.trim()) {
    fail(`${locale.code}: extensionDescription fehlt.`);
  }
  if (characterLength(summary) > maximumSummaryLength) {
    fail(
      `${locale.code}: extensionDescription überschreitet ${maximumSummaryLength} Zeichen (${characterLength(summary)}).`
    );
  }
}

const listingFiles = (await readdir(listingsDirectory))
  .filter((name) => name.endsWith(".json"))
  .sort();

for (const filename of listingFiles) {
  const localeCode = filename.slice(0, -".json".length);
  if (!localeCodes.has(localeCode)) {
    fail(`${filename}: Locale ist nicht in config/locales.json konfiguriert.`);
  }

  const listing = JSON.parse(
    await readFile(path.join(listingsDirectory, filename), "utf8")
  );
  if (listing.locale !== localeCode) {
    fail(`${filename}: locale muss ${localeCode} sein.`);
  }
  if (listing.name !== "Sprachverstand") {
    fail(`${filename}: Produktname muss unverändert Sprachverstand lauten.`);
  }
  if (typeof listing.description !== "string") {
    fail(`${filename}: description fehlt.`);
  }

  const description = listing.description.trim();
  if (characterLength(description) < minimumDescriptionLength) {
    fail(
      `${filename}: Vollbeschreibung ist mit ${characterLength(description)} Zeichen zu kurz.`
    );
  }
  if (/<\/?[a-z][^>]*>/iu.test(description)) {
    fail(`${filename}: HTML-Tags sind in der Storebeschreibung nicht erlaubt.`);
  }
  for (const marker of requiredDescriptionMarkers) {
    if (!description.includes(marker)) {
      fail(`${filename}: Pflichtmarker fehlt: ${marker}`);
    }
  }
}

console.log(
  `Store-Lokalisierung geprüft: 51/51 Kurzbeschreibungen, ${listingFiles.length}/51 Vollbeschreibungen.`
);
