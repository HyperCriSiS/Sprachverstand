export const firstBatch=433,lastBatch=834,slots=19;
// Untouched tail batches transfer to slot 18; existing slots retain their stride.
export const extraBatches=Array.from({length:18},(_,i)=>650+i*10);
export function batchesForSlot(slot,profile='full'){
 if(!Number.isInteger(slot)||slot<0||slot>=slots)throw Error('Invalid slot');
 if(slot===18)return profile==='full'?extraBatches:[];
 return Array.from({length:23},(_,i)=>firstBatch+slot+i*18).filter(b=>b<=lastBatch&&(profile==='canary'||!extraBatches.includes(b)));
}
export function assignment(slot,batch,profile='full',end=lastBatch){
 if(!['full','canary'].includes(profile)||!Number.isInteger(end)||end<batch||end>lastBatch||(profile==='full'&&end!==lastBatch)||!batchesForSlot(slot,profile).includes(batch))throw Error('Invalid bounded campaign chain');
 return {slot,batch,profile,end};
}
export function nextBatch(input){const a=assignment(input.slot,input.batch,input.profile,input.end);return batchesForSlot(a.slot,a.profile).find(b=>b>a.batch&&b<=a.end)??null;}
export const runTitle=({slot,batch,profile})=>`deep10000 ${profile} slot ${slot} batch ${batch}`;
