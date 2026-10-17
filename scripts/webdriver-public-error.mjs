const codes=new Set(['timeout','unknown error','session not created','invalid session id','no such window','no such element','unsupported operation','invalid argument','unknown command','javascript error']);
const routes=new Set(['url','execute/sync','execute/async','goog/cdp/execute','window','window/rect','timeouts','moz/addon/install','frame']);
export function formatWebDriverFailure(method,pathname,payload) {
 const verb=['GET','POST','DELETE'].includes(method)?method:'OTHER';
 let route=pathname==='/status'?'/status':pathname==='/session'?'/session':'/<other>';
 if(typeof pathname==='string'&&pathname.startsWith('/session/')) {
  const suffix=pathname.split('/').slice(3).join('/');
  route='/session/:session'+(suffix?'/'+(routes.has(suffix)?suffix:'<other>'):'');
 }
 const error=payload?.value?.error,code=codes.has(error)?error:'unknown error';
 const match=typeof payload?.value?.message==='string'?payload.value.message.match(/Timed out receiving message from renderer:\s*(\d{1,5}(?:\.\d{1,3})?)(?:\s|$)/):null;
 const wait=match?'; renderer timeout '+Number(match[1])+'s':'';
 return 'WebDriver '+verb+' '+route+' failed ('+code+wait+').';
}
