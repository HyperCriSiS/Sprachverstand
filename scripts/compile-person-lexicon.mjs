import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const locale = "de-DE";
const tokenPattern = /^[\p{L}\p{M}’'-]+$/u;
const optionalFields = [
  "singular",
  "feminineSingular",
  "obliqueSingular",
  "genitiveSingular"
];

function normalize(value) {
  return value.normalize("NFC").toLocaleLowerCase(locale);
}

function assertToken(value, label) {
  if (typeof value !== "string" || !value || !tokenPattern.test(value)) {
    throw new Error(`${label} ist keine gültige Wortform.`);
  }
  const normalized = normalize(value);
  if (normalized !== value) {
    throw new Error(`${label} muss bereits kleingeschrieben und NFC-normalisiert sein.`);
  }
  return normalized;
}

export function normalizeApprovedEntries(payload) {
  const rawEntries = Array.isArray(payload) ? payload : payload?.entries;
  if (!Array.isArray(rawEntries)) {
    throw new Error("Die Eingabe muss ein Array oder ein Objekt mit entries enthalten.");
  }

  const entries = [];
  const seen = new Set();

  for (const raw of rawEntries) {
    if (!raw || typeof raw !== "object") {
      throw new Error("Jeder Lexikoneintrag muss ein Objekt sein.");
    }
    const base = assertToken(raw.base, "base");
    const plural = assertToken(raw.plural, `plural für ${base}`);
    if (seen.has(base)) {
      throw new Error(`Doppelter Lexikoneintrag: ${base}`);
    }
    seen.add(base);

    const forms = { plural };
    for (const field of optionalFields) {
      if (raw[field] !== undefined) {
        forms[field] = assertToken(raw[field], `${field} für ${base}`);
      }
    }
    entries.push([base, forms]);
  }

  entries.sort(([left], [right]) => left.localeCompare(right, locale));
  return entries;
}

function classifyEntry(base, forms) {
  const {
    plural,
    singular,
    feminineSingular,
    obliqueSingular,
    genitiveSingular
  } = forms;
  const regularBase =
    singular === base &&
    feminineSingular === `${base}in` &&
    obliqueSingular === base &&
    genitiveSingular === `${base}s`;

  if (regularBase) {
    if (plural === base) return "unchanged";
    if (plural === `${base}e`) return "pluralE";
    if (plural === `${base}en`) return "pluralEn";
    if (plural === `${base}s`) return "pluralS";
  }

  if (
    singular === base &&
    feminineSingular === `${base}in` &&
    plural === `${base}en` &&
    obliqueSingular === `${base}en` &&
    genitiveSingular === `${base}en`
  ) {
    return "weakEn";
  }

  return "special";
}

function serializeSet(values) {
  return JSON.stringify(values, null, 2);
}

function serializeSpecials(entries) {
  const object = Object.fromEntries(entries);
  return JSON.stringify(object, null, 2)
    .replaceAll('"plural"', "plural")
    .replaceAll('"singular"', "singular")
    .replaceAll('"feminineSingular"', "feminineSingular")
    .replaceAll('"obliqueSingular"', "obliqueSingular")
    .replaceAll('"genitiveSingular"', "genitiveSingular");
}

export function renderGeneratedModule(entries) {
  const classes = {
    unchanged: [],
    weakEn: [],
    pluralE: [],
    pluralEn: [],
    pluralS: [],
    special: []
  };

  for (const [base, forms] of entries) {
    const kind = classifyEntry(base, forms);
    if (kind === "special") {
      classes.special.push([base, forms]);
    } else {
      classes[kind].push(base);
    }
  }

  const specials = serializeSpecials(classes.special);
  return `export interface GeneratedPersonForms {\n  readonly plural: string;\n  readonly singular?: string;\n  readonly feminineSingular?: string;\n  readonly obliqueSingular?: string;\n  readonly genitiveSingular?: string;\n}\n\n// Automatisch erzeugte, normalisierte Produktdaten. Häufige Flexionsmuster\n// werden kompakt als Mengen gespeichert; nur Sonderfälle tragen Vollformen.\nconst unchangedForms: ReadonlySet<string> = new Set(${serializeSet(classes.unchanged)});\nconst weakEnForms: ReadonlySet<string> = new Set(${serializeSet(classes.weakEn)});\nconst pluralEForms: ReadonlySet<string> = new Set(${serializeSet(classes.pluralE)});\nconst pluralEnForms: ReadonlySet<string> = new Set(${serializeSet(classes.pluralEn)});\nconst pluralSForms: ReadonlySet<string> = new Set(${serializeSet(classes.pluralS)});\nconst specialForms: Readonly<Record<string, GeneratedPersonForms>> =\n  Object.freeze(${specials});\n\nexport const generatedPersonFormCount =\n  unchangedForms.size +\n  weakEnForms.size +\n  pluralEForms.size +\n  pluralEnForms.size +\n  pluralSForms.size +\n  Object.keys(specialForms).length;\n\nfunction regularForms(\n  base: string,\n  plural: string,\n  obliqueSingular = base,\n  genitiveSingular = \`\${base}s\`\n): GeneratedPersonForms {\n  return {\n    plural,\n    singular: base,\n    feminineSingular: \`\${base}in\`,\n    obliqueSingular,\n    genitiveSingular\n  };\n}\n\nexport function getGeneratedPersonForms(\n  normalizedBase: string\n): GeneratedPersonForms | undefined {\n  if (unchangedForms.has(normalizedBase)) {\n    return regularForms(normalizedBase, normalizedBase);\n  }\n  if (weakEnForms.has(normalizedBase)) {\n    const inflected = \`\${normalizedBase}en\`;\n    return regularForms(normalizedBase, inflected, inflected, inflected);\n  }\n  if (pluralEForms.has(normalizedBase)) {\n    return regularForms(normalizedBase, \`\${normalizedBase}e\`);\n  }\n  if (pluralEnForms.has(normalizedBase)) {\n    return regularForms(normalizedBase, \`\${normalizedBase}en\`);\n  }\n  if (pluralSForms.has(normalizedBase)) {\n    return regularForms(normalizedBase, \`\${normalizedBase}s\`);\n  }\n  return specialForms[normalizedBase];\n}\n`;
}

async function main(argv) {
  const [input, output = "src/rules/generated-person-lexicon.ts"] = argv;
  if (!input) {
    throw new Error("Eine geprüfte JSON-Kandidatenliste angeben.");
  }
  const payload = JSON.parse(await readFile(resolve(input), "utf8"));
  const entries = normalizeApprovedEntries(payload);
  await writeFile(resolve(output), renderGeneratedModule(entries), "utf8");
  process.stdout.write(`${entries.length} geprüfte Lexikoneinträge erzeugt.\n`);
}

const isMain =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
