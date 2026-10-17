import assert from 'node:assert/strict';
import {spawnSync,spawn} from 'node:child_process';
import {constants,openSync,readSync,closeSync,lstatSync} from 'node:fs';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {createServer} from 'node:net';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {summarizeSyntheticOptOutput} from './synthetic-opt-output.mjs';
import {observeOwnRendererFlags} from './own-renderer-flag-observation.mjs';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function main(){
 assert.equal(process.platform,'linux');
 const directory=await mkdtemp(path.join(tmpdir(),'sv-opt-source-'));let fd,pump,driver,session,stopFlags;
 const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;await new Promise(r=>server.close(r));
 const base='http://127.0.0.1:'+port;
 async function rpc(method,pathname,body,timeout=10000){
  const response=await fetch(base+pathname,{method,headers:{'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(timeout)});
  if(!response.ok)throw Error('Own WebDriver request failed');const value=(await response.json()).value;if(value?.error)throw Error('Own WebDriver command failed');return value;
 }
 try{
  const fifo=path.join(directory,'compiler.pipe');assert.equal(spawnSync('mkfifo',['-m','600',fifo],{timeout:5000}).status,0);assert.ok(lstatSync(fifo).isFIFO());
  fd=openSync(fifo,constants.O_RDWR|constants.O_NONBLOCK);
  driver=spawn('chromedriver',['--port='+port],{stdio:['ignore','pipe','pipe']});
  let startFailed=false;driver.on('error',()=>{startFailed=true;});driver.stdout.on('data',()=>{});driver.stderr.on('data',()=>{});
  let ready=false;for(let i=0;i<30&&!startFailed;i++){try{await rpc('GET','/status',undefined,500);ready=true;break;}catch{await pause(100);}}
  assert.ok(ready&&!startFailed);stopFlags=observeOwnRendererFlags(driver.pid);
  let pipe='',truncated=false,readFailed=false;const buffer=Buffer.alloc(8192);
  const drain=()=>{for(let i=0;i<64;i++){let n;try{n=readSync(fd,buffer,0,buffer.length,null);}catch(e){if(e.code==='EAGAIN')break;throw e;}if(!n)break;
   if(pipe.length+n>16*1024*1024){truncated=true;break;}pipe+=buffer.subarray(0,n).toString('utf8');}};
  pump=setInterval(()=>{try{drain();}catch{readFailed=true;}},10);
  const flags='--trace-opt --trace-file-names --redirect-code-traces --redirect-code-traces-to='+fifo;
  const created=await rpc('POST','/session',{capabilities:{alwaysMatch:{browserName:'chrome','goog:chromeOptions':{binary:'/usr/bin/chromium',args:['--headless=new','--no-sandbox','--no-first-run','--js-flags='+flags]}}}});
  session=created.sessionId;assert.equal(created.capabilities.browserVersion,'155.0.8059.0');
  await rpc('POST','/session/'+session+'/url',{url:'data:text/html,<title>synthetic-control</title>'});
  const result=await rpc('POST','/session/'+session+'/execute/sync',{script:'function svDiagnosticHotLoop(n){let x=0;for(let i=0;i<n;i++)x=(x+i)|0;return x}for(let j=0;j<200;j++)window.svTotal=svDiagnosticHotLoop(10000);return {completed:true,checksum:window.svTotal};\n//# sourceURL=sv-synthetic-opt.js',args:[]});
  await pause(500);drain();const rendererFlags=stopFlags();stopFlags=undefined;
  const recognized=summarizeSyntheticOptOutput(pipe,'').recognizedFunctionLinesStdout;
  const report={browserVersion:'155.0.8059.0',syntheticOnly:true,compilerFlagsDiagnosticOnly:true,namedPipeVerified:true,rawOutputExported:false,profileExported:false,
   fixtureCompleted:result.completed===true&&result.checksum===49995000,rendererFlags,pipeBytes:Buffer.byteLength(pipe),
   genericTraceLinesPipe:pipe.split(/\r?\n/).filter(line=>/\bJSFunction\b/.test(line)&&/marking|compiling|optimizing/.test(line)).length,
   recognizedFunctionLinesNamedPipe:recognized,readFailed,truncated};
  await mkdir('artifacts',{recursive:true});await writeFile('artifacts/opt-source-preflight.json',JSON.stringify(report,null,2));
  assert.ok(report.fixtureCompleted&&!readFailed&&!truncated);assert.ok(recognized>0);
  console.log('Own WebDriver checksum and known optimizer output verified; only fixed metadata exported.');
 }finally{
  if(session)try{await rpc('DELETE','/session/'+session,undefined,5000);}catch{}
  if(stopFlags)stopFlags();if(driver&&!driver.killed)driver.kill();if(pump)clearInterval(pump);if(fd!==undefined)closeSync(fd);
  assert.ok(directory.startsWith(path.join(tmpdir(),'sv-opt-source-')));await rm(directory,{recursive:true,force:true});
 }
}
await main().catch(()=>{console.error('Synthetic WebDriver optimizer preflight failed; raw errors omitted.');process.exitCode=1;});
