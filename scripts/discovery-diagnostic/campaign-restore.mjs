import {mkdir,readFile,readdir,copyFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {atomic,readJson,validateState} from './campaign-state.mjs';
const token=process.env.GH_TOKEN,repo=process.env.GITHUB_REPOSITORY,batch=Number(process.env.CRAWL_BATCH),profile=process.env.CRAWL_PROFILE;
const prefix=`crawl-${profile}-batch-${batch}-`,root='artifacts/discovery-campaign';
if(!token||!repo||!Number.isInteger(batch))throw Error('Missing artifact restore context');
await mkdir(root+'/states',{recursive:true});await mkdir(root+'/pages',{recursive:true});
const config=JSON.parse(await readFile('config/discovery-campaign/manifest.json'));
const domains=JSON.parse(await readFile('config/discovery-campaign/domains.json')).slice((batch-1)*12,batch*12);
const runs=[...new Set([process.env.CRAWL_RESUME_RUN,process.env.GITHUB_RUN_ID].filter(x=>/^\d+$/.test(x??'')))];
const headers={Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
for(const run of runs){
 const matches=[];
 for(let page=1;;page++){const r=await fetch(`https://api.github.com/repos/${repo}/actions/runs/${run}/artifacts?per_page=100&page=${page}`,{headers,signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('Cannot list resume artifacts: HTTP '+r.status);const data=await r.json();matches.push(...data.artifacts.filter(x=>x.name.startsWith(prefix)&&!x.expired));if(data.artifacts.length<100)break;}
 matches.sort((a,b)=>a.id-b.id);
 for(const artifact of matches){
  const response=await fetch(artifact.archive_download_url,{headers,signal:AbortSignal.timeout(120000)});if(!response.ok)throw Error('Cannot download checkpoint: HTTP '+response.status);
  const temp=`artifacts/restore-${artifact.id}`;await mkdir(temp,{recursive:true});const zip=temp+'/checkpoint.zip';await writeFile(zip,Buffer.from(await response.arrayBuffer()));execFileSync('unzip',['-q',zip,'-d',temp+'/data']);
  const data=temp+'/data',provenance=await readJson(data+'/provenance.json',null);
  if(!provenance||provenance.campaign!==config.campaign||provenance.domainSha256!==config.domainSha256||provenance.productBaseline!==config.productBaseline)throw Error('Resume provenance mismatch');
  const states=await readdir(data+'/states');
  for(const name of states.filter(x=>/^\d+\.json$/.test(x))){const incoming=await readJson(data+'/states/'+name,null),domain=domains.find(x=>x.id===incoming.id);if(!domain)throw Error('Foreign domain in batch checkpoint');validateState(incoming,domain);const current=await readJson(root+'/states/'+name,null);if(!current||incoming.visited.length>=current.visited.length)await atomic(root+'/states/'+name,incoming);}
  for(const name of await readdir(data+'/pages').catch(e=>e.code==='ENOENT'?[]:Promise.reject(e)))if(/^[a-f0-9]{24}\.json$/.test(name))await copyFile(data+'/pages/'+name,root+'/pages/'+name);
  console.log('Restored checkpoint '+artifact.name);
 }
}
