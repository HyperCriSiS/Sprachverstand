import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
export function validateOwnedCopyReport(report){
const bools=new Set('diagnosticCopyOnly additionalPrivilegesUsed systemWideCacheControlUsed pathsExported processIdentifiersExported rawProfilesExported ownedCopyVerified sourceAndCopyHashEqual probeSelfTestPassed coldProbeVerified positiveReadControlVerified coldResetVerified copyScriptVerified allRendererExecutablesAreOwnCopy completed cleanupFailed nativePairCompleted'.split(' '));
const numbers=new Set(['schemaVersion','copiedFiles','copiedBytes','rendererCount','nativeExitCode']);
for(const [key,value] of Object.entries(report)){
 if(bools.has(key)){assert.equal(typeof value,'boolean');continue;}
 if(numbers.has(key)){assert.ok(Number.isSafeInteger(value)&&value>=0&&value<=2*1024**3);continue;}
 if(key==='declaredCacheState'){assert.ok(['cold','warm'].includes(value));continue;}
 if(key==='browserVersion'){assert.equal(value,'155.0.8059.0');continue;}
 if(key==='sourceBinarySha256'){assert.match(value,/^[a-f0-9]{64}$/);continue;}
 if(key==='failedAt'){assert.ok(['source-session','copy','compile-helper','cold-control','copy-session','native-pair'].includes(value));continue;}
 throw Error('Unexpected copy-preflight metadata refused');
}
for(const key of ['additionalPrivilegesUsed','systemWideCacheControlUsed','pathsExported','processIdentifiersExported','rawProfilesExported'])assert.equal(report[key],false);
assert.equal(report.diagnosticCopyOnly,true);
if(report.completed)for(const key of ['ownedCopyVerified','sourceAndCopyHashEqual','probeSelfTestPassed','coldProbeVerified','positiveReadControlVerified','coldResetVerified','copyScriptVerified','allRendererExecutablesAreOwnCopy'])assert.equal(report[key],true);
assert.equal(report.schemaVersion,1);assert.equal(typeof report.completed,'boolean');
return true;
}
if(process.argv[1]?.endsWith('validate-owned-browser-copy-preflight.mjs')){
 validateOwnedCopyReport(JSON.parse(readFileSync('artifacts/owned-browser-copy-preflight/summary.json','utf8')));
 console.log('Fixed copy-preflight metadata schema verified.');
}
