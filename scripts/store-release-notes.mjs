import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  createAmoReleaseNotes,
  loadStoreReleaseNotes,
  parseReleaseVersionArgument
} from "./store-release-notes-lib.mjs";

const root = process.cwd();
const checkOnly = process.argv.includes("--check");
const releaseNotes = await loadStoreReleaseNotes(
  root,
  parseReleaseVersionArgument()
);
const amoReleaseNotes = createAmoReleaseNotes(releaseNotes);

if (Object.keys(amoReleaseNotes).length !== 29) {
  throw new Error("AMO-Release-Notes müssen exakt 29 Locales enthalten.");
}

if (!checkOnly) {
  const outputDirectory = path.join(root, "store", "generated");
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(
    path.join(outputDirectory, "amo-release-notes.json"),
    `${JSON.stringify({
      version: releaseNotes.version,
      release_notes: amoReleaseNotes
    }, null, 2)}\n`,
    "utf8"
  );
}

console.log(
  `Store-Release-Notes ${releaseNotes.version} geprüft: 51 Store-Locales, 29 AMO-Locales${
    checkOnly ? "." : "; amo-release-notes.json erzeugt."
  }`
);
