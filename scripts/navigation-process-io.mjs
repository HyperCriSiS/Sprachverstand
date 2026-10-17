import {fork} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {epochNow,parseProcStat} from './navigation-process-io-worker.mjs';
export {epochNow};
const kinds=['driver','browser','renderer','gpu','utility','other'];
const valid=n=>Number.isSafeInteger(n)&&n>=0;
export function summarizeProcessIo(samples,phases,clock){
 if(!Number.isFinite(clock.offset)||!Number.isFinite(clock.uncertainty)||clock.uncertainty<0||clock.uncertainty>250)throw Error('Invalid clock binding');
 const result={schemaVersion:1,rawSamplesExported:false,processIdentifiersExported:false,pathsExported:false,exactFaultFileIdentified:false,clockUncertaintyMs:clock.uncertainty,phases:[]};
 for(const phase of phases){
  if(!['session','navigation','validation'].includes(phase.name)||!Number.isFinite(phase.start)||!Number.isFinite(phase.end)||phase.end<phase.start)throw Error('Invalid phase');
  const selected=samples.filter(s=>s.before-clock.offset-clock.uncertainty>=phase.start&&s.after-clock.offset+clock.uncertainty<=phase.end);
  const row={name:phase.name,durationMs:phase.end-phase.start,sampleCount:selected.length,samplerCpuUs:0,maximumSampleWallMs:0,inaccessible:0,unstable:0,classes:[]};
  for(const sample of selected){row.samplerCpuUs+=sample.samplerCpuUs??0;row.maximumSampleWallMs=Math.max(row.maximumSampleWallMs,sample.after-sample.before);row.inaccessible+=sample.inaccessible??0;row.unstable+=sample.unstable??0;}
  for(const kind of kinds){
   const counters={kind,observations:0,readBytesDelta:0,readIntervals:0,unknownReadObservations:0,majorFaultsDelta:0,cpuTicksDelta:0,counterIntervals:0,counterResets:0,mainThreadFolioSamples:0,unknownWaitObservations:0};const prior=new Map();
   for(const sample of selected)for(const entry of sample.records.filter(r=>r.kind===kind)){
    counters.observations++;if(entry.folioWait===true)counters.mainThreadFolioSamples++;else if(entry.folioWait===null)counters.unknownWaitObservations++;
    if(!valid(entry.readBytes))counters.unknownReadObservations++;
    const key=entry.pid+'/'+entry.startToken,previous=prior.get(key);prior.set(key,entry);
    if(!previous)continue;
    if(valid(entry.readBytes)&&valid(previous.readBytes)){if(entry.readBytes>=previous.readBytes){counters.readBytesDelta+=entry.readBytes-previous.readBytes;counters.readIntervals++;}else counters.counterResets++;}
    if(valid(entry.majorFaults)&&valid(previous.majorFaults)&&valid(entry.cpuTicks)&&valid(previous.cpuTicks)&&entry.majorFaults>=previous.majorFaults&&entry.cpuTicks>=previous.cpuTicks){counters.majorFaultsDelta+=entry.majorFaults-previous.majorFaults;counters.cpuTicksDelta+=entry.cpuTicks-previous.cpuTicks;counters.counterIntervals++;}
   }
   row.classes.push(counters);
  }
  result.phases.push(row);
 }
 return result;
}
export async function startProcessIoMonitor(pid){
 const identity=parseProcStat(readFileSync(`/proc/${pid}/stat`,'utf8'));if(!identity)throw Error('Driver identity missing');
 const worker=fork(fileURLToPath(new URL('./navigation-process-io-worker.mjs',import.meta.url)),[],{silent:true,env:{...process.env,NAV_IO_WORKER:'1'}});
 worker.stdout.on('data',()=>{});worker.stderr.on('data',()=>{});let failed=false;worker.on('error',()=>{failed=true;});
 worker.on('message',m=>{if(m?.type==='error')failed=true;});
 const receive=type=>new Promise((resolve,reject)=>{const done=message=>{if(message?.type===type){clearTimeout(timer);worker.off('message',done);resolve(message);}else if(message?.type==='error'){clearTimeout(timer);worker.off('message',done);reject(Error('Process sampler failed'));}};const timer=setTimeout(()=>{worker.off('message',done);reject(Error('Process sampler deadline'));},5000);worker.on('message',done);});
 try{
  let response=receive('ready');worker.send({type:'init',pid,startToken:identity.startToken});await response;
  const sent=epochNow();response=receive('sync');worker.send({type:'sync'});const sync=await response,received=epochNow();
  const low=sync.sent-received,high=sync.received-sent;if(high<low)throw Error('Sampler clock mismatch');const clock={offset:(low+high)/2,uncertainty:(high-low)/2};
  let browserModeSamples=[];
  return {modeEvidence(){return {present:browserModeSamples.filter(r=>r.extensionLoad===true).length,absent:browserModeSamples.filter(r=>r.extensionLoad===false).length,unknown:browserModeSamples.filter(r=>r.extensionLoad===null).length,directPresent:browserModeSamples.filter(r=>r.directDriverChild&&r.extensionLoad===true).length,directAbsent:browserModeSamples.filter(r=>r.directDriverChild&&r.extensionLoad===false).length,directUnknown:browserModeSamples.filter(r=>r.directDriverChild&&r.extensionLoad===null).length};},modeBound(expectedAddon){return browserModeSamples.length>0&&browserModeSamples.every(record=>record.extensionLoad===expectedAddon);},async stop(phases){try{if(failed)throw Error('Process sampler failed');const result=receive('result');worker.send({type:'stop'});const raw=await result;browserModeSamples=raw.samples.flatMap(sample=>sample.records).filter(record=>record.kind==="browser");if(raw.samples.length>1800)throw Error('Unbounded samples');return summarizeProcessIo(raw.samples,phases,clock);}finally{if(worker.connected)worker.disconnect();if(worker.exitCode===null&&!worker.signalCode)worker.kill('SIGTERM');}}};
 }catch(error){if(worker.connected)worker.disconnect();worker.kill('SIGTERM');throw error;}
}
