import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {readFileSync,readdirSync,readlinkSync,statSync,accessSync,constants,openSync,readSync,closeSync,createReadStream} from 'node:fs';
import {mkdtemp,cp,mkdir,writeFile,rm,chmod,readdir,lstat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fetchWebdriverResponse} from './webdriver-response.mjs';
import {matchesOwnedRenderer} from './system-cache-renderer-match.mjs';

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function executable(variable,names){
 const configured=process.env[variable];
 if(configured){if(statSync(configured).isFile())return configured;
  for(const name of names){const candidate=path.join(configured,name);try{if(statSync(candidate).isFile())return candidate;}catch{}}
 }
 for(const name of names){const found=spawnSync('which',[name],{encoding:'utf8'});if(found.status===0&&found.stdout.trim())return found.stdout.trim();}
 throw Error('preflight-executable-unavailable');
}
function version(input){const text=String(input??'').split(' ')[0];return /^\d+\.\d+\.\d+\.\d+$/u.test(text)?text:'unknown';}
function ownRenderers(rootPid,rootStart){
 const safe=file=>{try{return readFileSync(file,'utf8');}catch{return null;}};
 const start=pid=>{const line=safe(`/proc/${pid}/stat`);return line?.slice(line.lastIndexOf(')')+2).split(/\s+/)[19];};
 if(start(rootPid)!==rootStart)throw Error('preflight-driver-identity-changed');
 const pending=[rootPid],seen=new Set(),records=[];
 const discovery={ownProcesses:0,rendererArgumentMatches:0,rendererCommMatches:0,commandLineUnavailable:0,childListsUnavailable:0};
 while(pending.length){
  const pid=pending.shift();if(seen.has(pid))continue;seen.add(pid);
  if(seen.size>256)throw Error('preflight-process-cap');
  const identity=start(pid);if(!identity)continue;
  const command=safe(`/proc/${pid}/cmdline`);
  const comm=safe(`/proc/${pid}/comm`)?.trim();
  const {argumentMatch,commMatch}=matchesOwnedRenderer(command,comm);
  discovery.ownProcesses++;
  if(command===null)discovery.commandLineUnavailable++;
  if(argumentMatch)discovery.rendererArgumentMatches++;
  if(commMatch)discovery.rendererCommMatches++;
  if(argumentMatch||commMatch){
   try{
    const target=readlinkSync(`/proc/${pid}/exe`),metadata=statSync(target);
    let writable=false;try{accessSync(target,constants.W_OK);writable=true;}catch{}
    if(start(pid)===identity)records.push({target,ownerMatches:metadata.uid===process.getuid(),writable,regularFile:metadata.isFile()});
   }catch{throw Error('preflight-renderer-executable-unavailable');}
  }
  let tasks=[];try{tasks=readdirSync(`/proc/${pid}/task`);}catch{}
  if(tasks.length>2048)throw Error('preflight-thread-cap');
  for(const tid of tasks){const children=safe(`/proc/${pid}/task/${tid}/children`);
   if(children===null)discovery.childListsUnavailable++;
   if(children?.trim())pending.push(...children.trim().split(/\s+/).map(Number).filter(n=>Number.isSafeInteger(n)&&n>0));}
 }
 return {records,discovery};
}



assert.equal(process.platform,'linux');assert.equal(process.env.GITHUB_ACTIONS,'true');
const report={schemaVersion:1,diagnosticCopyOnly:true,additionalPrivilegesUsed:false,systemWideCacheControlUsed:false,pathsExported:false,processIdentifiersExported:false,rawProfilesExported:false};
let stage='source-session',driver,session,directory;
async function api(method,route,body){
 const response=await fetchWebdriverResponse('http://127.0.0.1:9515'+route,{method,...(body===undefined?{}:{headers:{'content-type':'application/json'},body:JSON.stringify(body)})},60000);
 if(!response.ok)throw Error('webdriver request failed');const r=JSON.parse(response.text);if(r.value?.error)throw Error('webdriver command failed');return r.value;
}
async function create(binary){const r=await api('POST','/session',{capabilities:{alwaysMatch:{browserName:'chrome',timeouts:{implicit:0,pageLoad:20000,script:15000},'goog:chromeOptions':{binary,args:['--headless=new','--no-sandbox','--disable-dev-shm-usage','--no-first-run','--disable-default-apps','--mute-audio']}}}});session=r.sessionId;assert.equal(r.capabilities.browserVersion,'155.0.8059.0');report.browserVersion=r.capabilities.browserVersion;return r;}
async function hash(file){const h=createHash('sha256');for await(const chunk of createReadStream(file))h.update(chunk);return h.digest('hex');}
async function inventory(dir){let count=0,bytes=0;const pending=[dir];while(pending.length){const parent=pending.pop();for(const entry of await readdir(parent,{withFileTypes:true})){const p=path.join(parent,entry.name),s=await lstat(p);if(s.isSymbolicLink())continue;if(s.isDirectory())pending.push(p);else if(s.isFile()){count++;bytes+=s.size;}assert.ok(count<=4096&&bytes<=2*1024**3);}}return {count,bytes};}
async function stripSpecialModes(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,entry.name),s=await lstat(p);if(s.isSymbolicLink())continue;if(s.isDirectory())await stripSpecialModes(p);else if(s.isFile()&&(s.mode&0o6000))await chmod(p,s.mode&0o777);}}
try{
 driver=spawn(executable('CHROMEWEBDRIVER',['chromedriver']),['--port=9515'],{stdio:'ignore'});let startFailed=false;driver.on('error',()=>{startFailed=true;});
 for(let n=0;;n++){assert.ok(!startFailed&&driver.exitCode===null&&n<30);try{await api('GET','/status');break;}catch{await sleep(100);}}
 const raw=readFileSync('/proc/'+driver.pid+'/stat','utf8'),driverStart=raw.slice(raw.lastIndexOf(')')+2).split(/\s+/)[19];
 await create(executable('CHROMIUM_BIN',['chromium','chromium-browser']));
 await api('POST','/session/'+session+'/url',{url:'data:text/html,<title>Synthetic source binding</title>'});
 const original=ownRenderers(driver.pid,driverStart).records;assert.ok(original.length>0);const files=[...new Set(original.map(r=>r.target))];assert.equal(files.length,1);
 const source=files[0],sourceDir=path.dirname(source);assert.match(source,/^\/(?:opt|usr)\//);assert.match(path.basename(source),/^(chrome|chromium|chromium-browser)$/);assert.ok(!['/usr/bin','/usr/local/bin','/opt','/usr'].includes(sourceDir));
 await api('DELETE','/session/'+session);session=undefined;
 stage='copy';directory=await mkdtemp(path.join(tmpdir(),'sv-owned-browser-copy-'));const targetDir=path.join(directory,'distribution'),target=path.join(targetDir,path.basename(source));
 const size=await inventory(sourceDir);report.copiedFiles=size.count;report.copiedBytes=size.bytes;
 const sourceHash=await hash(source);assert.equal(sourceHash,'fe5a683855bb91f3bf5a5496ca2fe7e4c4511673e66605efcbf64c74db88a944');await cp(sourceDir,targetDir,{recursive:true,errorOnExist:true,force:false});await stripSpecialModes(targetDir);
 const originalStat=statSync(source),copyStat=statSync(target);assert.equal(copyStat.uid,process.getuid());assert.equal(copyStat.nlink,1);assert.ok(copyStat.dev!==originalStat.dev||copyStat.ino!==originalStat.ino);
 assert.equal(await hash(target),sourceHash);assert.equal(await hash(source),sourceHash);report.ownedCopyVerified=true;report.sourceAndCopyHashEqual=true;report.sourceBinarySha256=sourceHash;
 stage='compile-helper';const helper=path.join(directory,'residency-probe');const compiled=spawnSync('gcc',['-O2','-Wall','-Wextra','-Werror','scripts/probe-owned-file-residency.c','-o',helper],{stdio:'ignore',timeout:30000});assert.equal(compiled.status,0);
 const run=args=>{const r=spawnSync(helper,args,{encoding:'utf8',timeout:5000,maxBuffer:1024});assert.equal(r.status,0);return r.stdout.trim();};
 assert.equal(run(['--self-test']),'owned-file mincore untouched/touched controls passed');report.probeSelfTestPassed=true;
 stage='cold-control';const offset=1024*1024;assert.ok(copyStat.size>offset+4096);
 assert.equal(run(['--discard-owned',target]),'owned-file discard requested');assert.equal(run([target,offset.toString(16)]),'0');report.coldProbeVerified=true;
 const fd=openSync(target,'r');try{assert.equal(readSync(fd,Buffer.alloc(4096),0,4096,offset),4096);}finally{closeSync(fd);}
 assert.equal(run([target,offset.toString(16)]),'1');report.positiveReadControlVerified=true;
 assert.equal(run(['--discard-owned',target]),'owned-file discard requested');assert.equal(run([target,offset.toString(16)]),'0');report.coldResetVerified=true;
 stage='copy-session';await create(target);await api('POST','/session/'+session+'/url',{url:'data:text/html,<title>Synthetic copy binding</title>'});
 const value=await api('POST','/session/'+session+'/execute/sync',{script:'return 4242;',args:[]});assert.equal(value,4242);report.copyScriptVerified=true;
 const copied=ownRenderers(driver.pid,driverStart).records;assert.ok(copied.length>0);assert.ok(copied.every(r=>r.target===target&&r.ownerMatches&&r.regularFile));report.allRendererExecutablesAreOwnCopy=true;report.rendererCount=copied.length;
 if(process.env.RUN_NATIVE_COPY_PAIR==='true'){
  stage='native-pair';const state=process.env.COPY_CACHE_STATE;assert.ok(['cold','warm'].includes(state));report.declaredCacheState=state;
  await api('DELETE','/session/'+session);session=undefined;
  driver.kill('SIGTERM');await Promise.race([new Promise(resolve=>driver.once('exit',resolve)),sleep(2000)]);if(driver.exitCode===null){driver.kill('SIGKILL');await new Promise(resolve=>driver.once('exit',resolve));}driver=undefined;
  const native=spawnSync(process.execPath,['scripts/system-io-runner.mjs','--browser','chromium','--fps','60','--focused-start'],{env:{...process.env,CHROMIUM_BIN:target,FILE_CACHE_PROBE:helper,OWNED_BINARY_SHA256:sourceHash},stdio:'pipe',maxBuffer:4*1024*1024,timeout:360000});
  report.nativeExitCode=Number.isSafeInteger(native.status)?native.status:255;report.nativePairCompleted=native.status===0;assert.equal(native.status,0);
 }
 report.completed=true;
}catch{report.completed=false;report.failedAt=stage;process.exitCode=1;}
finally{
 if(session)try{await api('DELETE','/session/'+session);}catch{report.cleanupFailed=true;process.exitCode=1;}
 if(driver&&driver.exitCode===null){driver.kill('SIGTERM');await Promise.race([new Promise(resolve=>driver.once('exit',resolve)),sleep(2000)]);if(driver.exitCode===null)driver.kill('SIGKILL');}
 if(directory){assert.equal(path.dirname(directory),tmpdir());assert.match(path.basename(directory),/^sv-owned-browser-copy-/);await rm(directory,{recursive:true,force:true});}
}
await mkdir('artifacts/owned-browser-copy-preflight',{recursive:true});await writeFile('artifacts/owned-browser-copy-preflight/summary.json',JSON.stringify(report,null,2),{flag:'wx'});
console.log(JSON.stringify(report));

