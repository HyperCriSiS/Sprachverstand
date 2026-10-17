import assert from 'node:assert/strict';
import {verifyOwnedBrowserArguments} from './owned-browser-arguments.mjs';
const secret='PRIVATE_MUST_NOT_EXPORT';
function fixture(args) {
 const state={root:'100',browser:'200',parent:10,uid:4,args,exe:'/opt/chromium/chromium',extra:[],mutate:undefined};
 const stat=(parent,token)=>{const f=Array(20).fill('0');f[0]='S';f[1]=String(parent);f[19]=token;return '1 (synthetic) '+f.join(' ');};
 const io={statSync:()=>({uid:state.uid}),readlinkSync:()=>state.exe,readFileSync:file=>{
  if(file==='/proc/10/stat')return stat(1,state.root);
  if(file==='/proc/11/stat')return stat(state.parent,state.browser);
  if(file==='/proc/11/cmdline'){const raw=Buffer.from(state.args.join('\0')+'\0');state.mutate?.();return raw;}
  throw Error(secret);
 }};
 const sample=()=>({records:[{pid:11,startToken:'200',kind:'browser',directDriverChild:true},...state.extra]});
 return {state,options:{io,uid:4,sample}};
}
let f=fixture(['chromium','--headless=new']);
assert.deepEqual(verifyOwnedBrowserArguments(10,false,'/fixture',f.options),{installationArgumentsVerified:true,extensionInstalled:false,compilerArgumentsAbsent:true});
f=fixture(['chromium','--load-extension=/fixture','--disable-extensions-except=/fixture']);
assert.equal(verifyOwnedBrowserArguments(10,true,'/fixture',f.options).extensionInstalled,true);
for(const mutate of [
 s=>s.uid=5,s=>s.parent=99,s=>s.browser='201',
 s=>s.extra.push({pid:12,startToken:'300',kind:'browser',directDriverChild:true}),
 s=>s.exe='/private/not-a-browser',s=>s.args.push('--type=renderer'),
 s=>s.args.push('--js-flags=--no-concurrent-recompilation'),
 s=>s.args.push('--load-extension=/'+secret),s=>s.args.push('--disable-extensions-except=/'+secret),
 s=>s.mutate=()=>s.browser='201',s=>s.mutate=()=>s.root='101',
 s=>s.mutate=()=>s.exe='/private/'+secret
]) {
 const bad=fixture(['chromium']);mutate(bad.state);
 assert.throws(()=>verifyOwnedBrowserArguments(10,false,'/fixture',bad.options),error=>
  error.message.startsWith('Owned browser argument verification failed')&&!error.message.includes(secret));
}
f=fixture(['chromium','--load-extension=/fixture']);
assert.throws(()=>verifyOwnedBrowserArguments(10,true,'/fixture',f.options),/extension/);
f=fixture(['chromium','--load-extension=/fixture','--load-extension=/other','--disable-extensions-except=/fixture']);
assert.throws(()=>verifyOwnedBrowserArguments(10,true,'/fixture',f.options),/extension/);
console.log('Owned direct browser UID/start-token/parent/executable/argv guards PASS; ambiguity, renderer, compiler flags, stale identities and private diagnostics rejected.');
import {formatWebDriverFailure} from './webdriver-public-error.mjs';
const message=formatWebDriverFailure('POST','/session/'+secret+'/goog/cdp/execute',{value:{error:'timeout',message:'Timed out receiving message from renderer: 20.000\n'+secret,stacktrace:secret}});
assert.equal(message,'WebDriver POST /session/:session/goog/cdp/execute failed (timeout; renderer timeout 20s).');
assert.ok(!message.includes(secret));
assert.ok(!formatWebDriverFailure('POST','/session/'+secret+'/'+secret,{value:{error:secret,message:secret,stacktrace:secret}}).includes(secret));
console.log('Public controller errors retain route/error class and renderer wait; session IDs, raw payloads and browser stacks refused.');
f=fixture([]);assert.throws(()=>verifyOwnedBrowserArguments(10,false,'/fixture',f.options),/identity/);
f=fixture(['chromium']);const originalRead=f.options.io.readFileSync;f.options.io.readFileSync=file=>file.endsWith('/cmdline')?Buffer.from('chromium --load-extension=PRIVATE'):originalRead(file);
assert.throws(()=>verifyOwnedBrowserArguments(10,false,'/fixture',f.options),/identity/);
console.log('Missing or unterminated argv is unknown and refused, never interpreted as absent extensions.');
