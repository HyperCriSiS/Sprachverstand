import {spawnSync} from 'node:child_process';
export function probeOwnedPageCache(filename,offset,expected,helper,spawn=spawnSync){
 if(filename!==expected)return undefined;
 if(!/^0x[0-9a-f]+$/i.test(offset))return {status:'unavailable',reason:'invalid-offset',contentsRead:false};
 const before=Date.now(),result=spawn(helper,[filename,offset],{encoding:'utf8',timeout:200,maxBuffer:1024,windowsHide:true}),value=result.stdout?.trim();
 return {status:result.status===0&&/^[01]$/.test(value)?'sampled':'unavailable',...(result.status===0&&/^[01]$/.test(value)?{resident:value==='1'}:{reason:result.error?.code==='ETIMEDOUT'?'timeout':'probe-failed'}),probeWallMs:Date.now()-before,contentsRead:false};
}
