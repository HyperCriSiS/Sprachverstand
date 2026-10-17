import {summarizePageWorkerWaits} from './page-worker-wait-correlation.mjs';
import {summarizeIoObservation} from './owned-io-observation.mjs';
import path from 'node:path';
// Raw diagnostics exist in process memory only. Every exported field is listed here.
const pageThreads=new Map();
const traces=new Map(),names=new Set(['V8.OptimizeCode','V8.OptimizeConcurrentPrepare','V8.OptimizeNonConcurrent','V8.OptimizeBackground','V8.GC_TIME_TO_SAFEPOINT','V8.GC_MARK_COMPACTOR','V8.GC_SCAVENGER']);
const number=n=>Number.isFinite(n)?n:null;
function phaseTotals(events){return [...names].map(name=>{
 const list=events.filter(e=>e.name===name);
 const known=list.filter(e=>Number.isFinite(e.tdur)&&e.tdur>=0);
 const longest=list.reduce((best,event)=>!best||event.dur>best.dur?event:best,null);
 return {name,count:list.length,cpuDurationKnownCount:known.length,
 maximumWallMs:longest?longest.dur/1000:0,
 maximumCpuMs:known.length?Math.max(...known.map(e=>e.tdur/1000)):null,
 maximumWallEventCpuMs:longest&&Number.isFinite(longest.tdur)&&longest.tdur>=0?longest.tdur/1000:null};
 });}
export function summarizeOwnedTrace(filename,text){
 const parsed=JSON.parse(text),events=parsed.traceEvents??parsed;
 if(!Array.isArray(events))throw Error('Synthetic trace shape missing');
 const phases=events.filter(e=>names.has(e.name)&&Number.isFinite(e.dur)&&e.dur>=0).map(e=>({name:e.name,ts:e.ts,dur:e.dur,tdur:e.tdur,pid:e.pid,tid:e.tid}));
 const witnesses=events.filter(e=>e.name==='sprachverstand.diagnostic.page-thread'&&Number.isSafeInteger(e.pid)&&Number.isSafeInteger(e.tid));
 const identities=new Map(witnesses.map(e=>[e.pid+':'+e.tid,{pid:e.pid,tid:e.tid}]));
 pageThreads.set(path.basename(filename),identities.size===1?[...identities.values()][0]:null);
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
 const pageThread=pageThreads.get(path.basename(r.traceFile??''));
 const pageThreadPhases=pageThread?phaseTotals(phases.filter(e=>e.pid===pageThread.pid&&e.tid===pageThread.tid)):null;
 const pageThreadGapOverlap=pageThread?pagePhaseGapOverlap(phases.filter(e=>e.pid===pageThread.pid&&e.tid===pageThread.tid),r.frameSamples,r.traceClock):null;
 const pageWorkerWaitCorrelation=summarizePageWorkerWaits(phases,r.rendererMonitor,pageThread,r.traceClock,r.timeOriginEpochMs);
 return {pageWorkerWaitCorrelation,pageThreadGapOverlap,pageThreadWitnessVerified:Boolean(pageThread),pageThreadPhases,backendKind:r.backendKind,backgroundSha256:r.backgroundSha256,backendBodySha256:r.backendBodySha256,componentKind:r.componentKind,correctionImplementation:r.mode==='baseline'?'none':r.componentKind==='classifier-literal'?'classifier-literal':r.componentKind==='page-dom'?'page-dom-literal':'sprachverstand',
 extensionInstalled:r.extensionInstalled,installationArgumentsVerified:r.installationArgumentsVerified,driverVersion:r.driverVersion,pageDomBundleSha256:r.pageDomBundleSha256,
 pageDomControlStats:r.pageDomControlStats?{started:r.pageDomControlStats.started===true,requests:number(r.pageDomControlStats.requests),matchedMarkers:number(r.pageDomControlStats.matchedMarkers),notifications:number(r.pageDomControlStats.notifications),reportedCount:number(r.pageDomControlStats.reportedCount)}:null,
 diagnosticComplete:Boolean(r.nativeTraceSchedule)&&!r.nativeTraceSchedule.error&&Boolean(r.rendererMonitor)&&!(r.rendererMonitor.errors?.length)&&samples.length>0,clockUncertaintyMs:number(r.traceClock?.uncertaintyMs),allCallbackFramesFocused:Array.isArray(r.frameSamples)&&r.frameSamples.length>0&&r.frameSamples.every(f=>typeof f.focusedAtFrame==="boolean")?r.frameSamples.every(f=>f.focusedAtFrame):null,allCallbackFramesVisible:Array.isArray(r.frameSamples)&&r.frameSamples.length>0&&r.frameSamples.every(f=>typeof f.visibilityAtFrame==="string")?r.frameSamples.every(f=>f.visibilityAtFrame==="visible"):null,ioObservation:summarizeIoObservation(r.rendererMonitor),browserVersion:/^\d+\.\d+\.\d+\.\d+$/.test(r.browserVersion??'')?r.browserVersion:null,visible:r.visibilityState==='visible',focused:r.focused===true,correctDynamicTexts:number(r.dynamicCompletion?.correct),expectedDynamicTexts:number(r.dynamicCompletion?.expected),drops:number(r.droppedVideoFrames),maximumCallbackGapMs:number(r.frames?.maximumGapMs),pageLongTaskCount:tasks.length,pageLongTaskMaximumMs:tasks.length?number(Math.max(...tasks.map(t=>t.durationMs??t.duration??t.dauerMs??NaN))):0,monitorSampleCount:samples.length,monitorSpanMs:number(span),parentMonitorCpuUs:samples.reduce((s,e)=>s+(e.monitorCpuUs??0),0),childProbeCpuExcluded:true,phaseTotals:phaseTotals(phases),residency:counts};
}
export function summarizeOwnedReport(text){
 const r=JSON.parse(text);
 if(r.baseline&&r.extension)return JSON.stringify({type:'synthetic-component-dom-pair-aggregates',rawDiagnosticsExported:false,baseline:role(r.baseline),extension:role(r.extension)},null,2);
 if(typeof r.cueCount==='number')return JSON.stringify({type:'synthetic-subtitle-aggregates',rawDiagnosticsExported:false,cueCount:number(r.cueCount),correctedCues:number(r.correctedCues),cueP95Ms:number(r.cueP95Ms),cueMaximumMs:number(r.cueMaximumMs)},null,2);
 throw Error('Unknown diagnostic report refused before export');
}
// Trace timestamps are converted into performance.now() using a bounded clock
// offset. Only callback-entry timestamps are accepted, never rVFC render time.
export function pagePhaseGapOverlap(phases,frames,clock){
 if(!Number.isFinite(clock?.offsetMs)||!Number.isFinite(clock?.uncertaintyMs)||clock.uncertaintyMs<0||
 !Array.isArray(frames)||frames.length<2||frames.some(f=>!Number.isFinite(f.callbackAtMs)))return null;
 const gaps=[];
 for(let i=1;i<frames.length;i++){
  const start=frames[i-1].callbackAtMs,end=frames[i].callbackAtMs;
  if(end<start)return null;
  if(end-start>120)gaps.push({start,end});
 }
 const valid=phases.filter(e=>Number.isFinite(e.ts)&&Number.isFinite(e.dur)&&e.dur>=0);
 const uncertainty=clock.uncertaintyMs;
 return [...names].map(name=>{
  let confirmedOverlapPairs=0,maximumGuaranteedOverlapMs=0,maximumPossibleOverlapMs=0;
  for(const event of valid.filter(e=>e.name===name)){
   const start=event.ts/1000+clock.offsetMs,end=start+event.dur/1000;
   for(const gap of gaps){
    // Contracting/expanding is conservative for a common unknown offset.
    const lower=Math.max(0,Math.min(gap.end,end-uncertainty)-Math.max(gap.start,start+uncertainty));
    const upper=Math.max(0,Math.min(gap.end,end+uncertainty)-Math.max(gap.start,start-uncertainty));
    if(lower>0)confirmedOverlapPairs++;
    maximumGuaranteedOverlapMs=Math.max(maximumGuaranteedOverlapMs,lower);
    maximumPossibleOverlapMs=Math.max(maximumPossibleOverlapMs,upper);
   }
  }
  return {name,observedCallbackGapCount:gaps.length,confirmedOverlapPairs,maximumGuaranteedOverlapMs,maximumPossibleOverlapMs};
 });
}
