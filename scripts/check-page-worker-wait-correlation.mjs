import assert from 'node:assert/strict';
import {summarizePageWorkerWaits} from './page-worker-wait-correlation.mjs';
import {validateSystemIoArtifact} from './validate-system-io-artifacts.mjs';
const phases=[{pid:10,tid:10,name:'V8.GC_TIME_TO_SAFEPOINT',ts:100000,dur:200000},
 {pid:10,tid:11,name:'V8.OptimizeBackground',ts:50000,dur:400000}];
const worker={pid:10,tid:11,startToken:'PRIVATE',state:'D',waitChannel:'folio_wait_bit_common',nativeLocation:{status:'sampled',sampleStable:true,instructionPage:{status:'sampled',present:false}}};
const sample={beforeEpochMs:1150,afterEpochMs:1151,threads:[worker]};
const run=(samples,clock={offsetMs:0,uncertaintyMs:10})=>summarizePageWorkerWaits(phases,{samples},{pid:10,tid:10},clock,1000);
const result=run([sample]);
assert.equal(result.observedOwnWorkerSamples,1);assert.equal(result.workerFolioSamplesInsidePageSafepoint,1);
assert.equal(result.stableAbsentWorkerInstructionSamplesInsidePageSafepointAndOptimizer,1);
assert.equal(result.barrierBlockingWorkerIdentified,false);
validateSystemIoArtifact({pageWorkerWaitCorrelation:result});assert.ok(!JSON.stringify(result).includes('PRIVATE'));
assert.equal(run([{...sample,threads:[{...worker,pid:20}]}]).observedOwnWorkerSamples,0);
assert.equal(run([{...sample,beforeEpochMs:1099,afterEpochMs:1111}]).workerFolioSamplesInsidePageSafepoint,0);
assert.equal(run([{...sample,threads:[{...worker,nativeLocation:{...worker.nativeLocation,sampleStable:false}}]}]).stableAbsentWorkerInstructionSamplesInsidePageSafepoint,0);
assert.equal(run([]).observedOwnWorkerSamples,0);
assert.equal(run([sample],{offsetMs:0,uncertaintyMs:-1}),null);
console.log('Same-renderer worker/safepoint/optimizer temporal nesting, uncertainty boundary, unstable identity and privacy PASS; no blocking-worker causality claimed.');
