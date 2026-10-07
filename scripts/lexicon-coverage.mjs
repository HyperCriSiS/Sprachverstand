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

function normalizeObservedSurfaces(candidateSet) {
  if (!Array.isArray(candidateSet.observedGenderedForms)) {
    return undefined;
  }

  return candidateSet.observedGenderedForms
    .filter(
      (entry) =>
        entry &&
        typeof entry.base === "string" &&
        typeof entry.surface === "string" &&
        Number.isFinite(entry.count)
    )
    .map((entry) => ({
      base: entry.base,
      surface: entry.surface,
      count: Math.max(1, entry.count)
    }));
}

async function buildRuntimeModule(contents, sourcefile) {
  const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
  const bundle = await build({
    stdin: {
      contents,
      resolveDir: repositoryRoot,
      sourcefile,
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
    throw new Error("Die produktive Sprachverstand-Runtime konnte nicht gebündelt werden.");
  }

  const moduleUrl = `data:text/javascript;base64,${Buffer.from(output).toString("base64")}`;
  return import(moduleUrl);
}

async function loadRuntimePluralMapper() {
  // Legacy-Modus für Quellen, die nur rekonstruierte Basen liefern. Dieser Pfad
  // bleibt bewusst unverändert, damit bestehende KldB-/DKZ-Audits stabil bleiben.
  const { additionalPersonPluralRule, mapKnownPlural, mapMappedPlural } =
    await buildRuntimeModule(
      `
        export { additionalPersonPluralRule } from "./src/rules/additional-person-forms.ts";
        export { mapKnownPlural } from "./src/rules/known-plural-separators.ts";
        export { mapMappedPlural } from "./src/rules/mapped-plural-separators.ts";
      `,
      "lexicon-coverage-entry.ts"
    );

  return (base) => {
    const mapped = mapKnownPlural(base) ?? mapMappedPlural(base);
    if (mapped !== undefined) {
      return mapped;
    }

    const markerForm = `${base}:innen`;
    const supplemental = additionalPersonPluralRule.apply(markerForm);
    return supplemental.replacements > 0 ? supplemental.text : undefined;
  };
}

async function loadRuntimeSurfaceTransformer() {
  const {
    transformText,
    defaultRules,
    defaultEnabledRuleGroupIds,
    disabledRuleIdsForGroups
  } = await buildRuntimeModule(
    `
      export { transformText } from "./src/core/transform-text.ts";
      export { defaultRules } from "./src/rules/index.ts";
      export {
        defaultEnabledRuleGroupIds,
        disabledRuleIdsForGroups
      } from "./src/rules/catalog.ts";
    `,
    "surface-coverage-entry.ts"
  );

  const disabledRuleIds = disabledRuleIdsForGroups(defaultEnabledRuleGroupIds);
  return (surface) =>
    transformText(surface, defaultRules, {
      profile: "aggressive",
      disabledRuleIds
    });
}

function sortByCountAndBase(entries) {
  entries.sort(
    (left, right) =>
      right.count - left.count || left.base.localeCompare(right.base, "de-DE")
  );
}

function buildSurfaceReport(observed, transformSurface) {
  const groups = new Map();
  let knownSurfaces = 0;
  let knownOccurrences = 0;

  for (const entry of observed) {
    const result = transformSurface(entry.surface);
    const covered = result.replacements > 0 && result.text !== entry.surface;
    const group = groups.get(entry.base) ?? {
      base: entry.base,
      count: 0,
      knownOccurrences: 0,
      unknownOccurrences: 0,
      replacements: new Set(),
      unknownSurfaces: []
    };

    group.count += entry.count;
    if (covered) {
      group.knownOccurrences += entry.count;
      group.replacements.add(result.text);
      knownSurfaces += 1;
      knownOccurrences += entry.count;
    } else {
      group.unknownOccurrences += entry.count;
      group.unknownSurfaces.push({ surface: entry.surface, count: entry.count });
    }
    groups.set(entry.base, group);
  }

  const known = [];
  const unknown = [];
  for (const group of groups.values()) {
    if (group.unknownOccurrences > 0) {
      unknown.push({
        base: group.base,
        count: group.unknownOccurrences,
        totalCount: group.count,
        knownOccurrences: group.knownOccurrences,
        surfaces: group.unknownSurfaces
      });
      continue;
    }

    const replacements = [...group.replacements].sort((left, right) =>
      left.localeCompare(right, "de-DE")
    );
    const entry = {
      base: group.base,
      count: group.count
    };
    if (replacements.length === 1) {
      entry.replacement = replacements[0];
    } else if (replacements.length > 1) {
      entry.replacements = replacements;
    }
    known.push(entry);
  }

  sortByCountAndBase(unknown);
  sortByCountAndBase(known);

  const totalOccurrences = observed.reduce((sum, entry) => sum + entry.count, 0);
  return {
    version: 2,
    coverageMode: "surface-runtime",
    stats: {
      uniqueObserved: groups.size,
      knownUnique: known.length,
      unknownUnique: unknown.length,
      uniqueCoveragePercent: percentage(known.length, groups.size),
      observedOccurrences: totalOccurrences,
      knownOccurrences,
      unknownOccurrences: totalOccurrences - knownOccurrences,
      occurrenceCoveragePercent: percentage(knownOccurrences, totalOccurrences),
      distinctSurfaces: observed.length,
      knownSurfaces,
      unknownSurfaces: observed.length - knownSurfaces,
      surfaceCoveragePercent: percentage(knownSurfaces, observed.length)
    },
    unknown,
    known
  };
}

async function buildLegacyBaseReport(candidateSet) {
  const mapPlural = await loadRuntimePluralMapper();
  const observed = normalizeObserved(candidateSet);
  const known = [];
  const unknown = [];

  for (const entry of observed) {
    const replacement = mapPlural(entry.base);
    if (replacement === undefined) {
      unknown.push(entry);
      continue;
    }
    known.push({ ...entry, replacement });
  }

  sortByCountAndBase(unknown);
  sortByCountAndBase(known);

  const totalOccurrences = observed.reduce((sum, entry) => sum + entry.count, 0);
  const knownOccurrences = known.reduce((sum, entry) => sum + entry.count, 0);

  return {
    version: 1,
    coverageMode: "base-plural-legacy",
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

export async function buildCoverageReport(candidateSet) {
  const observedSurfaces = normalizeObservedSurfaces(candidateSet);
  if (observedSurfaces !== undefined) {
    const transformSurface = await loadRuntimeSurfaceTransformer();
    return buildSurfaceReport(observedSurfaces, transformSurface);
  }

  return buildLegacyBaseReport(candidateSet);
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
