import { cp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import process from "node:process";

// Testumgebung für das Outlook-Add-in ohne Outlook: kopiert dist/outlook nach
// dist/outlook-harness, ersetzt Office.js durch scripts/outlook-harness/mock-office.js
// und stellt alles unter http://localhost:8765/ bereit.
// Seiten: popup/popup.html (Parameter: mail, nodisplay, displayfails, displayhangs, lang),
// options/options.html, launchevent.html (window.harness.compose, window.harness.read).
const projectRoot = process.cwd();
const source = path.join(projectRoot, "dist", "outlook");
const target = path.join(projectRoot, "dist", "outlook-harness");
const port = Number(process.env.PORT || 8765);
const officeScript = /<script src="https:\/\/appsforoffice\.microsoft\.com\/lib\/(1|beta)\/hosted\/office\.js"><\/script>/;

await rm(target, { recursive: true, force: true });
await cp(source, target, { recursive: true });
await cp(path.join(projectRoot, "scripts", "outlook-harness", "mock-office.js"), path.join(target, "mock-office.js"));
for (const [page, prefix] of [["popup/popup.html", "../"], ["options/options.html", "../"], ["launchevent.html", ""], ["read-window.html", ""]]) {
  const file = path.join(target, page);
  const html = await readFile(file, "utf8");
  if (!officeScript.test(html)) throw new Error(`Office.js fehlt in ${page}.`);
  await writeFile(file, html.replace(officeScript, `<script src="${prefix}mock-office.js"></script>`), "utf8");
}

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".png": "image/png", ".xml": "application/xml" };
createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://localhost:${port}`);
  const file = path.join(target, decodeURIComponent(url.pathname));
  if (!file.startsWith(target)) return response.writeHead(403).end();
  try {
    const body = await readFile(file);
    response.writeHead(200, { "content-type": types[path.extname(file)] ?? "application/octet-stream" }).end(body);
  } catch {
    response.writeHead(404).end();
  }
}).listen(port, () => console.log(`Outlook-Testumgebung: http://localhost:${port}/popup/popup.html`));
