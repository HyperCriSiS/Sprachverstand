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
  let closed=false;
  return {flags:'--trace-opt --trace-file-names --redirect-code-traces --redirect-code-traces-to='+filename,
   summarize(){assert.ok(!closed);const size=fstatSync(fd).size;assert.ok(size<=16*1024*1024);const buffer=Buffer.alloc(size);const n=readSync(fd,buffer,0,size,0);assert.equal(n,size);
    return {syntheticOnly:true,compilerFlagsDiagnosticOnly:true,rawOutputExported:false,anonymousMemoryFileVerified:true,temporalAttributionEstablished:false,byteCount:size,symbolCount:symbols.length,symbolTableSha256,...summarizeCompilerText(buffer.toString('utf8'),symbols)};},
   close(){if(closed)return;closed=true;closeSync(fd);helper.stdin.end();helper.kill();helper.stdout.destroy();}};
 }catch(error){if(fd!==undefined)closeSync(fd);helper.stdin.destroy();helper.kill();helper.stdout.destroy();throw error;}
}
