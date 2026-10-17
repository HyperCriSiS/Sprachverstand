import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sanitizeVideo30Pair} from './sanitize-video30-pair.mjs';
const hash='13f69752b5dc9e85842e1eacd71f03f36f83de9d3b6ce8321fd2fc4c09d842cd';
function fixture(){
 const role=mode=>({mode,controlKind:'literal',extensionInstalled:false,installationArgumentsVerified:true,
  browserVersion:'155.0.8059.0',driverVersion:'155.0.8059.0',currentTime:8,droppedVideoFrames:1,mutationTicks:1,
  dynamicCompletion:{total:480,expected:480,correct:480},literalControl:mode==='extension'?{rewrites:49,batches:1}:null,
  frames:{callbacks:3,p95GapMs:66.7,maximumGapMs:66.7,gapsOver120Ms:0},
  frameSamples:[0,1,3].map((index,i)=>({nowMs:index*1000/30,mediaTime:index/30,presentedFrames:i+1})),
  longTaskSupported:null,longTasks:[],visibilityEvents:[],focused:true,visibilityState:'visible'});
 return {controlKind:'literal',pairOrder:'baseline-first',sourceFps:30,sourceHash:hash,baseline:role('baseline'),extension:role('extension')};
}
test('keeps source omissions and work checks without exporting arbitrary raw fields',()=>{
 const pair=fixture();pair.private='PRIVATE';pair.extension.traceFile='PRIVATE';pair.extension.staticText='PRIVATE';
 pair.extension.frameSamples[0].deviceId='PRIVATE';
 const output=sanitizeVideo30Pair(pair);
 assert.equal(output.extension.extensionInstalled,false);assert.equal(output.extension.literalWorkMatches,true);
 assert.deepEqual(output.extension.presentationProgress.locatedOmissionsModulo3,[0,0,1]);
 assert.equal(output.extension.longTaskObservation,'not-enabled');
 assert.ok(!JSON.stringify(output).includes('PRIVATE'));
});
test('rejects invalid measurements, changed sources, mixed versions and unbounded input',()=>{
 for(const mutate of [p=>p.sourceHash='PRIVATE',p=>p.extension.extensionInstalled=true,
  p=>p.extension.browserVersion='155.0.8059.39',p=>p.extension.droppedVideoFrames='PRIVATE',
  p=>p.extension.frameSamples=Array(2049).fill(p.extension.frameSamples[0])]){
  const pair=fixture();mutate(pair);assert.throws(()=>sanitizeVideo30Pair(pair));
 }
});
test('keeps missing long-task and callback observations explicitly unmeasured',()=>{
 const output=sanitizeVideo30Pair(fixture());
 assert.equal(output.extension.frameSamples[0].callbackAtMs,null);
 assert.equal(output.extension.frameSamples[0].focused,null);
 assert.equal(output.extension.longTaskObservation,'not-enabled');
});
