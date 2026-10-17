import {readFileSync,readdirSync} from 'node:fs';
export function knownRendererFlags(text){
 if(!/(?:^|[\s\0])--type=renderer(?:[\s\0]|$)/.test(text))return null;
 const flags=text.replaceAll('\0',' ').replaceAll('--js-flags=',' ');
 const has=name=>new RegExp('(?:^|\\s)--'+name+'(?:\\s|$)').test(flags);
 return {traceOpt:has('trace-opt'),traceFileNames:has('trace-file-names'),jitless:has('jitless'),
 disableOptimizers:has('disable-optimizing-compilers'),disallowDeveloper:has('disallow-developer-only-features'),
 disallowUnsafe:has('disallow-unsafe-flags'),traceOptNegated:has('notrace-opt')||has('no-trace-opt')};
}
export function observeOwnRendererFlags(rootPid){
 const records=new Map();let capped=false;
 const read=p=>{try{return readFileSync(p,'utf8');}catch{return null;}};
 const stat=pid=>{const s=read('/proc/'+pid+'/stat');if(!s)return null;const fields=s.slice(s.lastIndexOf(') ')+2).split(' ');return {parent:Number(fields[1]),start:fields[19]};};
 const rootStart=stat(rootPid)?.start;
 function sample(){
  if(!rootStart||stat(rootPid)?.start!==rootStart)return;
  const pending=[{pid:rootPid,parent:null}],visited=new Set();
  while(pending.length&&visited.size<128){
   const {pid,parent}=pending.pop();if(visited.has(pid))continue;visited.add(pid);
   const before=stat(pid);if(!before||(parent!==null&&before.parent!==parent))continue;
   const flags=knownRendererFlags(read('/proc/'+pid+'/cmdline')??'');const after=stat(pid);
   if(!after||after.start!==before.start)continue;
   if(flags)records.set(pid+'/'+before.start,flags);
   let tids;try{tids=readdirSync('/proc/'+pid+'/task');}catch{continue;}
   if(tids.length>256)capped=true;
   for(const tid of tids.slice(0,256))for(const token of (read('/proc/'+pid+'/task/'+tid+'/children')??'').trim().split(/\s+/)){
    const child=Number(token);if(Number.isSafeInteger(child)&&child>0)pending.push({pid:child,parent:pid});
   }
  }
  if(pending.length)capped=true;
 }
 sample();const timer=setInterval(sample,10);
 return ()=>{clearInterval(timer);sample();const values=[...records.values()];
  return {observedRendererProcesses:values.length,discoveryCapped:capped,
   allObservedTraceOpt:values.length?values.every(v=>v.traceOpt):null,
   allObservedTraceFileNames:values.length?values.every(v=>v.traceFileNames):null,
   allObservedJitless:values.length?values.every(v=>v.jitless):null,
   anyObservedJitless:values.length?values.some(v=>v.jitless):null,
   anyObservedDisabledOptimizers:values.length?values.some(v=>v.disableOptimizers):null,
   anyObservedDeveloperDisallow:values.length?values.some(v=>v.disallowDeveloper):null,
   anyObservedUnsafeDisallow:values.length?values.some(v=>v.disallowUnsafe):null,
   anyObservedTraceOptNegated:values.length?values.some(v=>v.traceOptNegated):null};};
}
