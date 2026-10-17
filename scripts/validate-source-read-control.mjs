import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
export function validateSourceSummary(report){
 const bools=new Set('diagnosticOnly additionalPrivilegesUsed globalCacheControlUsed pathsExported processIdentifiersExported rawLogsExported discoveryCreatedBrowserSession sourceUnwritableByCaller noExplicitFullImageReadForDiscovery resolverOnly completed nativePairCompleted sourceIdentityStable postMeasurementHashVerified'.split(' '));
 for(const [key,value]of Object.entries(report)){
  if(bools.has(key)){assert.equal(typeof value,'boolean');continue;}
  if(['schemaVersion','nativeExitCode'].includes(key)){assert.ok(Number.isSafeInteger(value)&&value>=0&&value<=255);continue;}
  if(key==='browserVersion'){assert.equal(value,'155.0.8059.0');continue;}
  if(key==='resolutionMethod'){assert.ok(['direct-elf','owned-version-process'].includes(value));continue;}
  if(key==='sourceControlMode'){assert.ok(['browser-read','zero-scan'].includes(value));continue;}
  if(key==='nativeFailureClass'){assert.ok(['none','frame-ratio','frame-drops','frame-gap','frame-p95','end-texts','static-text','setup-binding','unexpected'].includes(value));continue;}
  if(key==='sourceBinarySha256'){assert.equal(value,'fe5a683855bb91f3bf5a5496ca2fe7e4c4511673e66605efcbf64c74db88a944');continue;}
  if(key==='failedAt'){assert.ok(['source-resolution','native-pair','post-source-provenance'].includes(value));continue;}
  throw Error('Unexpected source-control metadata refused');
 }
 assert.equal(report.schemaVersion,1);assert.equal(report.diagnosticOnly,true);assert.equal(typeof report.completed,'boolean');
 for(const key of ['additionalPrivilegesUsed','globalCacheControlUsed','pathsExported','processIdentifiersExported','rawLogsExported','discoveryCreatedBrowserSession'])assert.equal(report[key],false);
 if(report.nativeExitCode!==undefined){assert.equal(report.postMeasurementHashVerified,true);assert.equal(report.sourceIdentityStable,true);}
 if(report.completed){assert.equal(report.sourceUnwritableByCaller,true);assert.equal(report.noExplicitFullImageReadForDiscovery,true);assert.equal(report.browserVersion,'155.0.8059.0');assert.ok(report.resolverOnly===true||report.nativeExitCode===0);}
 return true;
}
if(process.argv[1]?.endsWith('validate-source-read-control.mjs')){validateSourceSummary(JSON.parse(readFileSync('artifacts/source-read-control/summary.json','utf8')));console.log('Source-control provenance and fixed metadata schema verified.');}

