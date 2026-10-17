import assert from 'node:assert/strict';
import {spawnSync,spawn} from 'node:child_process';
import {constants,openSync,readSync,closeSync,lstatSync} from 'node:fs';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {summarizeSyntheticOptOutput} from './synthetic-opt-output.mjs';
async function main(){
 assert.equal(process.platform,'linux');
 const bin='/usr/bin/chromium';
 const version=spawnSync(bin,['--version'],{encoding:'utf8',timeout:5000});
 assert.ok(version.stdout.includes('155.0.8059.0'));
 const directory=await mkdtemp(path.join(tmpdir(),'sv-opt-source-'));
 let fd,pump;
 try{
  const fifo=path.join(directory,'compiler.pipe');
  assert.equal(spawnSync('mkfifo',['-m','600',fifo],{timeout:5000}).status,0);
  assert.ok(lstatSync(fifo).isFIFO());
  fd=openSync(fifo,constants.O_RDWR|constants.O_NONBLOCK);
  const html='<script>function svDiagnosticHotLoop(n){let x=0;for(let i=0;i<n;i++)x=(x+i)|0;return x}for(let j=0;j<200;j++)window.svTotal=svDiagnosticHotLoop(10000);document.title="synthetic-complete";</script>';
  const flags='--trace-opt --trace-file-names --redirect-code-traces --redirect-code-traces-to='+fifo;
  const child=spawn(bin,['--headless=new','--no-sandbox','--no-first-run','--no-default-browser-check',
   '--user-data-dir='+directory,'--enable-logging=stderr','--js-flags='+flags,'--dump-dom',
   'data:text/html,'+encodeURIComponent(html)],{stdio:['ignore','pipe','pipe']});
  let stdout='',stderr='',pipe='',size=0,truncated=false,startFailed=false;
  const append=(kind,text)=>{size+=text.length;if(size>16*1024*1024){truncated=true;child.kill();return;}
   if(kind==='stdout')stdout+=text;else if(kind==='stderr')stderr+=text;else pipe+=text;};
  child.stdout.on('data',chunk=>append('stdout',chunk.toString('utf8')));
  child.stderr.on('data',chunk=>append('stderr',chunk.toString('utf8')));
  child.on('error',()=>{startFailed=true;});
  const buffer=Buffer.alloc(8192);
  const drain=()=>{for(let i=0;i<64;i++){let n;try{n=readSync(fd,buffer,0,buffer.length,null);}catch(error){if(error.code==='EAGAIN')break;throw error;}
   if(!n)break;append('pipe',buffer.subarray(0,n).toString('utf8'));}};
  let readFailed=false;
  pump=setInterval(()=>{try{drain();}catch{readFailed=true;child.kill();}},10);
  const timer=setTimeout(()=>child.kill(),15000);
  const code=await new Promise(resolve=>child.once('close',resolve));clearTimeout(timer);clearInterval(pump);pump=undefined;drain();
  const counts=summarizeSyntheticOptOutput(stdout,stderr);
  const pipeCount=summarizeSyntheticOptOutput(pipe,'').recognizedFunctionLinesStdout;
  const report={browserVersion:'155.0.8059.0',syntheticOnly:true,compilerFlagsDiagnosticOnly:true,namedPipeVerified:true,
   rawOutputExported:false,profileExported:false,browserExitedSuccessfully:code===0&&!startFailed,
   fixtureCompleted:stdout.includes('<title>synthetic-complete</title>'),readFailed,truncated,...counts,recognizedFunctionLinesNamedPipe:pipeCount};
  await mkdir('artifacts',{recursive:true});await writeFile('artifacts/opt-source-preflight.json',JSON.stringify(report,null,2));
  assert.ok(report.browserExitedSuccessfully&&report.fixtureCompleted&&!readFailed&&!truncated);
  assert.ok(pipeCount>0);
  console.log('Synthetic function output captured through verified FIFO; only fixed counts exported.');
 }finally{
  if(pump)clearInterval(pump);if(fd!==undefined)closeSync(fd);
  assert.ok(directory.startsWith(path.join(tmpdir(),'sv-opt-source-')));await rm(directory,{recursive:true,force:true});
 }
}
await main().catch(()=>{console.error('Synthetic channel preflight failed; raw errors and output omitted.');process.exitCode=1;});
