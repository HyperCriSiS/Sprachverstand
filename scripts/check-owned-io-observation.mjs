import assert from 'node:assert/strict';
import {parseProcReadBytes,summarizeIoObservation} from './owned-io-observation.mjs';
assert.equal(parseProcReadBytes('rchar: 9000\nread_bytes: 4096\n'),4096);
for(const raw of [null,'rchar: 1','read_bytes: -1','read_bytes: 1\nread_bytes: 2','read_bytes: 99999999999999999999'])assert.equal(parseProcReadBytes(raw),null);
const sample=(readBytes,majorFaults,ioDelayTicks,folio=false,startToken='own')=>({
 processIo:[{pid:77777,startToken,readBytes,private:'PRIVATE'}],
 threads:[{pid:77777,tid:88888,startToken,state:folio?'D':'S',waitChannel:folio?'folio_wait_bit_common':'futex_do_wait',
  majorFaults,ioDelayTicks,nativeLocation:folio?{sampleStable:true,instructionPage:{status:'sampled',present:false}}:null}]
});
let result=summarizeIoObservation({taskDelayAccounting:'enabled',samples:[sample(0,0,0),sample(4096,1,2,true),sample(8192,2,3)]});
assert.equal(result.processReportedReadBytesDelta,8192);assert.equal(result.threadIoDelayTicksDelta,3);
assert.equal(result.sampledThreadMajorFaultsDelta,2);assert.equal(result.folioWaitSamples,1);
assert.equal(result.surroundingIntervalsWithFolioAndReadIncrease,2);assert.equal(result.stableAbsentInstructionPageSamples,1);
assert.ok(!JSON.stringify(result).includes('77777')&&!JSON.stringify(result).includes('88888')&&!JSON.stringify(result).includes('PRIVATE'));
result=summarizeIoObservation({taskDelayAccounting:'disabled',samples:[sample(null,0,0),sample(null,0,0)]});
assert.equal(result.processReportedReadBytesDelta,null);assert.equal(result.threadIoDelayTicksDelta,null);
result=summarizeIoObservation({taskDelayAccounting:'enabled',samples:[sample(8192,0,0),sample(0,0,0,'', 'new')]});
assert.equal(result.processReportedReadBytesDelta,null);assert.equal(result.threadIoDelayTicksDelta,null);
result=summarizeIoObservation({taskDelayAccounting:'enabled',samples:[sample(8192,0,0),sample(0,0,0)]});
assert.equal(result.readCounterResets,1);assert.equal(result.processReportedReadBytesDelta,null);
assert.equal(summarizeIoObservation(null).processReportedReadBytesDelta,null);
console.log('Own I/O accounting: missing/disabled values unknown, PID reuse/reset excluded, bracketing only, no identifiers exported.');
