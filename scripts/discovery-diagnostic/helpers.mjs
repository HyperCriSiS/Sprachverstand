import {createRequire} from 'node:module';
const {getDomain}=createRequire(import.meta.url)('tldts');
export const policy={domains:2500,maxSubpages:50,workers:16,maxScrollMs:90000,maxScrollSteps:160,pauseMs:250,settleMs:600};
export function normalizeUrl(input,base,domain){
 try{const u=new URL(input,base);if(u.protocol!=='https:'||u.username||u.password||getDomain(u.hostname)!==domain)return null;
 if(/\.(?:pdf|zip|gz|jpg|jpeg|png|svg|gif|webp|mp4|mp3|docx?|xlsx?|pptx?|exe|ics|xml|json)$/i.test(u.pathname))return null;
 if(/(?:^|\/)(?:login|logout|signin|signout|wp-admin|wp-json|cart|warenkorb|checkout|search|suche|calendar|kalender|tag|tags|feed)(?:\/|$)/i.test(u.pathname))return null;
 u.hash='';for(const k of [...u.searchParams.keys()])if(/^(utm_|fbclid$|gclid$|session|sid$)/i.test(k))u.searchParams.delete(k);
 if([...u.searchParams.keys()].some(k=>!/^(?:id|p|page_id|article|tx_news_pi1\[news\])$/.test(k)))return null;
 return u.href;
 }catch{return null;}
}
export function scoreLink(link){
 let decoded;try{decoded=decodeURI(link.url);}catch{decoded=link.url;}const s=decoded.toLowerCase()+' '+(link.text??'').toLowerCase();let score=0;
 if(/artikel|article|news|aktuell|presse|magazin|blog|bericht|karriere|career|stellen|jobs|team|mitarbeiter|personen|veranstalt|event|beratung|angebot|forschung|projekt|publikation/.test(s))score+=8;
 if(link.inMain)score+=3;if((link.text??'').trim().length>=28)score+=2;
 if(/impressum|datenschutz|privacy|cookies?|kontakt|contact|barrierefrei|accessibility|newsletter|sitemap|archiv/.test(s))score-=20;
 if(/\/(?:en|fr|it|es)\//.test(s))score-=12;
 return score;
}
export function parseRobots(text){
 const groups=[];let current=null,hasRules=false;
 for(const line of text.split(/\r?\n/)){const m=line.replace(/#.*$/,'').trim().match(/^([\w-]+)\s*:\s*(.*)$/);if(!m)continue;const key=m[1].toLowerCase(),v=m[2].trim();
 if(key==='user-agent'){if(!current||hasRules){current={agents:[],rules:[],delay:0};groups.push(current);hasRules=false;}current.agents.push(v.toLowerCase());}
 else if(current){hasRules=true;if((key==='allow'||key==='disallow')&&v)current.rules.push({allow:key==='allow',path:v});if(key==='crawl-delay')current.delay=Math.max(current.delay,Number(v)||0);}}
 const own=groups.filter(x=>x.agents.some(a=>a!=='*'&&'sprachverstandresearch'.includes(a)));
 const chosen=own.length?own:groups.filter(x=>x.agents.includes('*'));
 return {rules:chosen.flatMap(x=>x.rules),delay:Math.max(1,...chosen.map(x=>x.delay))};
}
export function robotsAllows(robots,url){
 const u=new URL(url),target=u.pathname+u.search;let winner=null;
 for(const rule of robots.rules){let p=rule.path;const end=p.endsWith('$');if(end)p=p.slice(0,-1);const parts=p.split('*');let matches=target.startsWith(parts[0]),cursor=parts[0].length;
 if(parts.length===1&&end)matches=target===p;
 for(let i=1;matches&&i<parts.length;i++){const part=parts[i];const at=end&&i===parts.length-1?(target.endsWith(part)?target.length-part.length:-1):target.indexOf(part,cursor);if(at<cursor)matches=false;else cursor=at+part.length;}
 if(matches){const length=p.replaceAll('*','').length;if(!winner||length>winner.length||(length===winner.length&&rule.allow))winner={length,allow:rule.allow};}}
 return winner?.allow??true;
}
// Runs inside Chromium; do not close over Node bindings.
export function browserEvidence(viewportOnly){
 const words=/((?<![\p{L}\p{N}])\p{Lu}[\p{L}\p{M}’'-]*?(?:[:*_·•]innen|[:*_·•]in|\/-?innen|\/-?in|\(-?innen\)|\(in\)|\p{Ll}Innen)(?![\p{L}\p{N}]))/gu;
 const excluded='script,style,noscript,template,textarea,input,select,option,code,pre,kbd,samp,var,svg,math,canvas,iframe,object,embed,[hidden],[aria-hidden="true"],[data-sprachverstand-ignore],[contenteditable=""],[contenteditable="true"],[contenteditable="plaintext-only"],[role="textbox"],[role="searchbox"],[role="combobox"],[role="spinbutton"]';
 const evidence=[],root=document.body;if(!root)return {evidence,links:[],height:0,y:0,viewport:innerHeight,title:document.title,url:location.href};
 const selector=el=>{const parts=[];for(let e=el;e&&parts.length<7;e=e.parentElement){if(e.id){parts.unshift('#'+CSS.escape(e.id));break;}let n=1;for(let p=e.previousElementSibling;p;p=p.previousElementSibling)if(p.tagName===e.tagName)n++;parts.unshift(e.tagName.toLowerCase()+':nth-of-type('+n+')');}return parts.join(' > ');};
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
 while(walker.nextNode()&&evidence.length<1000){const node=walker.currentNode,el=node.parentElement;if(!el||el.closest(excluded))continue;
 const matches=[...node.data.matchAll(words)];if(!matches.length)continue;
 if(!el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}))continue;
 const path=selector(el);let nodeIndex=0;for(let n=node.previousSibling;n;n=n.previousSibling)nodeIndex++;
 for(const m of matches){const range=document.createRange();range.setStart(node,m.index);range.setEnd(node,m.index+m[0].length);const rects=[...range.getClientRects()];
 const usableRects=rects.filter(r=>{for(let a=el;a&&a!==document.body&&a!==document.documentElement;a=a.parentElement){const cs=getComputedStyle(a),box=a.getBoundingClientRect();if(/hidden|clip|scroll|auto/.test(cs.overflowY)&&(r.bottom<=box.top||r.top>=box.bottom))return false;if(/hidden|clip|scroll|auto/.test(cs.overflowX)&&(r.right<=box.left||r.left>=box.right))return false;}return true;});
 if(!usableRects.length||viewportOnly&&!usableRects.some(r=>r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth))continue;
 const block=el.closest('p,li,td,th,figcaption,h1,h2,h3,h4,div')??el;const text=(block.textContent??'').replace(/\s+/g,' ').trim();const ix=text.indexOf(m[0]);const context=text.slice(Math.max(0,ix-180),Math.max(0,ix-180)+550);
 evidence.push({key:path+'|'+nodeIndex+'|'+m.index+'|'+m[0],word:m[0],context,selector:path,visible:true,viewportY:scrollY});}}
 const links=[...document.querySelectorAll('a[href]')].slice(0,3000).map(a=>({url:a.href,text:(a.innerText||a.textContent||'').replace(/\s+/g,' ').trim().slice(0,160),inMain:!!a.closest('main,article,[role="main"]')}));
 return {evidence,links,height:Math.max(document.documentElement.scrollHeight,root.scrollHeight),y:scrollY,viewport:innerHeight,title:document.title,url:location.href,textLength:root.innerText.length};
}
export async function observePage(sessionId,{execute,sleep},options=policy){
 const started=Date.now(),seen=new Map();let steps=0,reason='bottom',lastHeight=0,growth=0,snapshot;
 await execute(sessionId,'window.scrollTo(0,0);return true;');await sleep(options.settleMs);
 while(true){snapshot=await execute(sessionId,'return ('+browserEvidence.toString()+')(true);');for(const x of snapshot.evidence)seen.set(x.key,x);
 if(Date.now()-started>=options.maxScrollMs){reason='time-limit';break;}if(steps>=options.maxScrollSteps){reason='step-limit';break;}
 const bottom=snapshot.y+snapshot.viewport>=snapshot.height-4;
 if(bottom){await sleep(options.settleMs);const next=await execute(sessionId,'return Math.max(document.documentElement.scrollHeight,document.body.scrollHeight);');if(next<=snapshot.height+4)break;if(++growth>=8){reason='growth-limit';break;}}
 if(lastHeight&&snapshot.height>lastHeight+snapshot.viewport)growth++;lastHeight=snapshot.height;
 await execute(sessionId,'window.scrollTo(0,arguments[0]);return true;',[Math.min(snapshot.height,snapshot.y+Math.max(200,Math.floor(snapshot.viewport*.75)))]);await sleep(options.pauseMs);steps++;
 }
 await execute(sessionId,'window.scrollTo(0,0);return true;');
 return {scroll:{steps,reason,elapsedMs:Date.now()-started,lastHeight:snapshot?.height,growthEvents:growth},observed:[...seen.values()]};
}
export async function finishObservation(sessionId,observation,{execute}){
 const final=await execute(sessionId,'return ('+browserEvidence.toString()+')(false);');
 const keys=new Set(final.evidence.map(x=>x.key));
 return {...observation,final,observedOnly:observation.observed.filter(x=>!keys.has(x.key)).map(x=>({...x,status:'Während des Scrollens beobachtet; im abschließenden DOM nicht mehr vorhanden. Kein bestätigter Restfehler.'}))};
}
