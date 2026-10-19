import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const args=process.argv.slice(2),value=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
const source=value('--domains','config/discovery-domains.json'),stateDir=value('--state-dir',null),output=value('--output','artifacts/discovery-batches'),count=Number(value('--batches','128'));
if(!Number.isInteger(count)||count<1||count>256)throw new Error('Batch count must be 1..256');
const bytes=await readFile(source),domains=JSON.parse(bytes);if(new Set(domains.map(x=>x.domain)).size!==domains.length)throw new Error('Duplicate domains');
await mkdir(output,{recursive:true});const batches=Array.from({length:count},()=>[]);
for(const domain of domains){let state=null;if(stateDir){try{state=JSON.parse(await readFile(stateDir+'/'+domain.id+'.json','utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}}
 if(state&&state.domain!==domain.domain)throw new Error('Mismatched resume state');
 batches[(domain.id-1)%count].push({...domain,maxSubpages:50,resume:state?{status:state.status,visited:state.visited,queue:state.queue,robots:state.robots,errors:state.errors}:null});}
for(let i=0;i<count;i++)await writeFile(output+'/batch-'+String(i+1).padStart(3,'0')+'.json',JSON.stringify({schemaVersion:1,batch:i+1,batches:count,sourceSha256:createHash('sha256').update(bytes).digest('hex'),domains:batches[i]},null,2));
await writeFile(output+'/manifest.json',JSON.stringify({schemaVersion:1,createdAt:new Date().toISOString(),domains:domains.length,batches:count,maxParallelJobs:20,workersPerJob:4,maxSubpages:50,note:'Prepared work packages only; creating these files does not dispatch any workflow.'},null,2));
console.log(`Prepared ${domains.length} domains in ${count} resumable work packages; no workflows dispatched.`);
