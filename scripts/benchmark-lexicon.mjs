import { performance } from "node:perf_hooks";

const entryCount = Number(process.argv[2] ?? 20000);
const lookupCount = Number(process.argv[3] ?? 1000000);

if (!Number.isInteger(entryCount) || entryCount <= 0) {
  throw new Error("Die Zahl der Einträge muss eine positive Ganzzahl sein.");
}
if (!Number.isInteger(lookupCount) || lookupCount <= 0) {
  throw new Error("Die Zahl der Lookups muss eine positive Ganzzahl sein.");
}

const startBuild = performance.now();
const dictionary = Object.create(null);
for (let index = 0; index < entryCount; index += 1) {
  dictionary[`synthetischerstamm${index}`] = `synthetischerplural${index}`;
}
const buildMilliseconds = performance.now() - startBuild;

let checksum = 0;
const startLookup = performance.now();
for (let index = 0; index < lookupCount; index += 1) {
  const key = `synthetischerstamm${index % entryCount}`;
  checksum += dictionary[key]?.length ?? 0;
}
const lookupMilliseconds = performance.now() - startLookup;

const serializedBytes = Buffer.byteLength(JSON.stringify(dictionary), "utf8");
process.stdout.write(
  `${JSON.stringify(
    {
      entryCount,
      lookupCount,
      buildMilliseconds: Math.round(buildMilliseconds * 100) / 100,
      lookupMilliseconds: Math.round(lookupMilliseconds * 100) / 100,
      lookupsPerSecond: Math.round((lookupCount / lookupMilliseconds) * 1000),
      serializedBytes,
      checksum
    },
    null,
    2
  )}\n`
);
