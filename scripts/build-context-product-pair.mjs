import assert from 'node:assert/strict';
import {readFile,writeFile,cp,access} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const file='src/core/dom-processor.ts',indexed=await readFile(file,'utf8');
assert.ok(indexed.includes('for (const rule of this.leadingContextRules)'));
const baseline=spawnSync('git',['show','f6d850e06990c777e2e6b97640ee20be0674d21e:'+file],{encoding:'utf8'});assert.equal(baseline.status,0);assert.ok(!baseline.stdout.includes('this.leadingContextRules'));
const runBuild=()=>{const r=spawnSync(process.execPath,['scripts/build.mjs','--target','chromium'],{stdio:'inherit',timeout:120000});assert.equal(r.status,0);};
let exists=false;try{await access('artifacts/product-baseline');exists=true;}catch{}assert.equal(exists,false);
try{await writeFile(file,baseline.stdout);runBuild();await cp('dist/chromium','artifacts/product-baseline',{recursive:true,errorOnExist:true,force:false});}finally{await writeFile(file,indexed);}
runBuild();
const sha=async path=>createHash('sha256').update(await readFile(path)).digest('hex');
const oldContent=await sha('artifacts/product-baseline/content.js'),newContent=await sha('dist/chromium/content.js');assert.notEqual(oldContent,newContent);
const oldBackground=await sha('artifacts/product-baseline/background.js'),newBackground=await sha('dist/chromium/background.js');assert.equal(oldBackground,newBackground);
assert.equal(await sha('artifacts/product-baseline/manifest.json'),await sha('dist/chromium/manifest.json'));
console.log('Both actual product builds bound: different content, identical background and manifest.');
