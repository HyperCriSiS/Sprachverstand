const exited=child=>child.exitCode!==null||child.signalCode!==null;
export async function stopOwnedChild(child,timeoutMs=2000){
 if(exited(child))return;
 const attempt=signal=>new Promise(resolve=>{
  const done=value=>{clearTimeout(timer);child.removeListener('exit',onExit);resolve(value);};
  const onExit=()=>done(true);const timer=setTimeout(()=>done(false),timeoutMs);
  child.once('exit',onExit);try{child.kill(signal);}catch{done(exited(child));}
  if(exited(child))done(true);
 });
 if(await attempt('SIGTERM')||exited(child))return;
 await attempt('SIGKILL');if(!exited(child))throw Error('Owned child did not exit within bounded waits');
}
