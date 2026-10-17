import {test} from 'node:test';
import assert from 'node:assert/strict';
import {processCounts,validateWitness} from './process-count-witness.mjs';
const zero=()=>processCounts('');
test('counts running and zombie browser processes without retaining arbitrary names or ids',()=>{
 const result=processCounts('chrome Sl\nchrome Z\nchromedriver S\nchrome_crashpad S\nPRIVATE S\n');
 assert.deepEqual(result,{browser:{active:1,zombie:1},driver:{active:1,zombie:0},crashpad:{active:1,zombie:0}});
 assert.ok(!JSON.stringify(result).includes('PRIVATE'));
 assert.throws(()=>processCounts('chrome UNKNOWN'));
});
test('accepts only complete declared process stages and bounded counts',()=>{
 const isolated=['before','after-video'].map(stage=>({stage,...zero()}));
 assert.equal(validateWitness(isolated,'isolated'),isolated);
 assert.throws(()=>validateWitness(isolated,'preceded'));
 isolated[0].private='PRIVATE';assert.throws(()=>validateWitness(isolated,'isolated'));delete isolated[0].private;
 isolated[0].browser.active=10001;assert.throws(()=>validateWitness(isolated,'isolated'));
});
