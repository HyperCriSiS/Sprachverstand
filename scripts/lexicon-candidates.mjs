import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const locale = "de-DE";
const wordPattern = /[\p{L}][\p{L}\p{M}’'-]*/gu;
const separatedGenderPattern =
  /(?<![\p{L}\p{M}])([\p{L}][\p{L}\p{M}’'-]{1,80})(?::|\*|_|·|•|\/-?|\/)(?:in|innen)(?![\p{L}\p{M}])/gu;
const binnenIPattern =
  /(?<![\p{L}\p{M}])([\p{L}][\p{L}\p{M}’'-]{1,80})Innen(?![\p{L}\p{M}])/gu;
const textExtensions = new Set([
  ".csv",
  ".htm",
  ".html",
  ".json",
  ".jsonl",
  ".md",
  ".ndjson",
  ".tsv",
  ".txt",
  ".xml"
]);

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

function buildPersonPairs(wordSet) {
  const pairs = new Map();

  for (const word of wordSet) {
    let stem;

    if (word.endsWith("innen") && word.length > 7) {
      stem = word.slice(0, -5);
    } else if (word.endsWith("in") && word.length > 4) {
      stem = word.slice(0, -2);
    } else {
      continue;
    }

    if (stem.length < 3) {
      continue;
    }

    const feminine = `${stem}in`;
    const femininePlural = `${stem}innen`;
    const masculine = findMasculine(wordSet, stem);
    if (!masculine || masculine === feminine) {
      continue;
    }

    const feminineSingularObserved = wordSet.has(feminine);
    const femininePluralObserved = wordSet.has(femininePlural);
    const confidence =
      feminineSingularObserved && femininePluralObserved ? "strong" : "weak";
    const key = `${stem}\u0000${masculine}\u0000${feminine}`;

    pairs.set(key, {
      base: stem,
      masculine,
      feminine,
      evidence: {
        feminineSingular: feminineSingularObserved,
        femininePlural: femininePluralObserved
      },
      confidence
    });
  }

  return [...pairs.values()].sort(
    (left, right) =>
      left.base.localeCompare(right.base, locale) ||
      left.masculine.localeCompare(right.masculine, locale)
  );
}

function addObservedGenderedBases(text, counts) {
  for (const pattern of [separatedGenderPattern, binnenIPattern]) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      const base = match[1];
      if (!base) {
        continue;
      }

      const normalized = normalizeWord(base);
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    }
  }
}

function observedEntries(counts) {
  return [...counts.entries()]
    .map(([base, count]) => ({ base, count }))
    .sort(
      (left, right) =>
        right.count - left.count || left.base.localeCompare(right.base, locale)
    );
}

function createAccumulator() {
  return {
    words: new Set(),
    observedCounts: new Map()
  };
}

function addText(accumulator, text) {
  for (const word of extractWords(text)) {
    accumulator.words.add(word);
  }
  addObservedGenderedBases(text, accumulator.observedCounts);
}

function finalizeCandidateSet(accumulator) {
  const pairs = buildPersonPairs(accumulator.words);
  const observedGenderedBases = observedEntries(accumulator.observedCounts);
  const strongPairs = pairs.filter((pair) => pair.confidence === "strong").length;
  const observedOccurrences = observedGenderedBases.reduce(
    (sum, entry) => sum + entry.count,
    0
  );

  return {
    version: 2,
    stats: {
      words: accumulator.words.size,
      pairs: pairs.length,
      strongPairs,
      weakPairs: pairs.length - strongPairs,
      observedBases: observedGenderedBases.length,
      observedOccurrences
    },
    pairs,
    observedBases: observedGenderedBases.map((entry) => entry.base),
    observedGenderedBases
  };
}

export function extractPersonPairs(texts) {
  const accumulator = createAccumulator();
  for (const text of texts) {
    addText(accumulator, text);
  }
  return buildPersonPairs(accumulator.words);
}

export function extractObservedGenderedBases(texts) {
  const accumulator = createAccumulator();
  for (const text of texts) {
    addObservedGenderedBases(text, accumulator.observedCounts);
  }
  return observedEntries(accumulator.observedCounts).map((entry) => entry.base);
}

export function buildCandidateSet(texts) {
  const accumulator = createAccumulator();
  for (const text of texts) {
    addText(accumulator, text);
  }
  return finalizeCandidateSet(accumulator);
}

function parseArguments(argv) {
  const inputs = [];
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
    inputs.push(argument);
  }

  if (inputs.length === 0) {
    throw new Error(
      "Mindestens eine lokale Datei oder ein Verzeichnis mit Rohdaten angeben."
    );
  }

  return { inputs, output };
}

async function collectInputFiles(input) {
  const absolute = resolve(input);
  const metadata = await stat(absolute);

  if (metadata.isFile()) {
    return [absolute];
  }

  if (!metadata.isDirectory()) {
    return [];
  }

  const files = [];
  for (const entry of await readdir(absolute, { withFileTypes: true })) {
    const child = resolve(absolute, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectInputFiles(child)));
      continue;
    }
    if (entry.isFile() && textExtensions.has(extname(entry.name).toLowerCase())) {
      files.push(child);
    }
  }

  return files;
}

async function main(argv) {
  const { inputs, output } = parseArguments(argv);
  const files = (
    await Promise.all(inputs.map((input) => collectInputFiles(input)))
  )
    .flat()
    .sort((left, right) => left.localeCompare(right));

  if (files.length === 0) {
    throw new Error("In den angegebenen Pfaden wurden keine Textdaten gefunden.");
  }

  const accumulator = createAccumulator();
  for (const file of files) {
    // Große Rohdaten werden absichtlich nacheinander verarbeitet und nicht gesammelt.
    addText(accumulator, await readFile(file, "utf8"));
  }

  const result = finalizeCandidateSet(accumulator);
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
