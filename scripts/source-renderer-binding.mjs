import {readFileSync,readdirSync,readlinkSync,statSync,accessSync,constants} from 'node:fs';
import {matchesOwnedRenderer} from './system-cache-renderer-match.mjs';
export function ownRenderers(rootPid,rootStart){
 const safe=file=>{try{return readFileSync(file,'utf8');}catch{return null;}};
 const start=pid=>{const line=safe(`/proc/${pid}/stat`);return line?.slice(line.lastIndexOf(')')+2).split(/\s+/)[19];};
 if(start(rootPid)!==rootStart)throw Error('preflight-driver-identity-changed');
 const pending=[rootPid],seen=new Set(),records=[];
 const discovery={ownProcesses:0,rendererArgumentMatches:0,rendererCommMatches:0,commandLineUnavailable:0,childListsUnavailable:0};
 while(pending.length){
  const pid=pending.shift();if(seen.has(pid))continue;seen.add(pid);
  if(seen.size>256)throw Error('preflight-process-cap');
  const identity=start(pid);if(!identity)continue;
  const command=safe(`/proc/${pid}/cmdline`);
  const comm=safe(`/proc/${pid}/comm`)?.trim();
  const {argumentMatch,commMatch}=matchesOwnedRenderer(command,comm);
  discovery.ownProcesses++;
  if(command===null)discovery.commandLineUnavailable++;
  if(argumentMatch)discovery.rendererArgumentMatches++;
  if(commMatch)discovery.rendererCommMatches++;
  if(argumentMatch||commMatch){
   try{
    const target=readlinkSync(`/proc/${pid}/exe`),metadata=statSync(target);
    let writable=false;try{accessSync(target,constants.W_OK);writable=true;}catch{}
    if(start(pid)===identity)records.push({target,ownerMatches:metadata.uid===process.getuid(),writable,regularFile:metadata.isFile()});
   }catch{throw Error('preflight-renderer-executable-unavailable');}
  }
  let tasks=[];try{tasks=readdirSync(`/proc/${pid}/task`);}catch{}
  if(tasks.length>2048)throw Error('preflight-thread-cap');
  for(const tid of tasks){const children=safe(`/proc/${pid}/task/${tid}/children`);
   if(children===null)discovery.childListsUnavailable++;
   if(children?.trim())pending.push(...children.trim().split(/\s+/).map(Number).filter(n=>Number.isSafeInteger(n)&&n>0));}
 }
 return {records,discovery};
}




