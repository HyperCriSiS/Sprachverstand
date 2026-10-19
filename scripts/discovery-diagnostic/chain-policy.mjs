export const firstBatch=433,lastBatch=834,slots=18;
export function assignment(slot,batch,profile='full',end=lastBatch){
 if(!Number.isInteger(slot)||slot<0||slot>=slots||!Number.isInteger(batch)||batch<firstBatch||batch>lastBatch||(batch-firstBatch)%slots!==slot||!['full','canary'].includes(profile)||!Number.isInteger(end)||end<batch||end>lastBatch||(profile==='full'&&end!==lastBatch))throw Error('Invalid bounded campaign chain');
 return {slot,batch,profile,end};
}
export function nextBatch(input){const a=assignment(input.slot,input.batch,input.profile,input.end);return a.batch+slots<=a.end?a.batch+slots:null;}
export const runTitle=({slot,batch,profile})=>`deep10000 ${profile} slot ${slot} batch ${batch}`;
