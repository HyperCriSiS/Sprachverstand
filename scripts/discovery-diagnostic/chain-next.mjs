import {readFile,writeFile} from 'node:fs/promises';
import {assignment,nextBatch,runTitle} from './chain-policy.mjs';
const a=assignment(Number(process.env.CRAWL_SLOT),Number(process.env.CRAWL_BATCH),process.env.CRAWL_PROFILE,Number(process.env.CRAWL_CHAIN_END??834));
const status=JSON.parse(await readFile('artifacts/discovery-campaign/status.json'));
if(status.completeDomains!==status.plannedDomains||status.batch!==a.batch)throw Error('Cannot advance incomplete batch');
const next=nextBatch(a);if(next===null){console.log('CHAIN_COMPLETE slot '+a.slot);process.exit(0);}
const repo=process.env.GITHUB_REPOSITORY,token=process.env.GH_TOKEN;
if(repo!=='HyperCriSiS/Sprachverstand'||!token)throw Error('Invalid repository dispatch context');
const headers={Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'};
const title=runTitle({...a,batch:next}),query=new URLSearchParams({branch:'X/diagnostic-runner-loadtest-20261019',per_page:'100'});
const list=await fetch(`https://api.github.com/repos/${repo}/actions/workflows/347993301/runs?${query}`,{headers,signal:AbortSignal.timeout(30000)});if(!list.ok)throw Error('Cannot check successor: HTTP '+list.status);
const existing=(await list.json()).workflow_runs.find(x=>x.display_title===title&&x.conclusion!=='cancelled');
if(existing){console.log('NEXT_BATCH_ALREADY_QUEUED '+existing.id);process.exit(0);}
await writeFile('artifacts/discovery-campaign/next-dispatch.json',JSON.stringify({slot:a.slot,batch:next,title,at:new Date().toISOString()}));
const response=await fetch(`https://api.github.com/repos/${repo}/actions/workflows/347993301/dispatches`,{method:'POST',headers,body:JSON.stringify({ref:'X/diagnostic-runner-loadtest-20261019',inputs:{slot:String(a.slot),batch:String(next),profile:a.profile,chain_end:String(a.end),resume_run:''}}),signal:AbortSignal.timeout(30000)});
if(response.status!==204)throw Error('Successor dispatch failed: HTTP '+response.status+'; inspect before retry');
console.log(`NEXT_BATCH_QUEUED slot ${a.slot} batch ${next}`);
