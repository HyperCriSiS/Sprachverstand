import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const locale = "de-DE";
const wordPattern = /[\p{L}][\p{L}\p{M}’'-]*/gu;
const separatedGenderPattern =
  /(?<![\p{L}\p{M}])([\p{L}][\p{L}\p{M}’'-]{1,80})(?::|\*|_|·|•|\/-?|\/)(?:in|innen)(?![\p{L}\p{M}])/gu;
const binnenIPattern =
  /(?<![\p{L}\p{M}])([\p{L}][\p{L}\p{M}’'-]{1,80})Innen(?![\p{L}\p{M}])/gu;

function normalizeWord(value) {
  return value.normalize("NFC").toLocaleLowerCase(locale);
}

export function extractWords(text) {
  const words = new Set();
  for (const match of text.matchAll(wordPattern)) {
    const word = match[0];
    if (word.length >= 2) {
      words.add(normalizeWord(word));
    }
  }
  return words;
}

function deumlautVariants(value) {
  const replacements = new Map([
    ["ä", "a"],
    ["ö", "o"],
    ["ü", "u"]
  ]);
  let variants = new Set([value]);

  for (let index = 0; index < value.length; index += 1) {
    const replacement = replacements.get(value[index]);
    if (!replacement) {
      continue;
    }

    const current = [...variants];
    for (const variant of current) {
      variants.add(
        variant.slice(0, index) + replacement + variant.slice(index + 1)
      );
    }
  }

  variants.delete(value);
  return variants;
}

function masculineCandidates(stem) {
  const candidates = new Set([stem, `${stem}e`]);
  for (const variant of deumlautVariants(stem)) {
    candidates.add(variant);
    candidates.add(`${variant}e`);
  }
  return candidates;
}

function findMasculine(wordSet, stem) {
  const matches = [...masculineCandidates(stem)].filter((candidate) =>
    wordSet.has(candidate)
  );

  if (matches.length === 0) {
    return undefined;
  }

  // Die unveränderte Grundform ist bei produktiven -in-Bildungen am stärksten.
  if (matches.includes(stem)) {
    return stem;
  }

  // Bei schwachen Maskulina ist die Grundform häufig Stamm + e.
  if (matches.includes(`${stem}e`)) {
    return `${stem}e`;
  }

  // Umlaut-Rückbildungen werden nur übernommen, wenn genau eine übrig bleibt.
  return matches.length === 1 ? matches[0] : undefined;
}

export function extractPersonPairs(texts) {
  const wordSet = new Set();
  for (const text of texts) {
    for (const word of extractWords(text)) {
      wordSet.add(word);
    }
  }

  const pairs = new Map();

  for (const word of wordSet) {
    let stem;
    let feminine;

    if (word.endsWith("innen") && word.length > 7) {
      stem = word.slice(0, -5);
      feminine = `${stem}in`;
    } else if (word.endsWith("in") && word.length > 4) {
      stem = word.slice(0, -2);
      feminine = word;
    } else {
      continue;
    }

    if (stem.length < 3) {
      continue;
    }

    const masculine = findMasculine(wordSet, stem);
    if (!masculine || masculine === feminine) {
      continue;
    }

    const key = `${stem}\u0000${masculine}\u0000${feminine}`;
    pairs.set(key, { base: stem, masculine, feminine });
  }

  return [...pairs.values()].sort(
    (left, right) =>
      left.base.localeCompare(right.base, locale) ||
      left.masculine.localeCompare(right.masculine, locale)
  );
}

export function extractObservedGenderedBases(texts) {
  const bases = new Set();

  for (const text of texts) {
    for (const pattern of [separatedGenderPattern, binnenIPattern]) {
      pattern.lastIndex = 0;
      for (const match of text.matchAll(pattern)) {
        const base = match[1];
        if (base) {
          bases.add(normalizeWord(base));
        }
      }
    }
  }

  return [...bases].sort((left, right) => left.localeCompare(right, locale));
}

export function buildCandidateSet(texts) {
  const pairs = extractPersonPairs(texts);
  const observedBases = extractObservedGenderedBases(texts);

  return {
    version: 1,
    stats: {
      pairs: pairs.length,
      observedBases: observedBases.length
    },
    pairs,
    observedBases
  };
}

function parseArguments(argv) {
  const files = [];
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
    files.push(argument);
  }

  if (files.length === 0) {
    throw new Error(
      "Mindestens eine lokale Text-, CSV-, JSON- oder HTML-Datei angeben."
    );
  }

  return { files, output };
}

async function main(argv) {
  const { files, output } = parseArguments(argv);
  const texts = await Promise.all(
    files.map((file) => readFile(resolve(file), "utf8"))
  );
  const result = buildCandidateSet(texts);
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
