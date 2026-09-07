import { gunzipSync } from "node:zlib";
import { readFileSync, writeFileSync, rmSync } from "node:fs";

const localeTranslations = JSON.parse(
  gunzipSync(Buffer.from([readFileSync("scripts/.tmp-i18n-0.txt", "utf8").slice(0, 9829), readFileSync("scripts/.tmp-i18n-rest-0.txt", "utf8"), readFileSync("scripts/.tmp-i18n-rest-1.txt", "utf8"), readFileSync("scripts/.tmp-i18n-rest-2.txt", "utf8")].join(""), "base64")).toString("utf8")
);

const translationKeys = ["includedDomains", "includedDomainsLabel", "switchToExcludedDomains", "switchToIncludedDomains", "popupDomainActionTitle", "popupDomainActionDescription", "currentWebsiteAlreadyInDomainList", "includeCurrentWebsite", "excludeCurrentWebsite", "domainListDescription", "syncDomainListTitle", "syncDomainListDescription", "invalidDomainEntry", "duplicateDomainEntry"];
const orphanedKeys = [
  "reset",
  "resetDone",
  "correctionsOnPage",
  "settingsAria",
  "maxExcludedDomains",
  "excludedDomainsDescription",
  "syncExcludedDomains",
  "syncExcludedDomainsDescription",
  "invalidExcludedDomain",
  "duplicateExcludedDomain"
];

const locales = JSON.parse(readFileSync("config/locales.json", "utf8"));
for (const { code } of locales) {
  const translations = localeTranslations[code];
  if (!Array.isArray(translations) || translations.length !== translationKeys.length) {
    throw new Error(`${code}: unvollständiger temporärer Übersetzungssatz.`);
  }

  const file = `static/_locales/${code}/messages.json`;
  const source = readFileSync(file, "utf8");
  const trailingNewline = source.endsWith("\n") ? "\n" : "";
  const messages = JSON.parse(source);
  const invalidPlaceholder = messages.invalidExcludedDomain?.placeholders ?? {};
  const duplicatePlaceholder = messages.duplicateExcludedDomain?.placeholders ?? {};

  for (const key of orphanedKeys) {
    delete messages[key];
  }

  for (const [index, key] of translationKeys.entries()) {
    const entry = { message: translations[index] };
    if (key === "invalidDomainEntry") entry.placeholders = invalidPlaceholder;
    if (key === "duplicateDomainEntry") entry.placeholders = duplicatePlaceholder;
    messages[key] = entry;
  }

  writeFileSync(file, JSON.stringify(messages) + trailingNewline);
}

function replaceExact(file, before, after) {
  const source = readFileSync(file, "utf8");
  if (!source.includes(before)) {
    throw new Error(`${file}: erwarteter Ausgangstext fehlt.`);
  }
  writeFileSync(file, source.replace(before, after));
}

replaceExact(
  "static/options/options.html",
  '<script defer="" src="domain-ui.js"></script>\n',
  ""
);
replaceExact(
  "static/options/options.html",
  '<span><strong id="popup-domain-action-title"></strong><small id="popup-domain-action-description"></small></span>',
  '<span><strong data-i18n="popupDomainActionTitle" id="popup-domain-action-title">Aktuelle Website zur Domainliste hinzufügen</strong><small data-i18n="popupDomainActionDescription" id="popup-domain-action-description">Zeigt im Popup eine Schaltfläche, um die aktuelle Website abhängig vom Arbeitsmodus zur Domainliste hinzuzufügen.</small></span>'
);
replaceExact(
  "static/options/options.html",
  '<small id="domain-list-description"></small>',
  '<small data-i18n="domainListDescription" id="domain-list-description">Eine Domain pro Zeile. Unterdomains werden mit erfasst; Eingaben werden auf den Hostnamen normalisiert. Lokal gibt es keine feste Anzahlbegrenzung. Bei aktivierter Browser-Synchronisierung gilt zusätzlich deren sicheres Größenlimit.</small>'
);
replaceExact(
  "static/options/options.html",
  '<strong id="sync-domain-list-title"></strong><small id="sync-domain-list-description"></small>',
  '<strong data-i18n="syncDomainListTitle" id="sync-domain-list-title">Domainliste</strong><small data-i18n="syncDomainListDescription" id="sync-domain-list-description">Synchronisiert den Arbeitsmodus und die zugehörige Domainliste. Kann persönliche oder interne Domainnamen enthalten.</small>'
);

replaceExact(
  "src/options.ts",
  'const domainListDescription =\n  requiredElement<HTMLElement>("#domain-list-description");\n',
  ""
);
replaceExact(
  "src/options.ts",
  `  domainListDescription.textContent = t(
    "domainListDescription",
    undefined,
    "Eine Domain pro Zeile. Unterdomains werden mit erfasst; Eingaben werden auf den Hostnamen normalisiert. Lokal gibt es keine feste Anzahlbegrenzung. Bei aktivierter Browser-Synchronisierung gilt zusätzlich deren sicheres Größenlimit."
  );
`,
  ""
);
let optionsSource = readFileSync("src/options.ts", "utf8");
optionsSource = optionsSource
  .replaceAll('"invalidExcludedDomain"', '"invalidDomainEntry"')
  .replaceAll('"duplicateExcludedDomain"', '"duplicateDomainEntry"');
writeFileSync("src/options.ts", optionsSource);

rmSync("static/options/domain-ui.js");

replaceExact(
  "tests/i18n.test.ts",
  "expect(referenceKeys).toHaveLength(161);",
  "expect(referenceKeys).toHaveLength(165);"
);

const dynamicTest = `
  it("prüft dynamische i18n-Schlüssel generisch gegen den Katalog", async () => {
    const de = await readMessages("de");
    const sources = await Promise.all(
      ["src/options.ts", "src/popup.ts", "src/rules/catalog.ts"].map(async (path) => ({
        path,
        source: await readFile(path, "utf8")
      }))
    );

    for (const { path, source } of sources) {
      const keys = new Set<string>();
      for (const match of source.matchAll(/\\bt\\(\\s*["']([^"']+)["']/gu)) {
        keys.add(match[1]);
      }
      for (const match of source.matchAll(
        /\\b(?:labelKey|descriptionKey):\\s*["']([^"']+)["']/gu
      )) {
        keys.add(match[1]);
      }
      for (const key of keys) {
        expect(de[key]?.message, \`${path}: missing German key ${key}\`).toBeTruthy();
      }
    }
  });

  it("lässt keine verwaisten UI-Schlüssel im Katalog zurück", async () => {
    const de = await readMessages("de");
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
    const productionText = (
      await Promise.all(productionPaths.map((path) => readFile(path, "utf8")))
    ).join("\\n");

    const orphaned = Object.keys(de)
      .filter((key) => !productionText.includes(key))
      .sort();

    expect(orphaned).toEqual([]);
  });

`;
replaceExact(
  "tests/i18n.test.ts",
  '  it("localizes dynamic standard text directly by message key", async () => {',
  dynamicTest + '  it("localizes dynamic standard text directly by message key", async () => {'
);

replaceExact(
  "scripts/validate-locales.mjs",
  "referenceKeys.length === 161",
  "referenceKeys.length === 165"
);
replaceExact(
  "scripts/validate-locales.mjs",
  "exakt 161 Nachrichten",
  "exakt 165 Nachrichten"
);

const validatorBlock = `
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
const productionText = productionSources.map(({ source }) => source).join("\\n");

for (const { relativePath, source } of productionSources) {
  const referencedKeys = new Set();
  for (const match of source.matchAll(/\\bt\\(\\s*["']([^"']+)["']/gu)) {
    referencedKeys.add(match[1]);
  }
  for (const match of source.matchAll(
    /\\b(?:labelKey|descriptionKey):\\s*["']([^"']+)["']/gu
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
      \`${relativePath}: unbekannter i18n-Key ${key}.\`
    );
  }
}

const orphanedKeys = referenceKeys.filter((key) => !productionText.includes(key));
assert(
  orphanedKeys.length === 0,
  \`Verwaiste i18n-Keys gefunden: ${orphanedKeys.join(", ")}.\`
);

`;
replaceExact(
  "scripts/validate-locales.mjs",
  "for (const [key, translations] of Object.entries(semanticContracts)) {",
  validatorBlock + "for (const [key, translations] of Object.entries(semanticContracts)) {"
);

console.log(`Temporärer i18n-Fix vorbereitet: ${locales.length} Locales, ${translationKeys.length} neue UI-Keys.`);
