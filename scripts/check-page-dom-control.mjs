import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {Script} from 'node:vm';
const source=readFileSync('artifacts/page-dom-control.js','utf8');
const metadata=JSON.parse(readFileSync('artifacts/page-dom-control.metafile.json','utf8'));
for(const forbidden of ['src/background.ts','src/browser/api.ts','src/browser/local-transform.ts','src/rules/person-lexicon.ts'])assert.ok(!(forbidden in metadata.inputs),'Unexpected full-extension dependency');
const runner=readFileSync('scripts/system-io-runner.mjs','utf8');
const fixtureSource=runner.slice(runner.indexOf('function fixtureHtml() {'),runner.indexOf('function subtitleFixtureHtml() {'));
const fixture=new Function('diagnosticFps','browserTrace','mainTaskDiagnostics','renderSchedulingDiagnostics','observationMs',fixtureSource+'; return fixtureHtml();')(60,true,false,false,8000);
const start=runner.indexOf('  const plainHtml=fixtureHtml();'),end=runner.indexOf('  const subtitles =',start);
assert.ok(start>0&&end>start);
const controlled=new Function('fixtureHtml','pageDomBundle','Buffer',runner.slice(start,end)+'; return controlledHtml;')(()=>fixture,source,Buffer).toString('utf8');
const parsed=new JSDOM(controlled);
for(const script of parsed.window.document.scripts)new Script(script.textContent);
assert.equal(parsed.window.document.scripts.length,2);parsed.window.close();
const dom=new JSDOM('<body><p id="normal">Nutzer:innen</p><code>Nutzer:innen</code><input value="Nutzer:innen"><div id="dynamic"></div></body>',{runScripts:'outside-only',pretendToBeVisual:true});
try{
 dom.window.eval(source);dom.window.__startPageDomControl();
 const root=dom.window.document.querySelector('#dynamic');
 for(let i=0;i<480;i++){const span=dom.window.document.createElement('span');span.textContent='Nutzer:innen '+i;root.append(span);}
 const wait=async condition=>{const deadline=Date.now()+6000;while(!condition()){if(Date.now()>deadline)throw Error('Control completion timeout');await new Promise(resolve=>setTimeout(resolve,10));}};
 await wait(()=>root.children.length===480&&[...root.children].every((node,i)=>node.textContent==='Nutzer '+i));
 assert.equal(dom.window.document.querySelector('#normal').textContent,'Nutzer');
 assert.equal(dom.window.document.querySelector('code').textContent,'Nutzer:innen');
 assert.equal(dom.window.document.querySelector('input').value,'Nutzer:innen');
 assert.equal(dom.window.__pageDomControlStats.started,true);
 assert.ok(dom.window.__pageDomControlStats.requests>0);
 await dom.window.__stopPageDomControl();
 assert.equal(dom.window.document.querySelector('#normal').textContent,'Nutzer:innen');
 assert.ok([...root.children].every((node,i)=>node.textContent==='Nutzer:innen '+i));
 console.log('Real page DOM processor: 480 corrections, protected code/input and full restore passed; no extension API needed.');
}finally{dom.window.close();}
