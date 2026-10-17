import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateSystemIoArtifact} from './validate-system-io-artifacts.mjs';
const report=JSON.parse(fs.readFileSync('artifacts/system-io/video-pair-chromium-60-1.json','utf8'));
validateSystemIoArtifact(report);
for(const role of ['baseline','extension']) {
 const r=report[role];assert.equal(r.sourceWarmupMatched,true);assert.equal(r.sourceRendererBindingVerified,true);assert.equal(r.sourceControlMode,process.env.SOURCE_CONTROL_MODE);assert.equal(r.browserWarmReadPerformed,process.env.SOURCE_CONTROL_MODE==="browser-read");assert.ok(r.callbackCount>0);
 assert.equal(r.pageThreadWitnessVerified,true,'Native page marker must identify exactly one thread');
 assert.ok(Array.isArray(r.pageThreadPhases));
 assert.equal(r.pageThreadPhases.length,7);
 assert.ok(Array.isArray(r.pageThreadGapOverlap),'Require actual callback-entry clock and valid bounded trace clock');
 assert.equal(r.pageThreadGapOverlap.length,7);
 assert.equal(r.correctDynamicTexts,480);assert.equal(r.expectedDynamicTexts,480);
 assert.equal(r.allCallbackFramesVisible,true);assert.equal(r.allCallbackFramesFocused,true);
 assert.equal(r.diagnosticComplete,true);
}
console.log('Both native page-thread witnesses unique; all seven phase aggregates scoped and all fixture roles valid.');
