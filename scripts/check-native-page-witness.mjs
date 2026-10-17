import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateSystemIoArtifact} from './validate-system-io-artifacts.mjs';
const report=JSON.parse(fs.readFileSync('artifacts/system-io/video-pair-chromium-60-1.json','utf8'));
validateSystemIoArtifact(report);
for(const role of ['baseline','extension']) {
 const r=report[role];assert.equal(r.extensionInstalled,true);assert.equal(r.candidateIndexEnabled,role==="extension");
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

assert.notEqual(report.baseline.contentSha256,report.extension.contentSha256);assert.equal(report.baseline.backgroundSha256,report.extension.backgroundSha256);
