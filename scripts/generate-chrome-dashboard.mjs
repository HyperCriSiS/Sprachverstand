import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  createChromeDescription,
  loadStoreReleaseNotes,
  parseReleaseVersionArgument
} from "./store-release-notes-lib.mjs";

const root = process.cwd();
const checkOnly = process.argv.includes("--check");
const outputFile = path.join(root, "store", "generated", "chrome-dashboard.html");

function fail(message) {
  throw new Error(message);
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function createHtml(rows) {
  const serializedRows = JSON.stringify(rows).replaceAll("<", "\\u003c");

  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sprachverstand – Chrome-Store-Lokalisierung</title>
  <style>
    :root {
      color-scheme: light dark;
      font-family: system-ui, sans-serif;
      line-height: 1.45;
    }
    body {
      max-width: 1120px;
      margin: 0 auto;
      padding: 24px;
    }
    header {
      position: sticky;
      top: 0;
      z-index: 2;
      padding: 16px 0;
      background: Canvas;
      border-bottom: 1px solid GrayText;
    }
    h1 {
      margin: 0 0 8px;
      font-size: 1.6rem;
    }
    .toolbar {
      display: grid;
      grid-template-columns: minmax(220px, 1fr) auto auto;
      gap: 12px;
      align-items: center;
      margin-top: 16px;
    }
    input[type="search"], textarea, button {
      font: inherit;
    }
    input[type="search"], textarea {
      box-sizing: border-box;
      width: 100%;
      padding: 8px 10px;
    }
    button {
      padding: 8px 12px;
      cursor: pointer;
    }
    #cards {
      display: grid;
      gap: 18px;
      margin-top: 24px;
    }
    .card {
      padding: 18px;
      border: 1px solid GrayText;
      border-radius: 10px;
    }
    .card.done {
      opacity: 0.64;
    }
    .card-head {
      display: flex;
      gap: 12px;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }
    .card h2 {
      margin: 0;
      font-size: 1.2rem;
    }
    .code {
      font-family: ui-monospace, monospace;
      opacity: 0.72;
    }
    .field {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px 12px;
      align-items: end;
      margin-top: 14px;
    }
    .field label {
      grid-column: 1 / -1;
      font-weight: 650;
    }
    .field textarea {
      resize: vertical;
    }
    .description {
      min-height: 220px;
    }
    .status {
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .done-control {
      display: flex;
      gap: 8px;
      align-items: center;
      white-space: nowrap;
    }
    .notice {
      margin: 8px 0 0;
      opacity: 0.8;
    }
    @media (max-width: 760px) {
      body { padding: 14px; }
      .toolbar { grid-template-columns: 1fr; }
      .field { grid-template-columns: 1fr; }
      .field button { justify-self: start; }
      .card-head { align-items: flex-start; flex-direction: column; }
    }
  </style>
</head>
<body>
  <header>
    <h1>Chrome-Web-Store-Lokalisierung</h1>
    <p class="notice">Alle 51 Texte stammen aus den geprüften Sprachverstand-Store-Quellen. Die Fortschrittsmarkierungen werden nur lokal in diesem Browser gespeichert.</p>
    <div class="toolbar">
      <input id="search" type="search" placeholder="Sprache oder Locale suchen" aria-label="Sprachen durchsuchen">
      <strong id="progress" class="status">0/51 erledigt</strong>
      <button id="reset" type="button">Fortschritt zurücksetzen</button>
    </div>
  </header>
  <main id="cards"></main>
  <script>
    const rows = ${serializedRows};
    const storageKey = "sprachverstand.chrome-dashboard-progress.v1";
    const cards = document.querySelector("#cards");
    const search = document.querySelector("#search");
    const progress = document.querySelector("#progress");
    const reset = document.querySelector("#reset");

    function loadDone() {
      try {
        return new Set(JSON.parse(localStorage.getItem(storageKey) || "[]"));
      } catch {
        return new Set();
      }
    }

    let done = loadDone();

    function saveDone() {
      localStorage.setItem(storageKey, JSON.stringify([...done]));
    }

    function updateProgress() {
      progress.textContent = done.size + "/" + rows.length + " erledigt";
    }

    async function copyText(value, button) {
      let copied = false;

      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(value);
          copied = true;
        } catch {
          copied = false;
        }
      }

      if (!copied) {
        const helper = document.createElement("textarea");
        helper.value = value;
        helper.setAttribute("readonly", "");
        helper.style.position = "fixed";
        helper.style.opacity = "0";
        document.body.append(helper);
        helper.select();
        copied = document.execCommand("copy");
        helper.remove();
      }

      const previous = button.textContent;
      button.textContent = copied ? "Kopiert" : "Kopieren fehlgeschlagen";
      setTimeout(() => { button.textContent = previous; }, 1400);
    }

    function render() {
      const query = search.value.trim().toLocaleLowerCase("de");
      cards.replaceChildren();

      for (const row of rows) {
        const haystack = (row.locale + " " + row.localeName + " " + row.summary + " " + row.description).toLocaleLowerCase("de");
        if (query && !haystack.includes(query)) continue;

        const article = document.createElement("article");
        article.className = "card" + (done.has(row.locale) ? " done" : "");
        article.dataset.locale = row.locale;

        const head = document.createElement("div");
        head.className = "card-head";

        const heading = document.createElement("h2");
        heading.textContent = row.localeName;
        const code = document.createElement("span");
        code.className = "code";
        code.textContent = " (" + row.locale + ")";
        heading.append(code);

        const doneLabel = document.createElement("label");
        doneLabel.className = "done-control";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = done.has(row.locale);
        checkbox.addEventListener("change", () => {
          if (checkbox.checked) done.add(row.locale);
          else done.delete(row.locale);
          saveDone();
          updateProgress();
          article.classList.toggle("done", checkbox.checked);
        });
        doneLabel.append(checkbox, "Im Dashboard erledigt");
        head.append(heading, doneLabel);

        const shortField = document.createElement("div");
        shortField.className = "field";
        const shortLabel = document.createElement("label");
        shortLabel.textContent = "Kurzbeschreibung (" + row.summary.length + "/132 Zeichen)";
        const shortText = document.createElement("textarea");
        shortText.readOnly = true;
        shortText.rows = 3;
        shortText.dir = row.direction;
        shortText.value = row.summary;
        const shortCopy = document.createElement("button");
        shortCopy.type = "button";
        shortCopy.textContent = "Kurzbeschreibung kopieren";
        shortCopy.addEventListener("click", () => copyText(row.summary, shortCopy));
        shortField.append(shortLabel, shortText, shortCopy);

        const longField = document.createElement("div");
        longField.className = "field";
        const longLabel = document.createElement("label");
        longLabel.textContent = "Langbeschreibung";
        const longText = document.createElement("textarea");
        longText.readOnly = true;
        longText.className = "description";
        longText.dir = row.direction;
        longText.value = row.description;
        const longCopy = document.createElement("button");
        longCopy.type = "button";
        longCopy.textContent = "Langbeschreibung kopieren";
        longCopy.addEventListener("click", () => copyText(row.description, longCopy));
        longField.append(longLabel, longText, longCopy);

        article.append(head, shortField, longField);
        cards.append(article);
      }
    }

    search.addEventListener("input", render);
    reset.addEventListener("click", () => {
      done = new Set();
      saveDone();
      updateProgress();
      render();
    });

    updateProgress();
    render();
  </script>
</body>
</html>
`;
}

const locales = await readJson(path.join(root, "config", "locales.json"));
if (!Array.isArray(locales) || locales.length !== 51) {
  fail("Für die Chrome-Dashboard-Hilfe werden exakt 51 konfigurierte Locales erwartet.");
}

const releaseNotes = await loadStoreReleaseNotes(
  root,
  parseReleaseVersionArgument()
);

const rows = [];
for (const locale of locales) {
  const code = locale.code;
  const messages = await readJson(
    path.join(root, "static", "_locales", code, "messages.json")
  );
  const listing = await readJson(
    path.join(root, "store", "listings", `${code}.json`)
  );
  const summary = messages.extensionDescription?.message;

  if (typeof summary !== "string" || !summary.trim()) {
    fail(`${code}: Kurzbeschreibung fehlt.`);
  }
  if (summary.length > 132) {
    fail(`${code}: Kurzbeschreibung überschreitet 132 Zeichen.`);
  }
  if (listing.locale !== code || listing.name !== "Sprachverstand") {
    fail(`${code}: Store-Listing passt nicht zur Locale-Matrix.`);
  }
  if (typeof listing.description !== "string" || !listing.description.trim()) {
    fail(`${code}: Vollbeschreibung fehlt.`);
  }
  if (locale.direction !== "ltr" && locale.direction !== "rtl") {
    fail(`${code}: Schreibrichtung muss ltr oder rtl sein.`);
  }

  rows.push({
    locale: code,
    localeName: locale.name,
    direction: locale.direction,
    name: "Sprachverstand",
    summary: summary.trim(),
    description: createChromeDescription(
      listing.description,
      code,
      releaseNotes
    )
  });
}

const html = createHtml(rows);
if (
  !html.includes("Chrome-Web-Store-Lokalisierung") ||
  !html.includes("0/51 erledigt")
) {
  fail("Die Chrome-Dashboard-Hilfe wurde nicht vollständig erzeugt.");
}

if (!checkOnly) {
  await mkdir(path.dirname(outputFile), { recursive: true });
  await writeFile(outputFile, html, "utf8");
}

console.log(
  `Chrome-Dashboard-Hilfe geprüft: ${rows.length} Locales mit Release-Notes ${releaseNotes.version}${
    checkOnly ? "." : "; store/generated/chrome-dashboard.html erzeugt."
  }`
);
