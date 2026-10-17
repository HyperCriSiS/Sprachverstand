// This is temporal co-observation, not proof that a sampled worker blocks a
// particular safepoint barrier. All process/thread identities stay in memory.
export function summarizePageWorkerWaits(phases,monitor,pageThread,clock,timeOrigin){
 if(!pageThread||!Number.isFinite(timeOrigin)||!Number.isFinite(clock?.offsetMs)||
 !Number.isFinite(clock?.uncertaintyMs)||clock.uncertaintyMs<0)return null;
 const safePoints=phases.filter(e=>e.pid===pageThread.pid&&e.tid===pageThread.tid&&e.name==='V8.GC_TIME_TO_SAFEPOINT');
 const inside=(event,begin,end)=>Number.isFinite(event.ts)&&Number.isFinite(event.dur)&&
 begin>event.ts/1000+clock.offsetMs+clock.uncertaintyMs&&
 end<(event.ts+event.dur)/1000+clock.offsetMs-clock.uncertaintyMs;
 let observedOwnWorkerSamples=0,workerFolioSamplesInsidePageSafepoint=0,
 stableAbsentWorkerInstructionSamplesInsidePageSafepoint=0,
 stableAbsentWorkerInstructionSamplesInsidePageSafepointAndOptimizer=0;
 for(const sample of monitor?.samples??[]){
  const begin=sample.beforeEpochMs-timeOrigin,end=sample.afterEpochMs-timeOrigin;
  if(!Number.isFinite(begin)||!Number.isFinite(end)||end<begin)continue;
  for(const thread of sample.threads??[]){
   if(thread.pid!==pageThread.pid||thread.tid===pageThread.tid||thread.startToken===undefined)continue;
   observedOwnWorkerSamples++;
   if(thread.state!=='D'||thread.waitChannel!=='folio_wait_bit_common'||!safePoints.some(e=>inside(e,begin,end)))continue;
   workerFolioSamplesInsidePageSafepoint++;
   const n=thread.nativeLocation;
   if(n?.status!=='sampled'||n.sampleStable!==true||n.instructionPage?.status!=='sampled'||n.instructionPage.present!==false)continue;
   stableAbsentWorkerInstructionSamplesInsidePageSafepoint++;
   if(phases.some(e=>e.pid===thread.pid&&e.tid===thread.tid&&e.name==='V8.OptimizeBackground'&&inside(e,begin,end)))
    stableAbsentWorkerInstructionSamplesInsidePageSafepointAndOptimizer++;
  }
 }
 return {observedOwnWorkerSamples,workerFolioSamplesInsidePageSafepoint,
 stableAbsentWorkerInstructionSamplesInsidePageSafepoint,
 stableAbsentWorkerInstructionSamplesInsidePageSafepointAndOptimizer,
 barrierBlockingWorkerIdentified:false};
}
