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

export function renderGeneratedModule(entries) {
  const object = Object.fromEntries(entries);
  const serialized = JSON.stringify(object, null, 2)
    .replaceAll('"plural"', "plural")
    .replaceAll('"singular"', "singular")
    .replaceAll('"feminineSingular"', "feminineSingular")
    .replaceAll('"obliqueSingular"', "obliqueSingular")
    .replaceAll('"genitiveSingular"', "genitiveSingular");

  return `export interface GeneratedPersonForms {\n  readonly plural: string;\n  readonly singular?: string;\n  readonly feminineSingular?: string;\n  readonly obliqueSingular?: string;\n  readonly genitiveSingular?: string;\n}\n\n// Automatisch erzeugte, normalisierte Produktdaten.\nconst generatedPersonForms: Readonly<Record<string, GeneratedPersonForms>> =\n  Object.freeze(${serialized});\n\nexport const generatedPersonFormCount = Object.keys(generatedPersonForms).length;\n\nexport function getGeneratedPersonForms(\n  normalizedBase: string\n): GeneratedPersonForms | undefined {\n  return generatedPersonForms[normalizedBase];\n}\n`;
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
