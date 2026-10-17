import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

export const originalCall = `transformTextWithSummary(request.input, defaultRules, {
    ...options, ...(disabledRuleIds ? {disabledRuleIds: new Set(disabledRuleIds)} : {})
  })`;
export function literalResult(input) {
  const count=input.split('Nutzer:innen').length-1;
  return {text:input.replaceAll('Nutzer:innen','Nutzer'),replacements:count,
    summaries:count?[{original:'Nutzer:innen',replacement:'Nutzer',count}]:[]};
}
export function patchBackground(source) {
  source=source.replaceAll('\r\n','\n');
  assert.equal(source.split(originalCall).length,2,'Require exactly one known background transform call');
  // Both backends stay in both bundles. Only a runtime global selects execution;
  // this prevents a smaller lexicon-free bundle from confounding the comparison.
  return `const diagnosticLiteralResult=${literalResult.toString()};\n`+source.replace(originalCall,
    `(globalThis["__diagnosticLiteralBackend"] === true ? diagnosticLiteralResult(request.input) : ${originalCall})`);
}
export async function buildBackendPair(outputRoot) {
  const source=await readFile('src/background.ts','utf8');
  const patched=patchBackground(source);
  const result=await build({stdin:{contents:patched,resolveDir:path.resolve('src'),sourcefile:'background.ts',loader:'ts'},
    bundle:true,platform:'browser',format:'iife',target:['es2022'],minify:false,sourcemap:false,write:false,metafile:true});
  const body=result.outputFiles[0].text;
  assert.ok(Object.keys(result.metafile.inputs).some(x=>x.includes('core/transform-text')));
  assert.ok(Object.keys(result.metafile.inputs).some(x=>x.includes('person-lexicon')),'Retain real lexicon initialization');
  const hashes={};
  for(const [mode,enabled] of [['literal',true],['rules',false]]) {
    const output=`globalThis["__diagnosticLiteralBackend"] = ${enabled};\n`+body;
    await mkdir(path.join(outputRoot,mode),{recursive:true});
    await writeFile(path.join(outputRoot,mode,'background.js'),output);
    hashes[mode]=createHash('sha256').update(output).digest('hex');
  }
  return {diagnosticOnly:true,selection:'runtime-global',sharedBodySha256:createHash('sha256').update(body).digest('hex'),backgroundSha256:hashes};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
  assert.ok(process.argv[2],'Explicit diagnostic output directory required');
  const metadata=await buildBackendPair(process.argv[2]);
  await writeFile(path.join(process.argv[2],'backend-binding.json'),JSON.stringify(metadata,null,2));
}
