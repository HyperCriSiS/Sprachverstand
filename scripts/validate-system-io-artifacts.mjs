import fs from 'node:fs';
const keys=new Set('contentSha256 sourceSha256 actualEntryFrames callbacks p95GapMs p99GapMs maximumGapMs gapsOver120Ms observedPageThreadSamples pageFolioSamplesInsideOptimizer stableAbsentPageInstructionSamplesInsideOptimizer browserExecutableAbsentPageInstructionSamplesInsideOptimizer pageWorkerWaitCorrelation observedOwnWorkerSamples workerFolioSamplesInsidePageSafepoint stableAbsentWorkerInstructionSamplesInsidePageSafepoint stableAbsentWorkerInstructionSamplesInsidePageSafepointAndOptimizer barrierBlockingWorkerIdentified pageThreadGapOverlap observedCallbackGapCount confirmedOverlapPairs maximumGuaranteedOverlapMs maximumPossibleOverlapMs pageThreadWitnessVerified pageThreadPhases backendKind backgroundSha256 backendBodySha256 componentKind correctionImplementation extensionInstalled installationArgumentsVerified driverVersion pageDomBundleSha256 pageDomControlStats started requests matchedMarkers notifications reportedCount diagnosticComplete clockUncertaintyMs allCallbackFramesFocused allCallbackFramesVisible type rawDiagnosticsExported rawTraceExported baseline extension browserVersion visible focused correctDynamicTexts expectedDynamicTexts drops maximumCallbackGapMs pageLongTaskCount pageLongTaskMaximumMs monitorSampleCount monitorSpanMs parentMonitorCpuUs childProbeCpuExcluded phaseTotals residency name count maximumWallMs maximumCpuMs maximumWallEventCpuMs cpuDurationKnownCount stablePteAbsentCacheUnavailable stablePteAbsentCacheResident stablePteAbsentCacheNotResident stablePtePresent unstable cacheProbeSamples cacheProbeMaximumWallMs mainAbsentCacheNotResident workerAbsentCacheNotResident workerAbsentCacheNotResidentInsideCompiler phases ioObservation delayAccounting processReportedReadBytesDelta readCounterIntervals unavailableReadSamples readCounterResets threadIoDelayTicksDelta delayCounterIntervals sampledThreadMajorFaultsDelta majorFaultCounterIntervals folioWaitSamples stableAbsentInstructionPageSamples surroundingIntervalsWithFolioAndReadIncrease surroundingReadBytesDelta exactFaultingFileIdentified processIdentifiersExported'.split(' '));
const names=new Set(['V8.OptimizeCode','V8.OptimizeConcurrentPrepare','V8.OptimizeNonConcurrent','V8.OptimizeBackground','V8.GC_TIME_TO_SAFEPOINT','V8.GC_MARK_COMPACTOR','V8.GC_SCAVENGER']);
export function validateSystemIoArtifact(value,key=''){
 if(value===null||typeof value==='boolean')return;
 if(typeof value==='number'){if(!Number.isFinite(value)||value<0||value>Number.MAX_SAFE_INTEGER)throw Error('Invalid diagnostic number');return;}
 if(typeof value==='string'){
  const allowed=key==='backendKind'?['literal','rules'].includes(value):['contentSha256','sourceSha256','backgroundSha256','backendBodySha256'].includes(key)?/^[a-f0-9]{64}$/.test(value):key==='componentKind'?['page-dom','product'].includes(value)
   :key==='correctionImplementation'?['none','page-dom-literal','sprachverstand'].includes(value)
   :key==='driverVersion'?/^(unknown|\d+\.\d+\.\d+\.\d+)$/.test(value)
   :key==='pageDomBundleSha256'?/^[a-f0-9]{64}$/.test(value)
   :key==='type'?['synthetic-component-dom-pair-aggregates','synthetic-owned-browser-phase-aggregates'].includes(value)
   :key==='name'?names.has(value):key==='browserVersion'?value==='155.0.8059.0'
   :key==='delayAccounting'?['enabled','disabled','unavailable'].includes(value):false;
  if(!allowed)throw Error('Unexpected diagnostic string');return;
 }
 if(Array.isArray(value)){if(value.length>64)throw Error('Unbounded diagnostic array');for(const entry of value)validateSystemIoArtifact(entry,key);return;}
 if(!value||typeof value!=='object')throw Error('Invalid diagnostic value');
 for(const [name,entry]of Object.entries(value)){if(!keys.has(name))throw Error('Unexpected diagnostic field');validateSystemIoArtifact(entry,name);}
}
if(process.argv[1]?.endsWith('validate-system-io-artifacts.mjs')){
 let count=0;
 for(const name of ['video-pair-chromium-60-1.json','video-browser-phase-aggregates-chromium-60-baseline-1.json','video-browser-phase-aggregates-chromium-60-extension-1.json']){
  const file='artifacts/system-io/'+name;if(!fs.existsSync(file))continue;
  if(fs.statSync(file).size>128*1024)throw Error('Oversized aggregate');
  const report=JSON.parse(fs.readFileSync(file,'utf8'));validateSystemIoArtifact(report);
  if(report.rawDiagnosticsExported!==false&&report.rawTraceExported!==false)throw Error('Raw diagnostics refused');count++;
 }
 if(process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,`present=${count>0}\n`);
 console.log(JSON.stringify({validatedAggregateFiles:count}));
}
