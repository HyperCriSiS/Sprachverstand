import {spawn,spawnSync} from 'node:child_process';
import {readFileSync,readdirSync,readlinkSync,statSync,accessSync,constants} from 'node:fs';
import {mkdir,writeFile} from 'node:fs/promises';
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
    if(start(pid)===identity)records.push({ownerMatches:metadata.uid===process.getuid(),writable,regularFile:metadata.isFile()});
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
if(process.platform!=='linux'||process.env.GITHUB_ACTIONS!=='true')throw Error('preflight-linux-actions-only');
const driver=spawn(executable('CHROMEWEBDRIVER',['chromedriver']),['--port=9515'],{stdio:'ignore'});
let startupError=false;driver.on('error',()=>{startupError=true;});
let session,report;
async function api(method,route,body){
 const response=await fetchWebdriverResponse('http://127.0.0.1:9515'+route,{method,
  ...(body===undefined?{}:{headers:{'content-type':'application/json'},body:JSON.stringify(body)})},60000);
 if(!response.ok)throw Error('preflight-webdriver-request-failed');
 let result;try{result=JSON.parse(response.text);}catch{throw Error('preflight-webdriver-malformed-response');}
 if(result.value?.error)throw Error('preflight-webdriver-error');
 return result;
}
try{
 const deadline=Date.now()+15000;
 while(true){
  if(startupError||driver.exitCode!==null)throw Error('preflight-driver-start-failed');
  try{await api('GET','/status');break;}catch{if(Date.now()>deadline)throw Error('preflight-driver-start-timeout');await sleep(100);}
 }
 const driverStat=readFileSync(`/proc/${driver.pid}/stat`,'utf8');
 const driverStart=driverStat.slice(driverStat.lastIndexOf(')')+2).split(/\s+/)[19];
 const response=await api('POST','/session',{capabilities:{alwaysMatch:{browserName:'chrome',
  timeouts:{implicit:0,pageLoad:20000,script:15000},'goog:chromeOptions':{
   binary:executable('CHROMIUM_BIN',['chromium','chromium-browser']),
   args:['--headless=new','--no-sandbox','--disable-dev-shm-usage','--no-first-run','--disable-default-apps','--mute-audio']}}}});
 session=response.value?.sessionId??response.sessionId;
 if(typeof session!=='string'||!session)throw Error('preflight-session-missing');
 const caps=response.value?.capabilities??response.capabilities;
 await api('POST',`/session/${session}/url`,{url:'data:text/html,<title>Owned cache preflight</title><p>Synthetic</p>'});
 const {records,discovery}=ownRenderers(driver.pid,driverStart);
 if(!records.length){console.log(JSON.stringify({preflightDiscovery:discovery}));throw Error('preflight-owned-renderer-missing');}
 report={schemaVersion:1,browserVersion:version(caps?.browserVersion),driverVersion:version(caps?.chrome?.chromedriverVersion),
  rendererCount:records.length,allRegularFiles:records.every(r=>r.regularFile),
  allExecutableOwnersMatch:records.every(r=>r.ownerMatches),allExecutablesWritable:records.every(r=>r.writable),
  existingOwnedProbeEligible:records.every(r=>r.ownerMatches&&r.regularFile),
  additionalPrivilegesUsed:false,fileContentsRead:false,processIdentifiersExported:false,pathsExported:false};
}finally{
 if(session)try{await api('DELETE',`/session/${session}`);}catch{}
 if(driver.exitCode===null){driver.kill('SIGTERM');await Promise.race([new Promise(resolve=>driver.once('exit',resolve)),sleep(2000)]);if(driver.exitCode===null)driver.kill('SIGKILL');}
}
await mkdir('artifacts/system-cache-preflight',{recursive:true});
await writeFile('artifacts/system-cache-preflight/summary.json',JSON.stringify(report,null,2),{flag:'wx'});
console.log(JSON.stringify(report));
