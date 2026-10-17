import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {openSync,closeSync,readSync,fstatSync,constants} from 'node:fs';
import {createHash} from 'node:crypto';
export function compilerSymbols(sources){
 const names=new Set();
 for(const source of sources)for(const match of source.matchAll(/(?:\bfunction\s+|^\s{2,}(?:async\s+)?)([A-Za-z_$][\w$]*)\s*\(/gm))if(!['if','for','while','switch','catch','constructor'].includes(match[1]))names.add(match[1]);
 return [...names].sort();
}
export function summarizeCompilerText(text,symbols){
 const counts=new Map();let starts=0,ends=0,unknown=0;
 for(const line of text.split(/\r?\n/)){
  const start=/^\[compiling method /.test(line),end=/^\[completed compiling /.test(line);
  if(!start&&!end)continue;if(start)starts++;else ends++;
  const symbol=/\bJSFunction ([^\s(]+)/.exec(line)?.[1],index=symbols.indexOf(symbol);
  if(index<0){unknown++;continue;}
  const item=counts.get(index)??{symbolIndex:index,compileStarts:0,compileEnds:0};
  if(start)item.compileStarts++;else item.compileEnds++;counts.set(index,item);
 }
 return {compileStarts:starts,compileEnds:ends,unmappedLines:unknown,symbols:[...counts.values()].sort((a,b)=>b.compileStarts-a.compileStarts||a.symbolIndex-b.symbolIndex).slice(0,32)};
}
export async function createCompilerMemoryFile(sources){
 assert.equal(process.platform,'linux');
 const symbols=compilerSymbols(sources),symbolTableSha256=createHash('sha256').update(JSON.stringify(symbols)).digest('hex');
 const helper=spawn('python3',['-u','-c','import os,sys; fd=os.memfd_create("sv-synthetic-compiler",0); os.fchmod(fd,0o600); print(fd,flush=True); sys.stdin.read()'],{stdio:['pipe','pipe','ignore']});
 let fd;
 try{
  const descriptor=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Memory helper timeout')),5000);helper.once('error',e=>{clearTimeout(timer);reject(e);});helper.stdout.once('data',data=>{clearTimeout(timer);resolve(data.toString().trim());});});
  assert.match(descriptor,/^\d+$/);const filename='/proc/'+helper.pid+'/fd/'+descriptor;
  fd=openSync(filename,constants.O_RDONLY);assert.ok(fstatSync(fd).isFile());
  let closed=false,timer,position=0,lastReadEpochMs=Date.now(),tail='',tailStartEpochMs=null,resets=0,readFailed=false;const records=[];
  function sample(){try{const before=lastReadEpochMs,size=fstatSync(fd).size;assert.ok(size<=16*1024*1024);if(size<position){resets++;position=0;tail='';tailStartEpochMs=null;}
   if(size>position){const buffer=Buffer.alloc(size-position);const n=readSync(fd,buffer,0,buffer.length,position);position+=n;const text=tail+buffer.subarray(0,n).toString('utf8'),lines=text.split('\n');tail=lines.pop();const after=Date.now();
    for(const line of lines){if(!/^\[compiling method /.test(line))continue;const symbol=/\bJSFunction ([^\s(]+)/.exec(line)?.[1],symbolIndex=symbols.indexOf(symbol);if(records.length>=4096)throw Error('Compiler record cap');
     records.push({symbolIndex,contentSource:/content\.js/.test(line),backgroundSource:/background\.js/.test(line),turbofan:/\(target TURBOFAN_JS\)/.test(line),beforeEpochMs:tailStartEpochMs??before,afterEpochMs:after});}
    tailStartEpochMs=tail?tailStartEpochMs??before:null;lastReadEpochMs=after;
   }else lastReadEpochMs=Date.now();
  }catch{readFailed=true;}}
  return {arm(){sample();records.length=0;resets=0;readFailed=false;timer=setInterval(sample,25);},window(){if(timer){clearInterval(timer);timer=undefined;}sample();return {records,resets,readFailed,symbolTableSha256};},flags:'--trace-opt --trace-file-names --redirect-code-traces --redirect-code-traces-to='+filename,
   summarize(){assert.ok(!closed);const size=fstatSync(fd).size;assert.ok(size<=16*1024*1024);const buffer=Buffer.alloc(size);const n=readSync(fd,buffer,0,size,0);assert.equal(n,size);
    return {syntheticOnly:true,compilerFlagsDiagnosticOnly:true,rawOutputExported:false,anonymousMemoryFileVerified:true,temporalAttributionEstablished:false,byteCount:size,symbolCount:symbols.length,symbolTableSha256,...summarizeCompilerText(buffer.toString('utf8'),symbols)};},
   close(){if(closed)return;closed=true;if(timer)clearInterval(timer);closeSync(fd);helper.stdin.end();helper.kill();helper.stdout.destroy();}};
 }catch(error){if(fd!==undefined)closeSync(fd);helper.stdin.destroy();helper.kill();helper.stdout.destroy();throw error;}
}
