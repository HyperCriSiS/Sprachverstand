import fs from 'node:fs';
import {parseProcStat,processKind,sampleOwnedProcesses} from './navigation-process-io-worker.mjs';

// Only the owned driver's unique direct Chrome child may prove these flags.
// Never export its argv, process identifiers or profile path.
export function verifyOwnedBrowserArguments(driverPid,withExtension,extensionDirectory,
  {io=fs,uid=process.getuid(),sample=sampleOwnedProcesses}={}) {
 let stage='driver';
 try {
  if(!Number.isSafeInteger(driverPid)||driverPid<1||typeof withExtension!=='boolean')throw Error();
  const stat=pid=>parseProcStat(String(io.readFileSync('/proc/'+pid+'/stat','utf8')));
  const owned=pid=>io.statSync('/proc/'+pid).uid===uid;
  const root=stat(driverPid);if(!root||!owned(driverPid))throw Error();
  stage='browser';
  const candidates=sample(driverPid,root.startToken,{io,uid}).records.filter(r=>r.kind==='browser'&&r.directDriverChild);
  if(candidates.length!==1)throw Error();
  const browser=candidates[0],before=stat(browser.pid),exe=io.readlinkSync('/proc/'+browser.pid+'/exe');
  stage='identity';
  if(!before||before.startToken!==browser.startToken||before.parent!==driverPid||!owned(browser.pid))throw Error();
  const raw=io.readFileSync('/proc/'+browser.pid+'/cmdline');if(!Buffer.isBuffer(raw)||raw.length===0||raw.length>262144||raw.at(-1)!==0)throw Error();
  const args=String(raw).split('\0').filter(Boolean);if(args.length===0)throw Error();
  const after=stat(browser.pid),rootAfter=stat(driverPid);
  if(after?.startToken!==before.startToken||after.parent!==driverPid||rootAfter?.startToken!==root.startToken||
    !owned(browser.pid)||!owned(driverPid)||io.readlinkSync('/proc/'+browser.pid+'/exe')!==exe||
    processKind(browser.pid,driverPid,args,exe,after.parent)!=='browser')throw Error();
  stage='compiler';
  if(args.some(arg=>/^--js-flags(?:=|$)/.test(arg)))throw Error();
  stage='extension';
  const loads=args.filter(arg=>arg.startsWith('--load-extension='));
  const exceptions=args.filter(arg=>arg.startsWith('--disable-extensions-except='));
  if(withExtension) {
   if(loads.length!==1||loads[0]!=='--load-extension='+extensionDirectory||
     exceptions.length!==1||exceptions[0]!=='--disable-extensions-except='+extensionDirectory)throw Error();
  } else if(loads.length||exceptions.length)throw Error();
  return {installationArgumentsVerified:true,extensionInstalled:withExtension,compilerArgumentsAbsent:true};
 } catch {throw Error('Owned browser argument verification failed ('+stage+').');}
}
