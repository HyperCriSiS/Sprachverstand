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

const supportedTargets = ["chromium", "firefox"];
const targets = requestedTarget ? [requestedTarget] : supportedTargets;

for (const target of targets) {
  if (!supportedTargets.includes(target)) {
    throw new Error(`Unbekanntes Build-Ziel: ${target}`);
  }
}

const packageJson = JSON.parse(
  await readFile(path.join(projectRoot, "package.json"), "utf8")
);

async function prepareStaticFiles(target) {
  const outputDirectory = path.join(projectRoot, "dist", target);
  await mkdir(outputDirectory, { recursive: true });

  await cp(
    path.join(projectRoot, "static"),
    outputDirectory,
    { recursive: true }
  );

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
      background: path.join(projectRoot, "src", "background.ts"),
      content: path.join(projectRoot, "src", "content.ts"),
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
  await new Promise(() => {});
}
