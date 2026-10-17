import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateSystemIoArtifact} from './validate-system-io-artifacts.mjs';
const report=JSON.parse(fs.readFileSync('artifacts/system-io/video-pair-chromium-60-1.json','utf8'));
validateSystemIoArtifact(report);
for(const role of ['baseline','extension']) {
 const r=report[role];
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
for(const role of ['baseline','extension']) {
 const r=report[role];
 assert.match(r.contentSha256,/^[a-f0-9]{64}$/);
 assert.notEqual(r.contentSha256,'8cc5c0d2e11cbfadfd7c1191a7f62ceb0930cbe786ea4efedc1a9d144d3cee4c','Must use current queued-set/map product, not the earlier 98c80cd content');
 assert.match(r.sourceSha256,/^[a-f0-9]{64}$/);
 assert.ok(r.actualEntryFrames&&r.actualEntryFrames.callbacks>1,'Require measured callback-entry clock');
}
assert.equal(report.baseline.contentSha256,report.extension.contentSha256);
assert.equal(report.baseline.sourceSha256,report.extension.sourceSha256,'Both roles must use the same actual media bytes');
assert.ok(report.baseline.actualEntryFrames.maximumGapMs<=300,'A baseline with a severe settled callback-entry stall cannot qualify the comparison');
console.log('Current product and per-pair media bytes bound; actual callback-entry clock present; baseline safety retained.');
