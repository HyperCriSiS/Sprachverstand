import { build } from "esbuild";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

// Baut das Outlook-Add-in nach dist/outlook (oder --out). Die Dateien müssen unter
// --base-url per HTTPS erreichbar sein (Standard: lokaler Entwicklungsserver).
const projectRoot = process.cwd();
const baseIndex = process.argv.indexOf("--base-url");
const baseUrl = new URL(baseIndex >= 0 ? process.argv[baseIndex + 1] : "https://localhost:3000/").toString();
const outIndex = process.argv.indexOf("--out");
const outputDirectory = outIndex >= 0 ? path.resolve(process.argv[outIndex + 1]) : path.join(projectRoot, "dist", "outlook");
const officeScript = '<script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js"></script>';
// Der Seitenbereich (Popup) braucht die Beta-Fassung: Nur sie reicht die Vorschau-API
// item.display.body an Outlook weiter, die stabile wirft „only enabled on the
// beta api endpoint“. Einstellungen und Ereignisdatei nutzen nur stabile APIs.
const betaOfficeScript = officeScript.replace("/lib/1/", "/lib/beta/");
const { version } = JSON.parse(await readFile(path.join(projectRoot, "package.json"), "utf8"));
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error(`Outlook braucht eine Version aus drei Zahlen, nicht ${version}.`);

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
for (const directory of ["_locales", "icons", "popup", "options"]) {
  await cp(path.join(projectRoot, "static", directory), path.join(outputDirectory, directory), { recursive: true });
}

// Gleiche Seiten wie in der Erweiterung; nur das Startskript wird getauscht.
for (const [page, entry] of [["popup/popup.html", "taskpane"], ["options/options.html", "options"]]) {
  const file = path.join(outputDirectory, page);
  const html = (await readFile(file, "utf8")).replace(
    /<script defer="" src="(popup|options)\.js"><\/script>/,
    `${entry === "taskpane" ? betaOfficeScript : officeScript}\n<link href="../outlook.css" rel="stylesheet"/>\n<script type="module" src="../${entry}.js"></script>`
  );
  if (!html.includes(`../${entry}.js`)) throw new Error(`Startskript in ${page} nicht gefunden.`);
  await writeFile(file, html, "utf8");
}
await cp(path.join(projectRoot, "src", "outlook", "outlook.css"), path.join(outputDirectory, "outlook.css"));
await writeFile(path.join(outputDirectory, "launchevent.html"),
  `<!DOCTYPE html>\n<html><head><meta charset="utf-8"/>${officeScript}<script src="launchevent.js"></script></head><body></body></html>\n`);

// Microsoft lehnt Manifestversionen unter 1.0 ab: 0.9.3 wird zu 1.0.9.3,
// 1.0.0 zu 1.1.0.0. So bleibt die Folge aufsteigend.
const manifest = (await readFile(path.join(projectRoot, "manifests", "outlook.xml"), "utf8"))
  .replaceAll("{{VERSION}}", `1.${version}`)
  .replaceAll("{{BASE_URL}}", baseUrl);
await writeFile(path.join(outputDirectory, "manifest.xml"), manifest, "utf8");

const common = { bundle: true, target: ["es2022"], platform: "browser", minify: false, logLevel: "info",
  outdir: outputDirectory };
await build({ ...common, entryPoints: {
  taskpane: path.join(projectRoot, "src", "outlook", "taskpane.ts"),
  options: path.join(projectRoot, "src", "outlook", "options-entry.ts")
}, format: "esm", splitting: true, chunkNames: "chunks/[name]-[hash]" });
// Klassisches Outlook lädt die Ereignisdatei ohne Module als einzelnes Skript.
// linkedom greift optional auf das Node-Paket canvas zu und nutzt sonst einen
// eingebauten Ersatz.
await build({ ...common, entryPoints: { launchevent: path.join(projectRoot, "src", "outlook", "launchevent.ts") },
  format: "iife", target: ["es2018"], external: ["canvas"] });
