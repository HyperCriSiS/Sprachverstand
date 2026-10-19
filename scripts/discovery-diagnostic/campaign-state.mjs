import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
export const hashUrl=url=>createHash('sha256').update(url).digest('hex').slice(0,24);
export async function atomic(file,data){await mkdir(path.dirname(file),{recursive:true});await writeFile(file+'.tmp',JSON.stringify(data));await rename(file+'.tmp',file);}
export async function readJson(file,fallback){try{return JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return fallback;throw e;}}
export function chooseNext(state,maxSubpages=50){
 if(state.complete)return null;
 if(state.inflight)return state.inflight;
 if(state.status==='pending')return {url:state.url,isRoot:true};
 if(['robots-skipped','access-blocked'].includes(state.status)||state.visited.length>=maxSubpages+1)return null;
 const visited=new Set(state.visited.map(x=>x.url));return state.queue.find(x=>!visited.has(x.url))?{url:state.queue.find(x=>!visited.has(x.url)).url,isRoot:false}:null;
}
export function validateState(state,domain){
 if(state.id!==domain.id||state.domain!==domain.domain||state.url!==domain.url)throw Error('Mismatched checkpoint domain');
 if(new Set(state.visited.map(x=>x.url)).size!==state.visited.length||state.visited.length>51)throw Error('Invalid checkpoint URL count');
 return state;
}
export function recordCrash(state,message,maxAttempts=2){
 state.workerErrors??=[];state.workerErrors.push({at:new Date().toISOString(),message});
 if(!state.inflight)return;
 const {url,isRoot}=state.inflight;state.attempts??={};state.attempts[url]=(state.attempts[url]??0)+1;
 if(state.attempts[url]<maxAttempts)return;
 if(!state.visited.some(x=>x.url===url))state.visited.push({url,isRoot,status:'error',workerFailure:true,error:message,completedAt:new Date().toISOString()});
 state.queue=state.queue.filter(x=>x.url!==url);state.inflight=null;
 if(isRoot)state.status='root-error';
}
