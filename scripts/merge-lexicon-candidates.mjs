import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

function pairKey(pair) {
  return `${pair.base}\u0000${pair.masculine}\u0000${pair.feminine}`;
}

export function mergeCandidateSets(candidateSets) {
  const pairs = new Map();
  const observed = new Map();

  for (const candidateSet of candidateSets) {
    const seenPairs = new Set();
    for (const pair of candidateSet.pairs ?? []) {
      const key = pairKey(pair);
      if (seenPairs.has(key)) {
        continue;
      }
      seenPairs.add(key);
      const previous = pairs.get(key);
      pairs.set(key, {
        base: pair.base,
        masculine: pair.masculine,
        feminine: pair.feminine,
        confirmations: (previous?.confirmations ?? 0) + 1,
        strongConfirmations:
          (previous?.strongConfirmations ?? 0) +
          (pair.confidence === "strong" ? 1 : 0)
      });
    }

    for (const entry of candidateSet.observedGenderedBases ?? []) {
      const previous = observed.get(entry.base) ?? { count: 0, confirmations: 0 };
      observed.set(entry.base, {
        count: previous.count + Math.max(1, Number(entry.count) || 1),
        confirmations: previous.confirmations + 1
      });
    }
  }

  const mergedPairs = [...pairs.values()].sort(
    (left, right) =>
      right.confirmations - left.confirmations ||
      right.strongConfirmations - left.strongConfirmations ||
      left.base.localeCompare(right.base, "de-DE")
  );
  const observedGenderedBases = [...observed.entries()]
    .map(([base, value]) => ({ base, ...value }))
    .sort(
      (left, right) =>
        right.confirmations - left.confirmations ||
        right.count - left.count ||
        left.base.localeCompare(right.base, "de-DE")
    );

  return {
    version: 1,
    stats: {
      inputSets: candidateSets.length,
      pairs: mergedPairs.length,
      multiplyConfirmedPairs: mergedPairs.filter((pair) => pair.confirmations >= 2)
        .length,
      observedBases: observedGenderedBases.length,
      multiplyObservedBases: observedGenderedBases.filter(
        (entry) => entry.confirmations >= 2
      ).length
    },
    pairs: mergedPairs,
    observedGenderedBases
  };
}

async function main(argv) {
  const inputs = [];
  let output;
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--output") {
      output = argv[index + 1];
      if (!output) {
        throw new Error("Nach --output fehlt der Ausgabepfad.");
      }
      index += 1;
    } else {
      inputs.push(argv[index]);
    }
  }
  if (inputs.length < 2) {
    throw new Error("Mindestens zwei Kandidatendateien angeben.");
  }

  const candidateSets = await Promise.all(
    inputs.map(async (input) =>
      JSON.parse(await readFile(resolve(input), "utf8"))
    )
  );
  const result = mergeCandidateSets(candidateSets);
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
