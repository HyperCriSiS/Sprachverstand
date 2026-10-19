import {readFile,writeFile,mkdir,open,appendFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
const dir='artifacts/discovery-probe';await mkdir(dir,{recursive:true});
const sites=JSON.parse(await readFile('config/discovery-runner-probe.json','utf8'));
const targetWorkers=Number(process.env.DISCOVERY_TEST_WORKERS??8);
if(![8,12,16].includes(targetWorkers))throw new Error('Unsupported target worker count');
const cpuTotals=()=>os.cpus().reduce((a,c)=>({idle:a.idle+c.times.idle,total:a.total+Object.values(c.times).reduce((n,v)=>n+v,0)}),{idle:0,total:0});
let previous=cpuTotals(),phase='setup';const samples=[];
const timer=setInterval(async()=>{const now=cpuTotals(),delta=now.total-previous.total;const cpu=delta?100*(1-(now.idle-previous.idle)/delta):0;previous=now;let available=os.freemem();if(process.platform==='linux'){try{const m=(await readFile('/proc/meminfo','utf8')).match(/^MemAvailable:\s+(\d+) kB/m);if(m)available=Number(m[1])*1024;}catch{}}
 samples.push({at:new Date().toISOString(),phase,cpuPercent:cpu,availableMemoryBytes:available,totalMemoryBytes:os.totalmem()});},1000);
const phases=[];const active=new Set();let timedOut=false;
const deadline=setTimeout(()=>{timedOut=true;for(const child of active){try{if(process.platform==='linux')process.kill(-child.pid,'SIGTERM');else child.kill();}catch{}}},50*60*1000);
try{
 for(const [workers,label] of [[4,'workers4-a'],[targetWorkers,'workers'+targetWorkers+'-a'],[targetWorkers,'workers'+targetWorkers+'-b'],[4,'workers4-b']]){
  phase=label;const name=phase,started=Date.now();await mkdir(dir+'/'+name,{recursive:true});let childFailures=0;
  const tasks=[];
  for(let i=0;i<workers;i++){
   const log=await open(dir+'/'+name+'/worker-'+i+'.log','w');
   const child=spawn(process.execPath,['scripts/discovery-diagnostic/worker.mjs','--screenshots',path.resolve(dir+'/'+name+'/screenshots')],{detached:process.platform==='linux',windowsHide:true,env:{...process.env,DISCOVERY_PHASE:name,DISCOVERY_WORKER:String(i),DISCOVERY_WORKERS:String(workers),DISCOVERY_DRIVER_PORT:String(9610+i)},stdio:['ignore',log.fd,log.fd]});active.add(child);
   tasks.push(new Promise(resolve=>{let spawnError;child.on('error',e=>{spawnError=e;});child.on('close',async code=>{active.delete(child);await log.close();if(code!==0||spawnError)childFailures++;resolve();});}));
  }
  await Promise.all(tasks);const elapsedMs=Date.now()-started;const results=[];
  for(let i=0;i<workers;i++){try{results.push(...JSON.parse(await readFile(dir+'/'+name+'/worker-'+i+'.json','utf8')));}catch{}}
  results.sort((a,b)=>a.id-b.id);
  const crashes=results.flatMap(x=>[x.baseline.error,x.extension.error]).filter(x=>x&&/tab crashed|session deleted|browser has closed|disconnected|invalid session/i.test(x));
  const valid=results.filter(x=>x.baseline.status==='ok'&&x.extension.status==='ok').length;
  const accessProblems=results.filter(x=>[x.baseline.deepObservation?.final.title,x.extension.deepObservation?.final.title].some(t=>/just a moment|access denied|attention required|captcha|403 forbidden|404 not found/i.test(t??''))).length;
  const ownSamples=samples.filter(x=>x.phase===name),cpu=ownSamples.map(x=>x.cpuPercent).sort((a,b)=>a-b);
  const data={name,workers,elapsedMs,expected:sites.length,completed:results.length,uniqueIds:new Set(results.map(x=>x.id)).size,validPairs:valid,accessProblems,childFailures,crashes:crashes.length,pairsPerMinute:valid/(elapsedMs/60000),minimumAvailableMemoryGiB:ownSamples.length?Math.min(...ownSamples.map(x=>x.availableMemoryBytes))/1024**3:null,medianCpuPercent:cpu[Math.floor(cpu.length/2)]??null};
  phases.push(data);await writeFile(dir+'/'+name+'/report.json',JSON.stringify({environment:{node:process.version,platform:process.platform,logicalCpus:os.cpus().length},summary:data,results},null,2));
  console.log(JSON.stringify(data));if(timedOut||childFailures)break;
 }
}finally{clearInterval(timer);clearTimeout(deadline);await writeFile(dir+'/resource-samples.json',JSON.stringify(samples));}
const aggregate=[4,targetWorkers].map(workers=>{const rows=phases.filter(x=>x.workers===workers);const elapsedMs=rows.reduce((n,x)=>n+x.elapsedMs,0),validPairs=rows.reduce((n,x)=>n+x.validPairs,0);return {workers,blocks:rows.length,elapsedMs,validPairs,pairsPerMinute:validPairs/(elapsedMs/60000),minimumAvailableMemoryGiB:rows.length?Math.min(...rows.map(x=>x.minimumAvailableMemoryGiB)):null};});
const structural=phases.length===4&&phases.every(x=>x.completed===sites.length&&x.uniqueIds===sites.length&&!x.childFailures&&!x.crashes);
const health=structural&&phases.every(x=>x.validPairs>=Math.ceil(sites.length*.9)&&x.accessProblems<=Math.floor(sites.length*.25)&&x.minimumAvailableMemoryGiB>=1);
const speedup=aggregate.every(x=>x.blocks===2)?aggregate[0].elapsedMs/aggregate[1].elapsedMs:null;
const result={schemaVersion:2,generatedAt:new Date().toISOString(),oneRunner:true,baselineWorkers:4,testedWorkers:targetWorkers,logicalCpus:os.cpus().length,totalMemoryGiB:os.totalmem()/1024**3,phases,aggregate,timedOut,structurallyComplete:structural,loadProbePassed:health,speedup,qualification:health?targetWorkers+' Worker technisch bestanden; Durchsatzgewinn gegenüber vier Workern separat bewerten.':'Belastungsprobe nicht bestanden oder unvollständig; keine Freigabe für große Verteilung.',note:'Gleiche 16 öffentliche URLs je Block, frische Browsersitzungen; gegenbalancierte Reihenfolge 4–'+targetWorkers+'–'+targetWorkers+'–4 Worker. Je 32 URL-Vergleiche pro Konfiguration. Netzwerk-/Seitenänderungen können die Geschwindigkeitsmessung beeinflussen. Keine Produktkorrekturen.'};
await writeFile(dir+'/benchmark.json',JSON.stringify(result,null,2));
const md=['# Ein-Runner-Belastungsprobe','',`Runner: ${os.cpus().length} logische CPUs; ${(os.totalmem()/1024**3).toFixed(1)} GiB RAM.`,`Status: ${result.qualification}`,`Gemessener Durchsatzfaktor: ${speedup?.toFixed(2)??'nicht verfügbar'}×`,'','| Phase | Dauer min | Vollständig | Gültige Paare | Absturzindikatoren | Min. verfügbarer RAM GiB | Median CPU % |','| --- | ---: | ---: | ---: | ---: | ---: | ---: |',...phases.map(x=>`| ${x.name} (${x.workers} Worker) | ${(x.elapsedMs/60000).toFixed(2)} | ${x.completed}/${x.expected} | ${x.validPairs} | ${x.crashes} | ${x.minimumAvailableMemoryGiB?.toFixed(2)} | ${x.medianCpuPercent?.toFixed(1)} |`),'',result.note,''].join('\n');
await writeFile(dir+'/benchmark.md',md);if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,md);
console.log(JSON.stringify(result));if(!health)process.exitCode=1;
