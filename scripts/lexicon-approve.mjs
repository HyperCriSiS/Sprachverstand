import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

function normalize(value) {
  return value.normalize("NFC").toLocaleLowerCase("de-DE");
}

function finiteInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : 0;
}

function evidencePasses(entry) {
  const usageVariants = finiteInteger(entry?.usageVariants);
  const semanticConfirmations = finiteInteger(entry?.semanticConfirmations);
  const feminineFlexionConfirmed = entry?.feminineFlexionConfirmed === true;

  return (
    usageVariants >= 4 ||
    (usageVariants >= 3 && feminineFlexionConfirmed) ||
    (usageVariants >= 2 && semanticConfirmations >= 1)
  );
}

export function approveVerifiedEntries(verified, evidence) {
  const evidenceByBase = new Map();
  for (const raw of evidence?.entries ?? []) {
    if (!raw || typeof raw.base !== "string" || raw.base.length === 0) {
      continue;
    }
    const base = normalize(raw.base);
    const previous = evidenceByBase.get(base);
    const normalized = {
      usageVariants: finiteInteger(raw.usageVariants),
      semanticConfirmations: finiteInteger(raw.semanticConfirmations),
      feminineFlexionConfirmed: raw.feminineFlexionConfirmed === true
    };

    if (!previous) {
      evidenceByBase.set(base, normalized);
      continue;
    }

    evidenceByBase.set(base, {
      usageVariants: Math.max(previous.usageVariants, normalized.usageVariants),
      semanticConfirmations:
        previous.semanticConfirmations + normalized.semanticConfirmations,
      feminineFlexionConfirmed:
        previous.feminineFlexionConfirmed || normalized.feminineFlexionConfirmed
    });
  }

  const approved = [];
  const rejected = [];

  for (const entry of verified?.entries ?? []) {
    if (!entry || typeof entry.base !== "string") {
      continue;
    }
    const base = normalize(entry.base);
    const proof = evidenceByBase.get(base);

    if (proof && evidencePasses(proof)) {
      approved.push(entry);
    } else {
      rejected.push({
        base,
        usageVariants: proof?.usageVariants ?? 0,
        semanticConfirmations: proof?.semanticConfirmations ?? 0,
        feminineFlexionConfirmed: proof?.feminineFlexionConfirmed ?? false
      });
    }
  }

  approved.sort((left, right) =>
    left.base.localeCompare(right.base, "de-DE")
  );
  rejected.sort((left, right) =>
    left.base.localeCompare(right.base, "de-DE")
  );

  return {
    version: 1,
    stats: {
      verified: (verified?.entries ?? []).length,
      approved: approved.length,
      rejected: rejected.length
    },
    entries: approved,
    rejected
  };
}

async function main(argv) {
  const [verifiedPath, evidencePath, outputPath] = argv;
  if (!verifiedPath || !evidencePath) {
    throw new Error(
      "Flexionsgeprüfte Einträge und eine lokale Evidenzdatei angeben."
    );
  }

  const verified = JSON.parse(await readFile(resolve(verifiedPath), "utf8"));
  const evidence = JSON.parse(await readFile(resolve(evidencePath), "utf8"));
  const result = approveVerifiedEntries(verified, evidence);
  const serialized = `${JSON.stringify(result, null, 2)}\n`;

  if (outputPath) {
    await writeFile(resolve(outputPath), serialized, "utf8");
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
