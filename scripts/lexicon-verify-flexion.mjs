import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import { build } from "esbuild";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const locale = "de-DE";

function normalize(value) {
  return value.normalize("NFC").toLocaleLowerCase(locale);
}

function parseArguments(argv) {
  const inputs = [];
  let candidates;
  let output;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--output") {
      output = argv[index + 1];
      if (!output) {
        throw new Error("Nach --output fehlt der Ausgabepfad.");
      }
      index += 1;
      continue;
    }
    if (!candidates) {
      candidates = argument;
    } else {
      inputs.push(argument);
    }
  }

  if (!candidates || inputs.length === 0) {
    throw new Error(
      "Kandidatendatei und mindestens eine lokale Flexionsdatei angeben."
    );
  }

  return { candidates, inputs, output };
}

async function collectJsonFiles(input) {
  const absolute = resolve(input);
  const metadata = await stat(absolute);
  if (metadata.isFile()) {
    return extname(absolute).toLowerCase() === ".json" ? [absolute] : [];
  }
  if (!metadata.isDirectory()) {
    return [];
  }

  const files = [];
  for (const entry of await readdir(absolute, { withFileTypes: true })) {
    const child = resolve(absolute, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectJsonFiles(child)));
    } else if (entry.isFile() && extname(entry.name).toLowerCase() === ".json") {
      files.push(child);
    }
  }
  return files;
}

async function loadRuntimePluralMapper() {
  const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
  const bundle = await build({
    stdin: {
      contents: `
        export { mapKnownPlural } from "./src/rules/known-plural-separators.ts";
        export { mapMappedPlural } from "./src/rules/mapped-plural-separators.ts";
      `,
      resolveDir: repositoryRoot,
      sourcefile: "lexicon-verify-entry.ts",
      loader: "ts"
    },
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node24",
    write: false,
    logLevel: "silent"
  });
  const output = bundle.outputFiles[0]?.text;
  if (!output) {
    throw new Error("Die produktiven Pluralregeln konnten nicht gebündelt werden.");
  }
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(output).toString("base64")}`;
  const { mapKnownPlural, mapMappedPlural } = await import(moduleUrl);
  return (base) => mapKnownPlural(base) ?? mapMappedPlural(base);
}

function strongCandidate(pair) {
  return pair?.confidence === "strong" || Number(pair?.strongConfirmations) > 0;
}

function normalizeFlexionRecord(record) {
  if (record?.type !== "noun" || record?.gender !== "m") {
    return undefined;
  }
  const nominative = record.cases?.nominative;
  const accusative = record.cases?.accusative;
  const dative = record.cases?.dative;
  const genitive = record.cases?.genitive;
  const fields = [
    record.lemma,
    nominative?.singular,
    nominative?.plural,
    accusative?.singular,
    dative?.singular,
    genitive?.singular
  ];
  if (!fields.every((value) => typeof value === "string" && value.length > 0)) {
    return undefined;
  }

  const [lemma, singular, plural, accusativeSingular, dativeSingular, genitiveSingular] =
    fields.map(normalize);
  return {
    lemma,
    singular,
    plural,
    accusativeSingular,
    dativeSingular,
    genitiveSingular
  };
}

function signature(record) {
  return [
    record.singular,
    record.plural,
    record.accusativeSingular,
    record.dativeSingular,
    record.genitiveSingular
  ].join("\u0000");
}

export async function verifyCandidates(candidateSet, flexionFiles) {
  const mapPlural = await loadRuntimePluralMapper();
  const pairs = (candidateSet.pairs ?? []).filter(strongCandidate);
  const wantedMasculines = new Set(
    pairs
      .map((pair) => pair?.masculine)
      .filter((value) => typeof value === "string")
      .map(normalize)
  );
  const flexions = new Map();

  for (const file of flexionFiles) {
    const payload = JSON.parse(await readFile(file, "utf8"));
    if (!Array.isArray(payload)) {
      continue;
    }
    for (const raw of payload) {
      const record = normalizeFlexionRecord(raw);
      if (!record || !wantedMasculines.has(record.lemma)) {
        continue;
      }
      const variants = flexions.get(record.lemma) ?? new Map();
      variants.set(signature(record), record);
      flexions.set(record.lemma, variants);
    }
  }

  const entries = [];
  let alreadyCovered = 0;
  let missingFlexion = 0;
  let ambiguousFlexion = 0;
  let incompatibleFlexion = 0;

  for (const pair of pairs) {
    const base = normalize(pair.base);
    const masculine = normalize(pair.masculine);
    const feminine = normalize(pair.feminine);

    if (mapPlural(base) !== undefined) {
      alreadyCovered += 1;
      continue;
    }

    const variants = flexions.get(masculine);
    if (!variants || variants.size === 0) {
      missingFlexion += 1;
      continue;
    }
    if (variants.size !== 1) {
      ambiguousFlexion += 1;
      continue;
    }

    const record = [...variants.values()][0];
    if (
      !record ||
      record.singular !== masculine ||
      record.accusativeSingular !== record.dativeSingular
    ) {
      incompatibleFlexion += 1;
      continue;
    }

    entries.push({
      base,
      plural: record.plural,
      singular: record.singular,
      feminineSingular: feminine,
      obliqueSingular: record.accusativeSingular,
      genitiveSingular: record.genitiveSingular
    });
  }

  entries.sort((left, right) => left.base.localeCompare(right.base, locale));
  return {
    version: 1,
    stats: {
      candidatePairs: (candidateSet.pairs ?? []).length,
      strongCandidatePairs: pairs.length,
      verified: entries.length,
      alreadyCovered,
      missingFlexion,
      ambiguousFlexion,
      incompatibleFlexion
    },
    entries
  };
}

async function main(argv) {
  const { candidates, inputs, output } = parseArguments(argv);
  const candidateSet = JSON.parse(await readFile(resolve(candidates), "utf8"));
  const flexionFiles = (
    await Promise.all(inputs.map((input) => collectJsonFiles(input)))
  )
    .flat()
    .sort((left, right) => left.localeCompare(right));

  if (flexionFiles.length === 0) {
    throw new Error("Keine Flexions-JSON-Dateien gefunden.");
  }

  const result = await verifyCandidates(candidateSet, flexionFiles);
  const serialized = `${JSON.stringify(result, null, 2)}\n`;
  if (output) {
    await writeFile(resolve(output), serialized, "utf8");
  } else {
    process.stdout.write(serialized);
  }
}

const isMain =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
