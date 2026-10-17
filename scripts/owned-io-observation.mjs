const valid=n=>Number.isSafeInteger(n)&&n>=0;
export function parseProcReadBytes(text){
 if(typeof text!=='string')return null;
 const matches=[...text.matchAll(/^read_bytes:\s*(\d+)\s*$/gmu)];
 if(matches.length!==1)return null;
 const n=Number(matches[0][1]);return valid(n)?n:null;
}
export function summarizeIoObservation(monitor){
 const samples=monitor?.samples??[],previousProcesses=new Map(),previousThreads=new Map();
 const configuration=monitor?.taskDelayAccounting;
 const delayAccounting=['enabled','disabled','unavailable'].includes(configuration)?configuration:'unavailable';
 let readDelta=0,readIntervals=0,unknownReadSamples=0,delayDelta=0,delayIntervals=0;
 let majorDelta=0,majorIntervals=0,folioSamples=0,pteAbsentSamples=0,correlatedIntervals=0,correlatedBytes=0,resets=0;
 for(const sample of samples){
  const folioPids=new Set();
  for(const thread of sample.threads??[]){
   const key=`${thread.pid}/${thread.tid}/${thread.startToken}`;
   const prior=previousThreads.get(key);
   const folio=thread.state==='D'&&thread.waitChannel==='folio_wait_bit_common';
   if(folio){folioSamples++;folioPids.add(thread.pid);}
   if(folio&&thread.nativeLocation?.sampleStable===true&&thread.nativeLocation.instructionPage?.status==='sampled'&&thread.nativeLocation.instructionPage.present===false)pteAbsentSamples++;
   if(prior&&thread.startToken!==undefined){
    if(valid(prior.majorFaults)&&valid(thread.majorFaults)&&thread.majorFaults>=prior.majorFaults){majorDelta+=thread.majorFaults-prior.majorFaults;majorIntervals++;}
    if(delayAccounting==='enabled'&&valid(prior.ioDelayTicks)&&valid(thread.ioDelayTicks)&&thread.ioDelayTicks>=prior.ioDelayTicks){delayDelta+=thread.ioDelayTicks-prior.ioDelayTicks;delayIntervals++;}
   }
   previousThreads.set(key,thread);
  }
  for(const entry of sample.processIo??[]){
   const key=`${entry.pid}/${entry.startToken}`,prior=previousProcesses.get(key);
   if(!valid(entry.readBytes))unknownReadSamples++;
   if(prior&&entry.startToken!==undefined&&valid(prior.readBytes)&&valid(entry.readBytes)){
    if(entry.readBytes<prior.readBytes)resets++;
    else{
     const delta=entry.readBytes-prior.readBytes;readDelta+=delta;readIntervals++;
     if(delta>0&&(folioPids.has(entry.pid)||prior.folio)){correlatedIntervals++;correlatedBytes+=delta;}
    }
   }
   previousProcesses.set(key,{...entry,folio:folioPids.has(entry.pid)});
  }
 }
 return {delayAccounting,processReportedReadBytesDelta:readIntervals?readDelta:null,readCounterIntervals:readIntervals,
  unavailableReadSamples:unknownReadSamples,readCounterResets:resets,
  threadIoDelayTicksDelta:delayIntervals?delayDelta:null,delayCounterIntervals:delayIntervals,
  sampledThreadMajorFaultsDelta:majorIntervals?majorDelta:null,majorFaultCounterIntervals:majorIntervals,
  folioWaitSamples:folioSamples,stableAbsentInstructionPageSamples:pteAbsentSamples,
  surroundingIntervalsWithFolioAndReadIncrease:readIntervals?correlatedIntervals:null,surroundingReadBytesDelta:readIntervals?correlatedBytes:null,
  exactFaultingFileIdentified:false,processIdentifiersExported:false};
}
