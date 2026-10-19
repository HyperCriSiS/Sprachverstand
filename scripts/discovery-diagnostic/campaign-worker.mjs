import {mkdir} from 'node:fs/promises';
import path from 'node:path';
import {atomic,readJson,hashUrl,chooseNext} from './campaign-state.mjs';
import {normalizeUrl,scoreLink,parseRobots,robotsAllows} from './helpers.mjs';
import {compareProtectedRuns} from '../real-world-protected-state.mjs';
const root=path.resolve(process.env.CRAWL_OUTPUT||'artifacts/discovery-campaign'),id=Number(process.env.CRAWL_DOMAIN);
const file=root+'/states/'+id+'.json',state=await readJson(file,null);if(!state)throw Error('Missing domain assignment');
const limit=Number(process.env.CRAWL_MAX_SUBPAGES??50),deadline=Number(process.env.CRAWL_DEADLINE);
const save=async()=>{state.updatedAt=new Date().toISOString();await atomic(file,state);};
const {runSiteMode,stopDriver,driverProcess}=await import('../../artifacts/discovery-probe/browser-library.mjs');
function discover(result,url){
 const known=new Set([...state.visited.map(x=>x.url),...state.queue.map(x=>x.url),state.url]);
 for(const link of [...result.baseline.deepObservation?.final.links??[],...result.extension.deepObservation?.final.links??[]]){
  const next=normalizeUrl(link.url,url,state.domain);if(!next||known.has(next))continue;const score=scoreLink({...link,url:next});if(score<=0)continue;
  known.add(next);state.queue.push({url:next,score,text:link.text,discoveredOn:url});
 }
 state.queue.sort((a,b)=>b.score-a.score||a.url.localeCompare(b.url));state.queue=state.queue.slice(0,600);
}
async function permissions(url){
 const origin=new URL(url).origin;if(state.robots[origin])return state.robots[origin];
 try{
  const response=await fetch(origin+'/robots.txt',{signal:AbortSignal.timeout(15000),headers:{'User-Agent':'SprachverstandResearch/1.0'}});
  // Consume every response, including 404/403, before branching (Undici #5360).
  const text=await response.text();
  state.robots[origin]=[404,410].includes(response.status)?{rules:[],delay:1}:response.ok?parseRobots(text):{rules:[{path:'/',allow:false}],delay:1,error:'robots.txt HTTP '+response.status};
 }catch(e){state.robots[origin]={rules:[{path:'/',allow:false}],delay:1,error:e.message};}
 return state.robots[origin];
}
const compactMode=mode=>({status:mode.status,error:mode.error,elapsedMs:mode.elapsedMs,phasesMs:mode.phasesMs,scroll:mode.deepObservation?.scroll,final:mode.deepObservation?.final?{url:mode.deepObservation.final.url,title:mode.deepObservation.final.title,textLength:mode.deepObservation.final.textLength,evidence:mode.deepObservation.final.evidence}:null,observedOnly:mode.deepObservation?.observedOnly});
try{
 while(Date.now()<deadline){
  const entry=chooseNext(state,limit);if(!entry){state.complete=true;state.finishedAt=new Date().toISOString();await save();break;}
  const {url,isRoot}=entry;state.inflight=entry;await save();
  const robots=await permissions(url);
  if(!robotsAllows(robots,url)||robots.delay>120){state.errors.push({url,reason:robots.delay>120?'crawl-delay-over-limit':'robots-disallowed',details:robots.error});state.queue=state.queue.filter(x=>x.url!==url);state.inflight=null;if(isRoot){state.status='robots-skipped';state.complete=true;}await save();continue;}
  await new Promise(r=>setTimeout(r,robots.delay*1000));
  console.log(JSON.stringify({event:'page-start',domainId:id,domain:state.domain,url,pages:state.visited.length,at:new Date().toISOString()}));
  const site={id,slug:'d'+id+'-'+hashUrl(url),url,focus:'Öffentliche Real-Web-Diagnose'};
  const baseline=await runSiteMode(site,'baseline',0),extension=await runSiteMode(site,'extension',0);
  const status=baseline.status==='ok'&&extension.status==='ok'?'ok':'error';
  const accessProblem=[baseline,extension].some(x=>/just a moment|access denied|attention required|captcha|zugriff verweigert|403 forbidden|404 not found|seite nicht gefunden/i.test(x.deepObservation?.final.title??''));
  const report={schemaVersion:3,domain:state.domain,domainId:id,url,isRoot,status,accessProblem,completedAt:new Date().toISOString(),baseline:compactMode(baseline),extension:compactMode(extension),protection:compareProtectedRuns(baseline,extension)};
  const reportPath='pages/'+hashUrl(url)+'.json';await atomic(root+'/'+reportPath,report);
  if(!state.visited.some(x=>x.url===url))state.visited.push({url,isRoot,status,accessProblem,report:reportPath,completedAt:report.completedAt,residualCount:report.extension.final?.evidence.length??null,scroll:report.extension.scroll});
  state.queue=state.queue.filter(x=>x.url!==url);state.inflight=null;
  if(isRoot)state.status=accessProblem?'access-blocked':'root-complete';
  if(status==='ok'&&!accessProblem)discover({baseline,extension},url);
  await save();console.log(JSON.stringify({event:'page-done',domainId:id,url,status,accessProblem,pages:state.visited.length,at:state.updatedAt}));
  if(driverProcess.exitCode!==null)throw Error('WebDriver exited');
 }
}finally{await stopDriver(driverProcess);}
