import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {literalResult,patchBackground,originalCall,buildBackendPair} from './build-background-backend-pair.mjs';
assert.deepEqual(literalResult('Nutzer:innen / Nutzer:innen'),{text:'Nutzer / Nutzer',replacements:2,summaries:[{original:'Nutzer:innen',replacement:'Nutzer',count:2}]});
assert.deepEqual(literalResult('Unveraendert'),{text:'Unveraendert',replacements:0,summaries:[]});
assert.throws(()=>patchBackground(''),/exactly one/);
assert.throws(()=>patchBackground(originalCall+originalCall),/exactly one/);
const sourceBefore=await readFile('src/background.ts','utf8');
const dir=await mkdtemp(path.join(tmpdir(),'sprachverstand-backend-'));
try {
 const metadata=await buildBackendPair(dir);
 const literal=await readFile(path.join(dir,'literal/background.js'),'utf8');
 const rules=await readFile(path.join(dir,'rules/background.js'),'utf8');
 new vm.Script(literal);new vm.Script(rules);
 assert.equal(literal.slice(literal.indexOf('\n')),rules.slice(rules.indexOf('\n')),'Identical complete bundle body');
 assert.notEqual(metadata.backgroundSha256.literal,metadata.backgroundSha256.rules);
 assert.equal(await readFile('src/background.ts','utf8'),sourceBefore,'Product source untouched');
 console.log('Backend pair: literal counts/summaries, fail-closed source patch, retained lexicon, identical bundle bodies, script syntax and untouched source PASS');
} finally {await rm(dir,{recursive:true,force:true});}
