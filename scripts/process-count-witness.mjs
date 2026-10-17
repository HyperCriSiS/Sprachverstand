import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const kinds=['browser','driver','crashpad'];
const stages=['before','after-smoke','after-interaction','after-video'];
const file='artifacts/video-predecessor/process-counts.json';
export function processCounts(text){
 const result=Object.fromEntries(kinds.map(kind=>[kind,{active:0,zombie:0}]));
 for(const line of text.split('\n')){
  const [name,state]=line.trim().split(/\s+/);
  const kind=['chrome','chromium','chromium-browse'].includes(name)?'browser':name==='chromedriver'?'driver':name==='chrome_crashpad'?'crashpad':null;
  if(!kind)continue;
  if(!/^[RSDTtZXIW][A-Za-z+<NsLl]*$/u.test(state??''))throw Error('Unknown browser process state');
  result[kind][state.startsWith('Z')?'zombie':'active']++;
 }
 return result;
}
export function validateWitness(input,condition){
 if(!['isolated','preceded'].includes(condition)||!Array.isArray(input))throw Error('Invalid witness condition');
 const expected=condition==='preceded'?stages:['before','after-video'];
 if(input.length!==expected.length)throw Error('Missing process witness stage');
 input.forEach((row,index)=>{
  if(Object.keys(row).sort().join()!==['stage',...kinds].sort().join()||row.stage!==expected[index])throw Error('Unexpected process witness fields or order');
  for(const kind of kinds){
   if(Object.keys(row[kind]).sort().join()!=='active,zombie')throw Error('Unexpected process count fields');
   for(const count of Object.values(row[kind]))if(!Number.isSafeInteger(count)||count<0||count>10000)throw Error('Invalid process count');
  }
 });
 return input;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const action=process.argv[2];
 if(action==='validate'){
  validateWitness(JSON.parse(fs.readFileSync(file,'utf8')),process.env.PREDECESSOR_CONDITION);
  if(process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,'present=true\n');
  console.log('Fixed process-count witness validated; no process identifiers exported.');
 }else{
  if(process.platform!=='linux'||!stages.includes(action))throw Error('Unsupported witness stage');
  const input=action==='before'?[]:JSON.parse(fs.readFileSync(file,'utf8'));
  if(action==='before'&&fs.existsSync(file))throw Error('Do not overwrite process evidence');
  const snapshot={stage:action,...processCounts(execFileSync('ps',['-eo','comm=,stat='],{encoding:'utf8',maxBuffer:1024*1024}))};
  input.push(snapshot);
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,JSON.stringify(input,null,2));
  console.log(JSON.stringify(snapshot));
 }
}
