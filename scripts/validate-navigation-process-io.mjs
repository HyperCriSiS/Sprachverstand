import assert from 'node:assert/strict';
const kinds=['driver','browser','renderer','gpu','utility','other'];
const exact=(value,keys)=>{assert.ok(value&&typeof value==='object'&&!Array.isArray(value));assert.deepEqual(Object.keys(value).sort(),[...keys].sort());};
const number=value=>assert.ok(typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=Number.MAX_SAFE_INTEGER);
export function validateProcessIoSummary(value){
 exact(value,['schemaVersion','rawSamplesExported','processIdentifiersExported','pathsExported','exactFaultFileIdentified','clockUncertaintyMs','phases']);
 assert.equal(value.schemaVersion,1);for(const key of ['rawSamplesExported','processIdentifiersExported','pathsExported','exactFaultFileIdentified'])assert.equal(value[key],false);
 number(value.clockUncertaintyMs);assert.ok(value.clockUncertaintyMs<=250);assert.ok(Array.isArray(value.phases)&&value.phases.length<=3);
 const names=new Set();
 for(const phase of value.phases){
  exact(phase,['name','durationMs','sampleCount','samplerCpuUs','maximumSampleWallMs','inaccessible','unstable','classes']);
  assert.ok(['session','navigation','validation'].includes(phase.name)&&!names.has(phase.name));names.add(phase.name);
  for(const key of ['durationMs','sampleCount','samplerCpuUs','maximumSampleWallMs','inaccessible','unstable'])number(phase[key]);assert.ok(phase.sampleCount<=1800);
  assert.ok(Array.isArray(phase.classes)&&phase.classes.length===kinds.length);
  for(let i=0;i<kinds.length;i++){
   const counters=phase.classes[i],keys=['observations','readBytesDelta','readIntervals','unknownReadObservations','majorFaultsDelta','cpuTicksDelta','counterIntervals','counterResets','mainThreadFolioSamples','unknownWaitObservations'];
   exact(counters,['kind',...keys]);assert.equal(counters.kind,kinds[i]);for(const key of keys){number(counters[key]);assert.ok(Number.isSafeInteger(counters[key]));}
  }
 }
}
