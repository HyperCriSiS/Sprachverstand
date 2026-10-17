import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {summarizeOwnedReport} from './system-io-export.mjs';
import {validateSystemIoArtifact} from './validate-system-io-artifacts.mjs';
const source=readFileSync('scripts/system-io-runner.mjs','utf8');
const verifier=source.slice(source.indexOf('function verifyBackendPackage(){'),source.indexOf('\nverifyBackendPackage();'))+'\nverifyBackendPackage();';
for(const backendKind of ['literal','rules']) {
 const backendBinding=JSON.parse(readFileSync('artifacts/backend-pair/'+backendKind+'/binding.json'));
 vm.runInNewContext(verifier,{backendKind,backendBinding,root:process.cwd(),path,readFileSync,createHash});
 assert.throws(()=>vm.runInNewContext(verifier,{backendKind,backendBinding:{...backendBinding,backgroundSha256:'0'.repeat(64)},root:process.cwd(),path,readFileSync,createHash}),/hash mismatch/);
 const report=JSON.parse(summarizeOwnedReport(JSON.stringify({baseline:{...backendBinding},extension:{...backendBinding,private:'SECRET'}})));
 validateSystemIoArtifact(report);
 assert.equal(report.extension.backendKind,backendKind);assert.equal(report.extension.backgroundSha256,backendBinding.backgroundSha256);
 assert.ok(!JSON.stringify(report).includes('SECRET'));
}
assert.throws(()=>validateSystemIoArtifact({backendKind:'private-value'}));
console.log('Backend runtime hashes/selector/shared body, wrong hash rejection and filtered binding export PASS');
