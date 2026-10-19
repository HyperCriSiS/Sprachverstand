import {readFile,mkdir,open,appendFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {atomic,readJson,chooseNext,validateState,recordCrash} from './campaign-state.mjs';
const config=JSON.parse(await readFile('config/discovery-campaign/manifest.json'));
const batch=Number(process.env.CRAWL_BATCH),limit=Number(process.env.CRAWL_MAX_SUBPAGES??50);
if(!Number.isInteger(batch)||batch<1||batch>config.batches||!Number.isInteger(limit)||limit<0||limit>50)throw Error('Invalid campaign assignment');
const root=path.resolve('artifacts/discovery-campaign');await mkdir(root+'/states',{recursive:true});
const all=JSON.parse(await readFile('config/discovery-campaign/domains.json'));
const domains=all.slice((batch-1)*12,batch*12);
const seeds=await readJson('config/discovery-campaign/resume/batch-'+batch+'.json',[]);
for(const domain of domains){let state=await readJson(root+'/states/'+domain.id+'.json',null);if(state)validateState(state,domain);else {state=seeds.find(x=>x.id===domain.id)??{...domain,visited:[],queue:[],errors:[],robots:{},status:'pending',complete:false};validateState(state,domain);await atomic(root+'/states/'+domain.id+'.json',state);}}
const deadline=Date.now()+Number(process.env.CRAWL_BUDGET_MINUTES??230)*60000,active=new Map(),restarts=new Map();let systemicFailure=false;
const kill=child=>{try{process.kill(-child.pid,'SIGKILL');}catch{try{child.kill('SIGKILL');}catch{}}};
async function start(domain,slot){
 const log=await open(root+'/domain-'+domain.id+'.log','a');
 const child=spawn(process.execPath,['scripts/discovery-diagnostic/campaign-worker.mjs','--screenshots',root+'/screenshots'],{detached:true,env:{...process.env,CRAWL_OUTPUT:root,CRAWL_DOMAIN:String(domain.id),CRAWL_DEADLINE:String(deadline),DISCOVERY_DRIVER_PORT:String(9650+slot)},stdio:['ignore',log.fd,log.fd]});
 const task={domain,child,slot,started:Date.now(),done:false,code:null,error:null};active.set(domain.id,task);
 child.on('error',e=>{task.done=true;task.error=e.message;});child.on('exit',(code,signal)=>{task.done=true;task.code=code;task.signal=signal;});await log.close();
}
async function summary(){
 const states=await Promise.all(domains.map(x=>readJson(root+'/states/'+x.id+'.json',null)));
 const visits=states.flatMap(x=>x.visited),data={campaign:config.campaign,batch,runId:process.env.GITHUB_RUN_ID,attempt:process.env.GITHUB_RUN_ATTEMPT,updatedAt:new Date().toISOString(),plannedDomains:domains.length,completeDomains:states.filter(x=>x.complete).length,visitedUrls:visits.length,validPairs:visits.filter(x=>x.status==='ok').length,failedPairs:visits.filter(x=>x.status!=='ok').length,accessProblems:visits.filter(x=>x.accessProblem).length,importedPairs:visits.filter(x=>x.origin==='local-deep-2500').length,robotsSkippedDomains:states.filter(x=>x.status==='robots-skipped').length,activeWorkers:active.size,systemicFailure};
 await atomic(root+'/status.json',data);console.log('CRAWL_PROGRESS '+JSON.stringify(data));return data;
}
let lastLog=0;
try{
 while(true){
  for(const [id,task] of active){
   let state=await readJson(root+'/states/'+id+'.json',null);
   const last=Date.parse(state.updatedAt??'')||task.started;
   if(!task.done&&Date.now()-last>8*60000){task.error='Worker stalled beyond eight-minute page budget';kill(task.child);}
   if(!task.done)continue;
   kill(task.child);active.delete(id);state=await readJson(root+'/states/'+id+'.json',null);
   if(task.code!==0||task.error){recordCrash(state,task.error??`Worker exited ${task.code}, signal ${task.signal}`);await atomic(root+'/states/'+id+'.json',state);const n=(restarts.get(id)??0)+1;restarts.set(id,n);console.log('WORKER_RECOVERY '+JSON.stringify({id,restarts:n,error:state.workerErrors.at(-1)}));if(n>=8){systemicFailure=true;}}
  }
  if(systemicFailure||Date.now()>=deadline)break;
  const free=Array.from({length:12},(_,i)=>i).filter(i=>![...active.values()].some(t=>t.slot===i));
  let pending=false;
  for(const domain of domains){if(active.has(domain.id))continue;const state=await readJson(root+'/states/'+domain.id+'.json',null);if(state.complete)continue;pending=true;if(free.length)await start(domain,free.shift());}
  if(Date.now()-lastLog>=60000){await summary();lastLog=Date.now();}
  if(!active.size&&!pending)break;
  await new Promise(r=>setTimeout(r,1000));
 }
}finally{for(const task of active.values())kill(task.child);active.clear();}
const final=await summary();
await atomic(root+'/provenance.json',{...config,workflowCommit:process.env.GITHUB_SHA,node:process.version,baseline:config.productBaseline,workers:12,maxSubpages:limit,build:await readJson('artifacts/discovery-probe/provenance.json',null)});
if(final.completeDomains!==final.plannedDomains){console.error('Incomplete batch preserved for resume');process.exitCode=1;}
