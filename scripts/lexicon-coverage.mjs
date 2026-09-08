import { readFile, writeFile } from "node:fs/promises";
import { build } from "esbuild";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

function parseArguments(argv) {
  let input;
  let output;
  let failUnderUnique;
  let failUnderOccurrences;

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
    if (argument === "--fail-under-unique") {
      failUnderUnique = Number(argv[index + 1]);
      if (!Number.isFinite(failUnderUnique)) {
        throw new Error("--fail-under-unique erwartet eine Prozentzahl.");
      }
      index += 1;
      continue;
    }
    if (argument === "--fail-under-occurrences") {
      failUnderOccurrences = Number(argv[index + 1]);
      if (!Number.isFinite(failUnderOccurrences)) {
        throw new Error("--fail-under-occurrences erwartet eine Prozentzahl.");
      }
      index += 1;
      continue;
    }
    if (input) {
      throw new Error("Es darf nur eine Kandidatendatei angegeben werden.");
    }
    input = argument;
  }

  if (!input) {
    throw new Error("Eine mit lexicon:candidates erzeugte JSON-Datei angeben.");
  }

  return { input, output, failUnderUnique, failUnderOccurrences };
}

function roundPercent(value) {
  return Math.round(value * 100) / 100;
}

function percentage(part, total) {
  return total === 0 ? 100 : roundPercent((part / total) * 100);
}

function normalizeObserved(candidateSet) {
  if (Array.isArray(candidateSet.observedGenderedBases)) {
    return candidateSet.observedGenderedBases
      .filter(
        (entry) =>
          entry && typeof entry.base === "string" && Number.isFinite(entry.count)
      )
      .map((entry) => ({ base: entry.base, count: Math.max(1, entry.count) }));
  }

  if (Array.isArray(candidateSet.observedBases)) {
    return candidateSet.observedBases
      .filter((base) => typeof base === "string")
      .map((base) => ({ base, count: 1 }));
  }

  throw new Error("Die Kandidatendatei enthält keine beobachteten Genderformen.");
}

async function loadRuntimePluralMapper() {
  // Der Audit bündelt denselben TypeScript-Regelpfad wie der Browser-Build.
  // Dadurch funktionieren auch interne extensionlose Imports zuverlässig.
  const lexiconPath = fileURLToPath(
    new URL("../src/rules/person-lexicon.ts", import.meta.url)
  );
  const bundle = await build({
    entryPoints: [lexiconPath],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node24",
    write: false,
    logLevel: "silent"
  });
  const output = bundle.outputFiles[0]?.text;
  if (!output) {
    throw new Error("Der Personenwortschatz konnte nicht gebündelt werden.");
  }
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(output).toString("base64")}`;
  const { mapMappedPlural } = await import(moduleUrl);

  // Die kleine Zusatzliste liegt derzeit noch im Wrapper. Für den Audit wird sie
  // aus dem eigenen Quelltext gelesen, damit keine zweite manuelle Liste entsteht.
  const wrapperUrl = new URL(
    "../src/rules/mapped-plural-separators.ts",
    import.meta.url
  );
  const wrapperSource = await readFile(wrapperUrl, "utf8");
  const block = wrapperSource.match(
    /const additionalPluralForms = new Map<string, string>\(\[([\s\S]*?)\]\);/
  )?.[1];
  const additional = new Map();

  if (block) {
    for (const match of block.matchAll(/\["([^"]+)",\s*"([^"]+)"\]/g)) {
      const [, base, replacement] = match;
      if (base && replacement) {
        additional.set(base, replacement);
      }
    }
  }

  return (base) => additional.get(base) ?? mapMappedPlural(base);
}

export async function buildCoverageReport(candidateSet) {
  const mapMappedPlural = await loadRuntimePluralMapper();
  const observed = normalizeObserved(candidateSet);
  const known = [];
  const unknown = [];

  for (const entry of observed) {
    const replacement = mapMappedPlural(entry.base);
    if (replacement === undefined) {
      unknown.push(entry);
      continue;
    }
    known.push({ ...entry, replacement });
  }

  unknown.sort(
    (left, right) =>
      right.count - left.count || left.base.localeCompare(right.base, "de-DE")
  );
  known.sort(
    (left, right) =>
      right.count - left.count || left.base.localeCompare(right.base, "de-DE")
  );

  const totalOccurrences = observed.reduce((sum, entry) => sum + entry.count, 0);
  const knownOccurrences = known.reduce((sum, entry) => sum + entry.count, 0);

  return {
    version: 1,
    stats: {
      uniqueObserved: observed.length,
      knownUnique: known.length,
      unknownUnique: unknown.length,
      uniqueCoveragePercent: percentage(known.length, observed.length),
      observedOccurrences: totalOccurrences,
      knownOccurrences,
      unknownOccurrences: totalOccurrences - knownOccurrences,
      occurrenceCoveragePercent: percentage(knownOccurrences, totalOccurrences)
    },
    unknown,
    known
  };
}

function assertThreshold(name, actual, threshold) {
  if (threshold === undefined) {
    return;
  }
  if (threshold < 0 || threshold > 100) {
    throw new Error(`${name} muss zwischen 0 und 100 liegen.`);
  }
  if (actual < threshold) {
    throw new Error(`${name}: ${actual}% liegen unter dem Mindestwert ${threshold}%.`);
  }
}

async function main(argv) {
  const { input, output, failUnderUnique, failUnderOccurrences } =
    parseArguments(argv);
  const candidateSet = JSON.parse(await readFile(resolve(input), "utf8"));
  const report = await buildCoverageReport(candidateSet);

  assertThreshold(
    "Eindeutige Abdeckung",
    report.stats.uniqueCoveragePercent,
    failUnderUnique
  );
  assertThreshold(
    "Vorkommensgewichtete Abdeckung",
    report.stats.occurrenceCoveragePercent,
    failUnderOccurrences
  );

  const serialized = `${JSON.stringify(report, null, 2)}\n`;
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
