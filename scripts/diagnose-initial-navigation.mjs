import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn,spawnSync} from 'node:child_process';
import {once} from 'node:events';
import {fetchWebdriverResponse} from './webdriver-response.mjs';
import {NavigationStartObserver,connectNavigationObserver,resolveNavigationExecutable} from './navigation-start-observer.mjs';

const root=process.cwd();
const output=path.resolve(process.env.NAVIGATION_ARTIFACTS_DIR??'artifacts/navigation-start');
assert.ok(output.startsWith(path.join(root,'artifacts')+path.sep));
assert.ok(!fs.existsSync(output),'Never overwrite an existing diagnostic run');
fs.mkdirSync(output,{recursive:true});
const fixture=fs.readFileSync(path.join(root,'tests/browser/extension-smoke.html'));
const extension=path.join(root,'dist/chromium');
assert.ok(fs.existsSync(path.join(extension,'manifest.json')));
const executable=(env,names)=>{
 if(process.env[env])return resolveNavigationExecutable(process.env[env],names[0]+(process.platform==='win32'?'.exe':''));
 for(const name of names){const result=spawnSync('which',[name],{encoding:'utf8'});if(result.status===0)return result.stdout.trim();}
 throw new Error('Required local browser executable missing');
};
const binary=executable('CHROMIUM_BIN',['chromium','chromium-browser']);
const driverBinary=executable('CHROMEWEBDRIVER',['chromedriver']);
console.log(JSON.stringify({preflight:true,configuredDriverIsDirectory:!!process.env.CHROMEWEBDRIVER&&fs.statSync(process.env.CHROMEWEBDRIVER).isDirectory(),resolvedDriverIsFile:fs.statSync(driverBinary).isFile()}));
const port=Number(process.env.WEBDRIVER_PORT??9515);
assert.ok(Number.isSafeInteger(port)&&port>0&&port<65536);
const base=`http://127.0.0.1:${port}`;
const request=async(method,url,body,deadline=45000)=>{
 const response=await fetchWebdriverResponse(base+url,{method,headers:{'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)},deadline);
 const payload=JSON.parse(response.text);
 if(!response.ok||payload.value?.error){
  const timeout=payload.value?.error==='timeout';
  const rendererTimeout=timeout&&/Timed out receiving message from renderer/u.test(payload.value.message??'');
  const error=new Error(rendererTimeout?'renderer-timeout':timeout?'webdriver-timeout':'webdriver-command-failed');
  error.diagnosticKind=error.message;throw error;
 }
 return payload.value;
};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const validate=process.argv.includes('--validate-observer');
const roles=validate?['baseline']:['extension','baseline','baseline','extension','extension','baseline'];
const results=[];
for(const [ordinal,role] of roles.entries()){
 let session,connection,observer,sessionDeleted=false;
 const server=createServer((req,res)=>{
  if(req.url==='/extension-smoke.html'){
   observer?.served();res.on('finish',()=>observer?.finished());
   res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});
   res.end(validate?Buffer.concat([fixture,Buffer.from('<img src="/slow-validation-only">')]):fixture);
  }else if(validate&&req.url==='/slow-validation-only'){
   setTimeout(()=>{res.writeHead(200,{'content-type':'image/svg+xml'});res.end('<svg xmlns="http://www.w3.org/2000/svg"/>');},1500);
  }else{res.writeHead(404);res.end();}
 });
 server.listen(0,'127.0.0.1');await once(server,'listening');
 const fixtureUrl=`http://127.0.0.1:${server.address().port}/extension-smoke.html`;
 observer=new NavigationStartObserver(fixtureUrl);
 const driver=spawn(driverBinary,[`--port=${port}`],{stdio:['ignore','ignore','ignore'],windowsHide:true});
 let spawnFailed=false;driver.once('error',()=>{spawnFailed=true;});
 const row={ordinal,role,validationOnly:validate,pageLoadLimitMs:validate?500:30000};
 try{
  let ready=false;for(let i=0;i<100;i++){
   if(spawnFailed||driver.exitCode!==null)throw new Error('Own driver failed before startup');
   try{await request('GET','/status',undefined,1000);ready=true;break;}catch{await sleep(100);}
  }assert.ok(ready,'Own driver startup deadline');
  const args=['--headless=new','--no-sandbox','--disable-dev-shm-usage','--no-first-run','--disable-default-apps'];
  if(role==='extension')args.push(`--disable-extensions-except=${extension}`,`--load-extension=${extension}`);
  else args.push('--disable-extensions');
  const response=await request('POST','/session',{capabilities:{alwaysMatch:{browserName:'chrome',timeouts:{pageLoad:row.pageLoadLimitMs},'goog:chromeOptions':{binary,args}}}});
  session=response.sessionId;
  row.browserVersion=response.capabilities.browserVersion;
  assert.match(row.browserVersion,validate?/^155\.0\.8059\.(0|39)$/u:/^155\.0\.8059\.0$/u,'Keep the failing Linux browser version fixed outside instrument validation');
  connection=await connectNavigationObserver(response.capabilities['goog:chromeOptions']?.debuggerAddress,observer);
  const before=performance.now();
  try{await request('POST',`/session/${session}/url`,{url:fixtureUrl});row.navigationOutcome='completed';}
  catch(error){row.navigationOutcome=error.diagnosticKind??'transport-deadline';}
  row.navigationElapsedMs=performance.now()-before;
  try{
   const end=performance.now()+5000;
   do{
    row.independentSnapshot=await connection.snapshot();
    const s=row.independentSnapshot;
    if(role==='baseline'?s.dynamicOriginal:s.staticCorrect&&s.dynamicCorrect)break;
    await sleep(25);
   }while(performance.now()<end);
  }catch{row.independentSnapshot={unavailable:true};}
  if(validate){
   assert.ok(['renderer-timeout','webdriver-timeout'].includes(row.navigationOutcome),'Injected validation delay must exercise navigation timeout');
   assert.equal(row.independentSnapshot.staticOriginal,true);
   assert.equal(row.independentSnapshot.protected,true);
   assert.ok(observer.summary().events.some(e=>e.event==='fixture-http-response-finished'));
   assert.ok(observer.summary().events.some(e=>e.event==='fixture-main-frame-navigated'));
  }
  const s=row.independentSnapshot;
  row.expectedTextsConfirmed=!!(s.protected&&(role==='baseline'?s.staticOriginal&&s.dynamicOriginal:s.staticCorrect&&s.dynamicCorrect));
  row.witness=observer.summary();
  results.push(row);
  console.log(JSON.stringify(row));
 }finally{
  connection?.close();
  if(session)try{await request('DELETE',`/session/${session}`,undefined,35000);sessionDeleted=true;}catch{}
  if(driver.exitCode===null&&!spawnFailed){const exited=once(driver,'exit');driver.kill();await exited;}
  server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
  row.cleanup={sessionDeleted,driverStopped:driver.exitCode!==null||driver.signalCode!==null,loopbackClosed:!server.listening};
  if(results.includes(row))fs.writeFileSync(path.join(output,'navigation-summary.json'),JSON.stringify({validationOnly:validate,rows:results,observerEnabled:true,rawProtocolExported:false,profilesExported:false,sessionIdentifiersExported:false,traceEnabled:false},null,2));
 }
 assert.ok(sessionDeleted,'Stop before another comparison if own browser session cleanup failed');
}
assert.equal(results.length,roles.length);
if(!validate)assert.ok(results.every(row=>row.navigationOutcome==='completed'&&row.expectedTextsConfirmed),'Navigation or fixture assertion failed; retain counterevidence');
