import assert from 'node:assert/strict';
import {spawnSync,spawn} from 'node:child_process';
import {constants,openSync,readSync,closeSync,lstatSync,fstatSync} from 'node:fs';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {createServer} from 'node:net';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {summarizeSyntheticOptOutput} from './synthetic-opt-output.mjs';
import {observeOwnRendererFlags} from './own-renderer-flag-observation.mjs';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function main(){
 assert.equal(process.platform,'linux');
 let stage='temporary-directory',baselineSessionVerified=false;
 const directory=await mkdtemp(path.join(tmpdir(),'sv-opt-source-'));let fd,pump,driver,session,stopFlags,memoryFile;
 const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;await new Promise(r=>server.close(r));
 const base='http://127.0.0.1:'+port;
 async function rpc(method,pathname,body,timeout=10000){
  const response=await fetch(base+pathname,{method,headers:{'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(timeout)});
  const value=(await response.json()).value;
  if(!response.ok||value?.error){const error=Error('Own WebDriver command failed');error.diagnostic={webdriverError:['session not created','unknown error','invalid argument'].includes(value?.error)?value.error:'other',binaryMissing:/no chrome binary|cannot find.*binary/i.test(value?.message??''),versionMismatch:/only supports.*version|current browser version/i.test(value?.message??''),devToolsUnavailable:/DevToolsActivePort|chrome not reachable/i.test(value?.message??'')};throw error;}return value;
 }
 try{
  stage='anonymous-memory-file';
  memoryFile=spawn('python3',['-u','-c','import os,sys; fd=os.memfd_create("sv-synthetic-compiler",0); os.fchmod(fd,0o600); print(fd,flush=True); sys.stdin.read()'],{stdio:['pipe','pipe','ignore']});
  const descriptor=await Promise.race([new Promise((resolve,reject)=>{memoryFile.once('error',reject);memoryFile.stdout.once('data',data=>resolve(data.toString().trim()));}),pause(5000).then(()=>{throw Error('Memory helper startup timeout');})]);
  assert.match(descriptor,/^\d+$/);const fifo='/proc/'+memoryFile.pid+'/fd/'+descriptor;
  fd=openSync(fifo,constants.O_RDONLY);assert.ok(fstatSync(fd).isFile());
  stage='driver-start';
  driver=spawn('chromedriver',['--port='+port],{stdio:['ignore','pipe','pipe']});
  let startFailed=false;driver.on('error',()=>{startFailed=true;});driver.stdout.on('data',()=>{});driver.stderr.on('data',()=>{});
  let ready=false;for(let i=0;i<30&&!startFailed;i++){try{await rpc('GET','/status',undefined,500);ready=true;break;}catch{await pause(100);}}
  assert.ok(ready&&!startFailed);
  stage='baseline-session';
  const baseline=await rpc('POST','/session',{capabilities:{alwaysMatch:{browserName:'chrome','goog:chromeOptions':{binary:'/usr/bin/chromium',args:['--headless=new','--no-sandbox','--no-first-run']}}}},30000);
  session=baseline.sessionId;assert.equal(baseline.capabilities.browserVersion,'155.0.8059.0');
  const baselineResult=await rpc('POST','/session/'+session+'/execute/sync',{script:'return 49995000;',args:[]});
  assert.equal(baselineResult,49995000);baselineSessionVerified=true;
  await rpc('DELETE','/session/'+session,undefined,5000);session=undefined;
  let pipe='',truncated=false,readFailed=false;
  const drain=()=>{const size=fstatSync(fd).size;truncated=size>16*1024*1024;const buffer=Buffer.alloc(Math.min(size,16*1024*1024));const n=readSync(fd,buffer,0,buffer.length,0);pipe=buffer.subarray(0,n).toString('utf8');};
  const flags='--trace-opt --trace-file-names --redirect-code-traces --redirect-code-traces-to='+fifo;
  stage='session-create';
  const created=await rpc('POST','/session',{capabilities:{alwaysMatch:{browserName:'chrome','goog:chromeOptions':{binary:'/usr/bin/chromium',args:['--headless=new','--no-sandbox','--no-first-run','--js-flags='+flags]}}}},30000);
  stage='version-guard';
  session=created.sessionId;stopFlags=observeOwnRendererFlags(driver.pid);assert.equal(created.capabilities.browserVersion,'155.0.8059.0');
  stage='navigation';
  await rpc('POST','/session/'+session+'/url',{url:'data:text/html,<title>synthetic-control</title>'});
  stage='script-execute';
  const result=await rpc('POST','/session/'+session+'/execute/sync',{script:'function svDiagnosticHotLoop(n){let x=0;for(let i=0;i<n;i++)x=(x+i)|0;return x}for(let j=0;j<200;j++)window.svTotal=svDiagnosticHotLoop(10000);return {completed:true,checksum:window.svTotal};\n//# sourceURL=sv-synthetic-opt.js',args:[]});
  stage='collect-output';
  await pause(500);drain();const rendererFlags=stopFlags();stopFlags=undefined;
  const recognized=summarizeSyntheticOptOutput(pipe,'').recognizedFunctionLinesStdout;
  const report={baselineSessionVerified,browserVersion:'155.0.8059.0',syntheticOnly:true,compilerFlagsDiagnosticOnly:true,anonymousMemoryFileVerified:true,rawOutputExported:false,profileExported:false,
   fixtureCompleted:result.completed===true&&result.checksum===49995000,rendererFlags,pipeBytes:Buffer.byteLength(pipe),
   genericTraceLinesPipe:pipe.split(/\r?\n/).filter(line=>/\bJSFunction\b/.test(line)&&/marking|compiling|optimizing/.test(line)).length,
   recognizedFunctionLinesMemoryFile:recognized,readFailed,truncated};
  await mkdir('artifacts',{recursive:true});await writeFile('artifacts/opt-source-preflight.json',JSON.stringify(report,null,2));
  assert.ok(report.fixtureCompleted&&!readFailed&&!truncated);assert.ok(recognized>0);
  console.log('Own WebDriver checksum and known optimizer output verified; only fixed metadata exported.');
 }catch(error){
  await mkdir('artifacts',{recursive:true});
  await writeFile('artifacts/opt-source-preflight-failure.json',JSON.stringify({stage,baselineSessionVerified,timeout:error?.name==='TimeoutError',webdriver:error?.diagnostic??null,syntheticOnly:true,rawOutputExported:false,profileExported:false},null,2));
  throw Error('Synthetic preflight did not complete');
 }finally{
  if(session)try{await rpc('DELETE','/session/'+session,undefined,5000);}catch{}
  if(stopFlags)stopFlags();if(driver&&!driver.killed)driver.kill();driver?.stdout.destroy();driver?.stderr.destroy();if(pump)clearInterval(pump);if(fd!==undefined)closeSync(fd);memoryFile?.stdin.end();if(memoryFile&&!memoryFile.killed)memoryFile.kill();memoryFile?.stdout.destroy();
  assert.ok(directory.startsWith(path.join(tmpdir(),'sv-opt-source-')));await rm(directory,{recursive:true,force:true});
 }
}
await main().catch(()=>{console.error('Synthetic WebDriver optimizer preflight failed; raw errors omitted.');process.exitCode=1;});
