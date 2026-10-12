import {build} from "esbuild";
import {cp, mkdir, readFile, writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import path from "node:path";

// This explicitly invoked diagnostic never writes a production bundle.
const root = process.cwd();
const production = path.join(root, "dist/chromium");
const output = path.join(root, "artifacts/dom-phase-diagnostic/chromium");
const source = path.join(root, "src/core/dom-processor.ts");
const contentBefore = await readFile(path.join(production, "content.js"));
const probe = `
// Local diagnostic build only: retain timings, never text or node references.
const phaseReport = {methods: {}, slow: []};
for (const name of ['start', 'processRoot', 'handleMutationRecords', 'flushRegularNodesBudgeted', 'flushSubtitleNodes', 'discoverLateShadowRoots', 'processTextNode', 'finishTextTransform', 'replaceTextKeepingRanges']) {
  const original = DomProcessor.prototype[name];
  if (typeof original !== 'function') throw new Error('Missing diagnostic method ' + name);
  const stats = phaseReport.methods[name] = {calls:0, totalMs:0, maximumMs:0};
  DomProcessor.prototype[name] = function(...args) {
    const startMs = performance.now();
    try {return original.apply(this, args);}
    finally {
      const durationMs = performance.now() - startMs;
      stats.calls++; stats.totalMs += durationMs; stats.maximumMs = Math.max(stats.maximumMs, durationMs);
      if(durationMs >= 8 && phaseReport.slow.length < 128) phaseReport.slow.push({name, startMs, durationMs});
    }
  };
}
document.addEventListener('__svPhaseDiagnosticCollect', () => {
  document.documentElement.setAttribute('data-sv-phase-diagnostic', JSON.stringify(phaseReport));
});
`;
await mkdir(output, {recursive:true});
await cp(production, output, {recursive:true});
await build({
  entryPoints: [path.join(root, "src/content.ts")],
  outfile: path.join(output, "content.js"),
  bundle: true, format: "iife", target: ["es2022"], platform: "browser",
  sourcemap: false, minify: false,
  plugins: [{name:"isolated-dom-phase-diagnostic", setup(builder) {
    builder.onLoad({filter:/dom-processor\.ts$/}, async ({path: file}) => {
      if (file !== source) return;
      return {contents:await readFile(file, "utf8") + probe, loader:"ts"};
    });
  }}]
});
const contentAfter = await readFile(path.join(production, "content.js"));
if (!contentBefore.equals(contentAfter)) throw new Error("Production content changed during diagnostic build.");
await writeFile(path.join(output, "dom-phase-diagnostic.json"), JSON.stringify({
  schema:1, productionContentSha256:createHash("sha256").update(contentBefore).digest("hex"),
  minimumSlowDurationMs:8, maximumSlowSamples:128
}, null, 2) + "\n");
console.log("Isolated DOM phase diagnostic: " + output);
