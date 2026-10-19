import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {runSiteMode,stopDriver,driverProcess} from '../../artifacts/discovery-probe/browser-library.mjs';
const phase=process.env.DISCOVERY_PHASE,worker=Number(process.env.DISCOVERY_WORKER),count=Number(process.env.DISCOVERY_WORKERS);
if(!['serial','parallel'].includes(phase)||!Number.isInteger(worker)||worker<0||worker>=count)throw new Error('Invalid worker assignment');
const all=JSON.parse(await readFile('config/discovery-runner-probe.json','utf8'));
const sites=all.filter((_,i)=>i%count===worker),dir='artifacts/discovery-probe/'+phase;
await mkdir(dir,{recursive:true});const results=[];
try{
 for(const site of sites){
  console.log(`${phase}/${worker}: ${site.id} ${site.slug}`);
  const baseline=await runSiteMode(site,'baseline',0),extension=await runSiteMode(site,'extension',0);
  results.push({...site,baseline,extension});
  await writeFile(dir+'/worker-'+worker+'.json.tmp',JSON.stringify(results));
  const {rename}=await import('node:fs/promises');await rename(dir+'/worker-'+worker+'.json.tmp',dir+'/worker-'+worker+'.json');
  if(driverProcess.exitCode!==null)throw new Error('WebDriver exited unexpectedly');
 }
}finally{await stopDriver(driverProcess);}
