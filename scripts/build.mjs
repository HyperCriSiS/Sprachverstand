import { context } from "esbuild";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const projectRoot = process.cwd();
const argumentsSet = new Set(process.argv.slice(2));
const targetArgumentIndex = process.argv.indexOf("--target");
const targetsArgumentIndex = process.argv.indexOf("--targets");
const requestedTarget =
  targetArgumentIndex >= 0 ? process.argv[targetArgumentIndex + 1] : undefined;
const requestedTargets =
  targetsArgumentIndex >= 0
    ? process.argv[targetsArgumentIndex + 1]?.split(",").filter(Boolean)
    : undefined;
const watch = argumentsSet.has("--watch");
const cleanOnly = argumentsSet.has("--clean");

const supportedTargets = ["chromium", "firefox"];
const experimentalTargets = ["thunderbird"];

if (requestedTarget && requestedTargets) {
  throw new Error("--target und --targets dürfen nicht gleichzeitig verwendet werden.");
}

const targets = requestedTarget
  ? [requestedTarget]
  : requestedTargets?.length
    ? requestedTargets
    : supportedTargets;

for (const target of targets) {
  if (![...supportedTargets, ...experimentalTargets].includes(target)) {
    throw new Error(`Unbekanntes Build-Ziel: ${target}`);
  }
}

const packageJson = JSON.parse(
  await readFile(path.join(projectRoot, "package.json"), "utf8")
);

async function injectLocalizationBootstrap(outputDirectory) {
  for (const relativePath of [
    "popup/popup.html",
    "options/options.html",
    "legal/legal.html"
  ]) {
    const htmlPath = path.join(outputDirectory, relativePath);
    let html = await readFile(htmlPath, "utf8");
    const marker = /<meta\b(?=[^>]*\bname=["']color-scheme["'])[^>]*>/i;
    html = html.replace(
      marker,
      (tag) => `${tag}\n    <script src="../i18n-bootstrap.js" defer></script>`
    );
    await writeFile(htmlPath, html, "utf8");
  }
}

async function prepareStaticFiles(target) {
  const outputDirectory = path.join(projectRoot, "dist", target);
  await mkdir(outputDirectory, { recursive: true });

  await cp(
    path.join(projectRoot, "static"),
    outputDirectory,
    { recursive: true }
  );

  await injectLocalizationBootstrap(outputDirectory);
  if (target === "thunderbird") {
    for (const page of ["popup/popup.html", "options/options.html"]) {
      const pagePath = path.join(outputDirectory, page);
      const pageHtml = await readFile(pagePath, "utf8");
      await writeFile(pagePath, pageHtml.replace("</head>", '<script src="../thunderbird-platform-ui.js" defer></script>\n</head>'), "utf8");
    }
    const optionsPath = path.join(outputDirectory, "options/options.html");
    const html = await readFile(optionsPath, "utf8");
    await writeFile(optionsPath, html.replace("</head>", '<script src="thunderbird-compose-options.js" defer></script>\n</head>'), "utf8");
  }

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

if (cleanOnly) {
  await rm(path.join(projectRoot, "dist"), { recursive: true, force: true });
  process.exit(0);
}

await rm(path.join(projectRoot, "dist"), { recursive: true, force: true });

const buildContexts = [];

for (const target of targets) {
  await prepareStaticFiles(target);

  const buildContext = await context({
    entryPoints: {
      ...(target === "thunderbird" ? {
        "thunderbird-platform-ui": path.join(projectRoot, "src/thunderbird/platform-ui.ts"),
        "compose-ready": path.join(projectRoot, "src/thunderbird/compose-ready.ts"),
        "options/thunderbird-compose-options": path.join(projectRoot, "src/thunderbird/compose-options.ts")
      } : {}),
      background: path.join(projectRoot, "src", target === "thunderbird" ? "thunderbird/background.ts" : "background.ts"),
      content: path.join(projectRoot, "src", target === "thunderbird" ? "thunderbird/content.ts" : "content.ts"),
      "popup/popup": path.join(projectRoot, "src", "popup.ts"),
      "options/options": path.join(projectRoot, "src", "options.ts")
    },
    outdir: path.join(projectRoot, "dist", target),
    bundle: true,
    format: "iife",
    target: ["es2022"],
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
  process.on("SIGINT", async () => {
    await Promise.all(buildContexts.map((buildContext) => buildContext.dispose()));
    process.exit(0);
  });
  await new Promise(() => {});
}
