import assert from 'node:assert/strict';import {probeOwnedPageCache} from './owned-file-cache-probe.mjs';
let calls=0;const spawn=(program,args,options)=>{calls++;assert.equal(program,'helper');assert.deepEqual(args,['/own/chrome','0x1000']);assert.equal(options.timeout,200);return {status:0,stdout:'0'};};
assert.equal(probeOwnedPageCache('/other/chrome','0x1000','/own/chrome','helper',spawn),undefined);assert.equal(calls,0);
assert.equal(probeOwnedPageCache('/own/chrome','0x1000','/own/chrome','helper',spawn).resident,false);
assert.equal(probeOwnedPageCache('/own/chrome','0x1000','/own/chrome','helper',()=>({status:0,stdout:'1'})).resident,true);
const failed=probeOwnedPageCache('/own/chrome','0x1000','/own/chrome','helper',()=>({status:1,stdout:'PRIVATE_SENTINEL'}));assert.equal(failed.status,'unavailable');assert.ok(!JSON.stringify(failed).includes('SENTINEL'));
assert.equal(probeOwnedPageCache('/own/chrome','0x1000','/own/chrome','helper',()=>({status:null,error:{code:'ETIMEDOUT'}})).reason,'timeout');
console.log('Owned cache probe: cold/warm, path mismatch, timeout and private-output refusal passed.');
