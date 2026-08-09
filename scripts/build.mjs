import { context } from "esbuild";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const projectRoot = process.cwd();
const argumentsSet = new Set(process.argv.slice(2));
const targetArgumentIndex = process.argv.indexOf("--target");
const requestedTarget =
  targetArgumentIndex >= 0 ? process.argv[targetArgumentIndex + 1] : undefined;
const watch = argumentsSet.has("--watch");
const cleanOnly = argumentsSet.has("--clean");

const supportedTargets = ["chromium", "firefox", "palemoon"];
const targets = requestedTarget ? [requestedTarget] : supportedTargets;

for (const target of targets) {
  if (!supportedTargets.includes(target)) {
    throw new Error(`Unbekanntes Build-Ziel: ${target}`);
  }
}

const packageJson = JSON.parse(
  await readFile(path.join(projectRoot, "package.json"), "utf8")
);

async function injectPaleMoonCompatibilityScript(outputDirectory) {
  for (const relativePath of ["popup/popup.html", "options/options.html"]) {
    const filePath = path.join(outputDirectory, relativePath);
    const html = await readFile(filePath, "utf8");
    const bundleName = path.basename(relativePath, ".html");
    const marker = `<script src="${bundleName}.js" defer></script>`;
    const compatibilityScript =
      `<script src="../palemoon/legacy-api.js" defer></script>\n    ${marker}`;

    if (!html.includes(marker)) {
      throw new Error(
        `Pale-Moon-Kompatibilität konnte nicht in ${relativePath} eingefügt werden.`
      );
    }

    await writeFile(
      filePath,
      html.replace(marker, compatibilityScript),
      "utf8"
    );
  }
}

async function preparePaleMoonFiles(outputDirectory) {
  const legacyDirectory = path.join(projectRoot, "legacy", "palemoon");
  const paleMoonRuntimeDirectory = path.join(outputDirectory, "palemoon");
  const paleMoonIconDirectory = path.join(outputDirectory, "icons");
  await mkdir(paleMoonRuntimeDirectory, { recursive: true });
  await mkdir(paleMoonIconDirectory, { recursive: true });

  const installManifest = await readFile(
    path.join(legacyDirectory, "install.rdf"),
    "utf8"
  );
  await writeFile(
    path.join(outputDirectory, "install.rdf"),
    installManifest.replaceAll("__VERSION__", packageJson.version),
    "utf8"
  );

  for (const size of [16, 64]) {
    const iconBase64 = await readFile(
      path.join(legacyDirectory, `icon${size}.png.base64`),
      "utf8"
    );
    await writeFile(
      path.join(paleMoonIconDirectory, `icon${size}.png`),
      Buffer.from(iconBase64.trim(), "base64")
    );
  }

  await Promise.all([
    cp(
      path.join(legacyDirectory, "chrome.manifest"),
      path.join(outputDirectory, "chrome.manifest")
    ),
    cp(
      path.join(legacyDirectory, "palemoon", "browser-overlay.xul"),
      path.join(paleMoonRuntimeDirectory, "browser-overlay.xul")
    ),
    cp(
      path.join(legacyDirectory, "palemoon", "browser-overlay.css"),
      path.join(paleMoonRuntimeDirectory, "browser-overlay.css")
    ),
    cp(
      path.join(legacyDirectory, "palemoon", "popup-panel.js"),
      path.join(paleMoonRuntimeDirectory, "popup-panel.js")
    ),
    cp(
      path.join(legacyDirectory, "palemoon", "legacy-api.js"),
      path.join(paleMoonRuntimeDirectory, "legacy-api.js")
    )
  ]);

  await injectPaleMoonCompatibilityScript(outputDirectory);
}

async function prepareStaticFiles(target) {
  const outputDirectory = path.join(projectRoot, "dist", target);
  await mkdir(outputDirectory, { recursive: true });

  await cp(path.join(projectRoot, "static"), outputDirectory, {
    recursive: true
  });

  const legalDirectory = path.join(outputDirectory, "legal");
  await mkdir(legalDirectory, { recursive: true });
  await Promise.all([
    cp(path.join(projectRoot, "LICENSE"), path.join(legalDirectory, "LICENSE.txt")),
    cp(
      path.join(projectRoot, "TRADEMARKS.md"),
      path.join(legalDirectory, "TRADEMARKS.md")
    ),
    cp(path.join(projectRoot, "NOTICE"), path.join(legalDirectory, "NOTICE.txt"))
  ]);

  if (target === "palemoon") {
    await preparePaleMoonFiles(outputDirectory);
    return;
  }

  const manifest = JSON.parse(
    await readFile(
      path.join(projectRoot, "manifests", `${target}.json`),
      "utf8"
    )
  );
  manifest.version = packageJson.version;

  await writeFile(
    path.join(outputDirectory, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8"
  );
}

function entryPointsFor(target) {
  if (target === "palemoon") {
    return {
      "palemoon/controller": path.join(
        projectRoot,
        "src",
        "palemoon",
        "controller.ts"
      ),
      "palemoon/content": path.join(
        projectRoot,
        "src",
        "palemoon",
        "content.ts"
      ),
      "popup/popup": path.join(projectRoot, "src", "popup.ts"),
      "options/options": path.join(projectRoot, "src", "options.ts")
    };
  }

  return {
    background: path.join(projectRoot, "src", "background.ts"),
    content: path.join(projectRoot, "src", "content.ts"),
    "popup/popup": path.join(projectRoot, "src", "popup.ts"),
    "options/options": path.join(projectRoot, "src", "options.ts")
  };
}

if (cleanOnly) {
  await rm(path.join(projectRoot, "dist"), { recursive: true, force: true });
  process.exit(0);
}

await rm(path.join(projectRoot, "dist"), { recursive: true, force: true });

const buildContexts = [];

for (const target of targets) {
  await prepareStaticFiles(target);

  const buildContext = await context({
    entryPoints: entryPointsFor(target),
    outdir: path.join(projectRoot, "dist", target),
    bundle: true,
    format: "iife",
    target: [target === "palemoon" ? "es2017" : "es2022"],
    platform: "browser",
    sourcemap: watch ? "inline" : false,
    minify: false,
    logLevel: "info"
  });

  buildContexts.push(buildContext);

  if (watch) {
    await buildContext.watch();
  } else {
    await buildContext.rebuild();
    await buildContext.dispose();
  }
}

if (watch) {
  console.log(`Beobachte Änderungen für: ${targets.join(", ")}`);
  await new Promise(() => {});
}
