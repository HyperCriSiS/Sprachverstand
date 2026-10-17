import {summarizeIoObservation} from './owned-io-observation.mjs';
import path from 'node:path';
// Raw diagnostics exist in process memory only. Every exported field is listed here.
const traces=new Map(),names=new Set(['V8.OptimizeCode','V8.OptimizeBackground','V8.GC_TIME_TO_SAFEPOINT','V8.GC_MARK_COMPACTOR','V8.GC_SCAVENGER']);
const number=n=>Number.isFinite(n)?n:null;
function phaseTotals(events){return [...names].map(name=>{const list=events.filter(e=>e.name===name);return {name,count:list.length,maximumWallMs:list.length?Math.max(...list.map(e=>e.dur/1000)):0,maximumCpuMs:list.length?Math.max(...list.map(e=>(e.tdur??0)/1000)):0};});}
export function summarizeOwnedTrace(filename,text){
 const parsed=JSON.parse(text),events=parsed.traceEvents??parsed;
 if(!Array.isArray(events))throw Error('Synthetic trace shape missing');
 const phases=events.filter(e=>names.has(e.name)&&Number.isFinite(e.dur)&&e.dur>=0).map(e=>({name:e.name,ts:e.ts,dur:e.dur,tdur:e.tdur,pid:e.pid,tid:e.tid}));
 traces.set(path.basename(filename),phases);
 return JSON.stringify({type:'synthetic-owned-browser-phase-aggregates',rawTraceExported:false,phases:phaseTotals(phases)},null,2);
}
function role(r){
 const samples=r.rendererMonitor?.samples??[],phases=traces.get(path.basename(r.traceFile??''))??[];
 const counts={stablePteAbsentCacheUnavailable:0,stablePteAbsentCacheResident:0,stablePteAbsentCacheNotResident:0,stablePtePresent:0,unstable:0,cacheProbeSamples:0,cacheProbeMaximumWallMs:0,mainAbsentCacheNotResident:0,workerAbsentCacheNotResident:0,workerAbsentCacheNotResidentInsideCompiler:0};
 for(const s of samples)for(const t of s.threads){const n=t.nativeLocation;if(!n||n.status!=='sampled')continue;
  if(n.fileCachePage?.status==='sampled'){counts.cacheProbeSamples++;counts.cacheProbeMaximumWallMs=Math.max(counts.cacheProbeMaximumWallMs,n.fileCachePage.probeWallMs);}
  if(n.sampleStable!==true){counts.unstable++;continue;}
  if(n.instructionPage?.status!=='sampled')continue;
  if(n.instructionPage.present){counts.stablePtePresent++;continue;}
  if(n.fileCachePage?.status!=='sampled'){counts.stablePteAbsentCacheUnavailable++;continue;}
  if(n.fileCachePage.resident){counts.stablePteAbsentCacheResident++;continue;}
  counts.stablePteAbsentCacheNotResident++;
  if(t.pid===t.tid)counts.mainAbsentCacheNotResident++;else{
   counts.workerAbsentCacheNotResident++;
   const clock=r.traceClock,begin=s.beforeEpochMs-r.timeOriginEpochMs,end=s.afterEpochMs-r.timeOriginEpochMs;
   if(clock&&phases.some(e=>e.name==='V8.OptimizeBackground'&&e.pid===t.pid&&e.tid===t.tid&&begin>e.ts/1000+clock.offsetMs+clock.uncertaintyMs&&end<(e.ts+e.dur)/1000+clock.offsetMs-clock.uncertaintyMs))counts.workerAbsentCacheNotResidentInsideCompiler++;
  }
 }
 const tasks=r.longTasks??[],first=samples[0],last=samples.at(-1),span=first&&last?last.afterEpochMs-first.beforeEpochMs:null;
 return {diagnosticComplete:Boolean(r.nativeTraceSchedule)&&!r.nativeTraceSchedule.error&&Boolean(r.rendererMonitor)&&!(r.rendererMonitor.errors?.length)&&samples.length>0,clockUncertaintyMs:number(r.traceClock?.uncertaintyMs),allCallbackFramesFocused:Array.isArray(r.frameSamples)&&r.frameSamples.length>0&&r.frameSamples.every(f=>typeof f.focusedAtFrame==="boolean")?r.frameSamples.every(f=>f.focusedAtFrame):null,allCallbackFramesVisible:Array.isArray(r.frameSamples)&&r.frameSamples.length>0&&r.frameSamples.every(f=>typeof f.visibilityAtFrame==="string")?r.frameSamples.every(f=>f.visibilityAtFrame==="visible"):null,ioObservation:summarizeIoObservation(r.rendererMonitor),browserVersion:/^\d+\.\d+\.\d+\.\d+$/.test(r.browserVersion??'')?r.browserVersion:null,visible:r.visibilityState==='visible',focused:r.focused===true,correctDynamicTexts:number(r.dynamicCompletion?.correct),expectedDynamicTexts:number(r.dynamicCompletion?.expected),drops:number(r.droppedVideoFrames),maximumCallbackGapMs:number(r.frames?.maximumGapMs),pageLongTaskCount:tasks.length,pageLongTaskMaximumMs:tasks.length?number(Math.max(...tasks.map(t=>t.durationMs??t.duration??t.dauerMs??NaN))):0,monitorSampleCount:samples.length,monitorSpanMs:number(span),parentMonitorCpuUs:samples.reduce((s,e)=>s+(e.monitorCpuUs??0),0),childProbeCpuExcluded:true,phaseTotals:phaseTotals(phases),residency:counts};
}
export function summarizeOwnedReport(text){
 const r=JSON.parse(text);
 if(r.baseline&&r.extension)return JSON.stringify({type:'synthetic-system-io-pair-aggregates',rawDiagnosticsExported:false,baseline:role(r.baseline),extension:role(r.extension)},null,2);
 if(typeof r.cueCount==='number')return JSON.stringify({type:'synthetic-subtitle-aggregates',rawDiagnosticsExported:false,cueCount:number(r.cueCount),correctedCues:number(r.correctedCues),cueP95Ms:number(r.cueP95Ms),cueMaximumMs:number(r.cueMaximumMs)},null,2);
 throw Error('Unknown diagnostic report refused before export');
}
