import {cp,readdir,readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {buildBackendPair} from './build-background-backend-pair.mjs';
const sha=buffer=>createHash('sha256').update(buffer).digest('hex');
async function inventory(dir,prefix='') {
 const items={};
 for(const entry of await readdir(dir,{withFileTypes:true})) {
  const name=prefix+entry.name;
  if(entry.isDirectory())Object.assign(items,await inventory(path.join(dir,entry.name),name+'/'));
  else {assert.ok(entry.isFile(),'No package symlinks');items[name]=sha(await readFile(path.join(dir,entry.name)));}
 }
 return items;
}
const original=await inventory('dist/chromium');
const output='artifacts/backend-pair';
const metadata=await buildBackendPair(output);
for(const backendKind of ['literal','rules']) {
 const target=path.join(output,backendKind,'extension');
 await mkdir(target,{recursive:true});await cp('dist/chromium',target,{recursive:true});
 await cp(path.join(output,backendKind,'background.js'),path.join(target,'background.js'));
 const files=await inventory(target);
 assert.deepEqual(Object.keys(files).sort(),Object.keys(original).sort());
 for(const name of Object.keys(original))if(name!=='background.js')assert.equal(files[name],original[name],name+' unchanged');
 assert.equal(files['background.js'],metadata.backgroundSha256[backendKind]);
 await writeFile(path.join(output,backendKind,'binding.json'),JSON.stringify({backendKind,backgroundSha256:files['background.js'],backendBodySha256:metadata.sharedBodySha256}));
}
console.log('Both packages bound: identical manifest, content, UI and assets; only background selector differs.');
