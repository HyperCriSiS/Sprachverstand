import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {readFileSync,readdirSync,readlinkSync,realpathSync,statSync,accessSync,constants,openSync,readSync,closeSync} from 'node:fs';
import path from 'node:path';
import {stopOwnedChild} from './stop-owned-child.mjs';
export const expectedSourceSha256='fe5a683855bb91f3bf5a5496ca2fe7e4c4511673e66605efcbf64c74db88a944';
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function candidate(filename){return /^\/(?:opt|usr)\//.test(filename)&&/^(chrome|chromium|chromium-browser)$/.test(path.basename(filename));}
function statProcess(pid){try{const raw=readFileSync('/proc/'+pid+'/stat','utf8'),f=raw.slice(raw.lastIndexOf(')')+2).split(/\s+/);return {parent:Number(f[1]),start:f[19]};}catch{return null;}}
function discover(rootPid,rootStart){
 if(!rootStart||statProcess(rootPid)?.start!==rootStart)return undefined;
 const pending=[{pid:rootPid,parent:null}],seen=new Set();
 while(pending.length&&seen.size<64){const {pid,parent}=pending.pop();if(seen.has(pid))continue;seen.add(pid);
  const before=statProcess(pid);if(!before||(parent!==null&&before.parent!==parent))continue;
  try{const filename=readlinkSync('/proc/'+pid+'/exe');if(candidate(filename)&&statProcess(pid)?.start===before.start)return filename;}catch{}
  let tasks=[];try{tasks=readdirSync('/proc/'+pid+'/task');}catch{}
  for(const tid of tasks.slice(0,256)){let children='';try{children=readFileSync('/proc/'+pid+'/task/'+tid+'/children','utf8');}catch{}
   for(const token of children.trim().split(/\s+/)){const child=Number(token);if(Number.isSafeInteger(child)&&child>0)pending.push({pid:child,parent:pid});}}
 }
}
export async function resolveSourceBrowser(){
 assert.equal(process.platform,'linux');let command=process.env.CHROMIUM_BIN;
 if(!command)for(const name of ['chromium','chromium-browser']){const r=spawnSync('which',[name],{encoding:'utf8'});if(r.status===0&&r.stdout.trim()){command=r.stdout.trim();break;}}
 assert.ok(command);let source,method='owned-version-process';
 const direct=realpathSync(command);if(candidate(direct)){const fd=openSync(direct,'r'),header=Buffer.alloc(4);try{assert.equal(readSync(fd,header,0,4,0),4);}finally{closeSync(fd);}if(header.equals(Buffer.from([127,69,76,70]))){source=direct;method='direct-elf';}}
 const child=spawn(command,['--version'],{stdio:['ignore','pipe','pipe']});let output='',overflow=false,finished=false,failed=false;
 child.stdout.on('data',chunk=>{if(output.length+chunk.length<=4096)output+=chunk.toString();else overflow=true;});child.stderr.on('data',()=>{});
 const closed=new Promise(resolve=>{child.once('close',code=>{finished=true;resolve(code);});child.once('error',()=>{failed=true;finished=true;resolve(255);});});
 let rootStart;
 try{const deadline=Date.now()+10000;while(!finished&&Date.now()<deadline){rootStart??=statProcess(child.pid)?.start;if(!source)source=discover(child.pid,rootStart);await pause(1);}
  if(!finished){await stopOwnedChild(child);throw Error('Version-only source discovery timed out');}
  assert.equal(await closed,0);assert.ok(!failed&&!overflow);assert.match(output,/\b155\.0\.8059\.0\b/);assert.ok(source&&candidate(source));
 }finally{await stopOwnedChild(child);child.stdout.destroy();child.stderr.destroy();}
 const s=statSync(source);assert.ok(s.isFile()&&s.uid!==process.getuid());let writable=true;try{accessSync(source,constants.W_OK);}catch{writable=false;}assert.equal(writable,false);
 return {source,identity:{dev:s.dev,ino:s.ino,size:s.size,mtimeMs:s.mtimeMs,ctimeMs:s.ctimeMs},method,browserVersion:'155.0.8059.0'};
}

