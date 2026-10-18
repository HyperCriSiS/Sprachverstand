import fs from 'node:fs';
import {performance} from 'node:perf_hooks';
export const epochNow=()=>performance.timeOrigin+performance.now();
export function parseProcStat(text){
 if(typeof text!=='string'||!text.includes(') '))return null;
 const fields=text.slice(text.lastIndexOf(') ')+2).trim().split(/\s+/);
 const integer=index=>/^\d+$/.test(fields[index]??'')&&Number.isSafeInteger(Number(fields[index]))?Number(fields[index]):null;
 const startToken=fields[19];
 if(!/^[RSDZTWtXxKPI]$/.test(fields[0]??'')||!/^\d+$/.test(startToken??''))return null;
 return {state:fields[0],parent:integer(1),majorFaults:integer(9),cpuTicks:integer(11)!==null&&integer(12)!==null?integer(11)+integer(12):null,startToken};
}
export function processKind(pid,rootPid,argv,executable,parentPid){
 if(pid===rootPid)return 'driver';
 for(const [flag,kind]of [['--type=renderer','renderer'],['--type=gpu-process','gpu'],['--type=utility','utility']])if(argv?.includes(flag))return kind;
 if(argv?.some(arg=>arg.startsWith('--type=')))return 'other';
 return parentPid===rootPid&&/(?:^|\/)(?:chrome|chromium)$/.test(executable??'')?'browser':'other';
}
export function sampleOwnedProcesses(rootPid,rootStart,{io=fs,uid=process.getuid(),now=epochNow}={}){
 const before=now(),read=file=>{try{const b=io.readFileSync(file);return b.length<=262144?b.toString():null;}catch{return null;}};
 const stat=pid=>parseProcStat(read(`/proc/${pid}/stat`));
 const owner=pid=>{try{return io.statSync(`/proc/${pid}`).uid===uid;}catch{return false;}};
 if(!owner(rootPid)||stat(rootPid)?.startToken!==rootStart)throw Error('Owned driver identity unavailable');
 const queue=[{pid:rootPid}],seen=new Set(),records=[];let inaccessible=0,unstable=0;
 while(queue.length){
  const {pid,parent,parentStart}=queue.shift();if(seen.has(pid))continue;seen.add(pid);if(seen.size>64)throw Error('Process discovery cap');
  const first=stat(pid);if(!first||!owner(pid)){inaccessible++;continue;}
  if(parent!==undefined&&(first.parent!==parent||stat(parent)?.startToken!==parentStart)){unstable++;continue;}
  let tasks=[];try{tasks=io.readdirSync(`/proc/${pid}/task`);}catch{inaccessible++;}
  if(tasks.length>2048)throw Error('Thread discovery cap');
  for(const tid of tasks){const children=read(`/proc/${pid}/task/${tid}/children`);for(const raw of children?.trim().split(/\s+/)??[]){if(/^\d+$/.test(raw)&&Number(raw)>0)queue.push({pid:Number(raw),parent:pid,parentStart:first.startToken});}}
  const argv=read(`/proc/${pid}/cmdline`)?.split('\0');let exe;try{exe=io.readlinkSync(`/proc/${pid}/exe`);}catch{}
  const kind=processKind(pid,rootPid,argv,exe,first.parent),wchan=read(`/proc/${pid}/wchan`),rawIo=read(`/proc/${pid}/io`);
  const match=rawIo?.match(/^read_bytes:\s*(\d+)\s*$/m),readBytes=match&&Number.isSafeInteger(Number(match[1]))?Number(match[1]):null;
  const last=stat(pid);if(last?.startToken!==first.startToken){unstable++;continue;}
  records.push({pid,startToken:first.startToken,kind,directDriverChild:first.parent===rootPid,extensionLoad:kind==='browser'&&argv?argv.some(arg=>/^--load-extension=.+/.test(arg)):null,state:first.state,majorFaults:first.majorFaults,cpuTicks:first.cpuTicks,readBytes,
   folioWait:first.state!==last.state?null:first.state!=='D'?false:wchan===null||!wchan.trim()||wchan.trim()==='0'?null:wchan.trim()==='folio_wait_bit_common'});
 }
 if(stat(rootPid)?.startToken!==rootStart)throw Error('Owned driver identity changed');
 return {before,after:now(),inaccessible,unstable,records};
}

if(process.env.NAV_IO_WORKER==='1'){
 let timer,samples=[],configuration;const finish=()=>{clearInterval(timer);process.send?.({type:'result',samples},()=>process.exit(0));};
 process.on('message',message=>{
  try{
   if(message?.type==='init'){
    if(configuration||process.platform!=='linux'||!Number.isSafeInteger(message.pid)||message.pid<1||!/^\d+$/.test(message.startToken))throw Error('Invalid configuration');
    configuration=message;const sample=()=>{const beforeCpu=process.cpuUsage();const item=sampleOwnedProcesses(message.pid,message.startToken);const cpu=process.cpuUsage(beforeCpu);item.samplerCpuUs=cpu.user+cpu.system;samples.push(item);if(samples.length>=1800)throw Error('Sample cap');};
    sample();timer=setInterval(()=>{try{sample();}catch{clearInterval(timer);process.send?.({type:'error',code:'sampling-failed'});}},100);process.send?.({type:'ready'});
   }else if(message?.type==='sync'){const received=epochNow();process.send?.({type:'sync',received,sent:epochNow()});}
   else if(message?.type==='stop')finish();
  }catch{clearInterval(timer);process.send?.({type:'error',code:'worker-failed'});}
 });
 process.on('disconnect',()=>{clearInterval(timer);process.exit(1);});
}
