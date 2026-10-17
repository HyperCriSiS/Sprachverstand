import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {statSync,createReadStream} from 'node:fs';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolveSourceBrowser,expectedSourceSha256} from './source-browser-resolver.mjs';
import {classifyNativeFailure} from './native-failure-class.mjs';
assert.equal(process.platform,'linux');assert.equal(process.env.GITHUB_ACTIONS,'true');
const report={schemaVersion:1,diagnosticOnly:true,additionalPrivilegesUsed:false,globalCacheControlUsed:false,pathsExported:false,processIdentifiersExported:false,rawLogsExported:false,discoveryCreatedBrowserSession:false};
let stage='source-resolution';
try{
 const binding=await resolveSourceBrowser();report.browserVersion=binding.browserVersion;report.resolutionMethod=binding.method;report.sourceUnwritableByCaller=true;report.noExplicitFullImageReadForDiscovery=true;
 if(process.argv.includes('--resolver-preflight')){report.resolverOnly=true;report.completed=true;}
 else{
  const mode=process.env.SOURCE_CONTROL_MODE;assert.ok(['browser-read','zero-scan'].includes(mode));report.sourceControlMode=mode;stage='native-pair';
  const child=spawnSync(process.execPath,['scripts/system-io-runner.mjs','--browser','chromium','--fps','60','--focused-start'],{env:{...process.env,CHROMIUM_BIN:binding.source,EXPECTED_SOURCE_SHA256:expectedSourceSha256},stdio:'pipe',maxBuffer:4*1024*1024,timeout:360000});
  report.nativeExitCode=Number.isSafeInteger(child.status)?child.status:255;report.nativeFailureClass=classifyNativeFailure(child.stderr?.toString()??'',child.status);report.nativePairCompleted=child.status===0;
  stage='post-source-provenance';const after=statSync(binding.source);for(const key of ['dev','ino','size','mtimeMs','ctimeMs'])assert.equal(after[key],binding.identity[key]);report.sourceIdentityStable=true;
  const h=createHash('sha256');for await(const chunk of createReadStream(binding.source))h.update(chunk);const hash=h.digest('hex');assert.equal(hash,expectedSourceSha256);report.sourceBinarySha256=hash;report.postMeasurementHashVerified=true;
  report.completed=child.status===0;if(child.status!==0){report.failedAt='native-pair';process.exitCode=1;}
 }
}catch{report.completed=false;report.failedAt=stage;process.exitCode=1;}
await mkdir('artifacts/source-read-control',{recursive:true});await writeFile('artifacts/source-read-control/summary.json',JSON.stringify(report,null,2),{flag:'wx'});
console.log(JSON.stringify(report));

