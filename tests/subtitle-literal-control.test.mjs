import {afterEach,it,expect} from 'vitest';
import {installSubtitleLiteralControl,subtitleLiteralInstallationScript} from '../scripts/subtitle-literal-control.mjs';
afterEach(()=>{window.__stopSubtitleLiteralControl?.();document.body.replaceChildren();delete window.__stopSubtitleLiteralControl;delete window.__subtitleLiteralStats;});
it('corrects only known fixture targets and records actual extra writes',async()=>{
 document.body.innerHTML='<p id="static-target">Nutzer:innen</p><span id="subtitle-target">Nutzer:innen im Untertitel 0</span><div id="subtitle-load-control-root"><span id="normal">neutral</span></div><p id="outside">Nutzer:innen</p><code>Nutzer:innen</code><input value="Nutzer:innen">';
 expect(new Function(subtitleLiteralInstallationScript())()).toEqual({installed:true});
 const normal=document.getElementById('normal');normal.textContent='Nutzer:innen 1 / 2';
 document.getElementById('subtitle-target').textContent='Nutzer:innen im Untertitel 1';
 await new Promise(resolve=>setTimeout(resolve,0));
 expect(normal.textContent).toBe('Nutzer 1 / 2');expect(document.getElementById('subtitle-target').textContent).toBe('Nutzer im Untertitel 1');
 expect(document.getElementById('outside').textContent).toBe('Nutzer:innen');expect(document.querySelector('code').textContent).toBe('Nutzer:innen');expect(document.querySelector('input').value).toBe('Nutzer:innen');
 expect(window.__subtitleLiteralStats).toEqual({installed:true,normalWrites:1,cueWrites:2,staticWrites:1});
});
it('ignores unknown strings and repeated observer delivery of its own writes',async()=>{
 document.body.innerHTML='<span id="subtitle-target">unbekannt Nutzer:innen</span><div id="subtitle-load-control-root"><span id="normal">neutral</span></div>';
 installSubtitleLiteralControl();document.getElementById('normal').textContent='Nutzer:innen 4 / 5';
 await new Promise(resolve=>setTimeout(resolve,0));
 expect(window.__subtitleLiteralStats.normalWrites).toBe(1);expect(document.getElementById('subtitle-target').textContent).toBe('unbekannt Nutzer:innen');
});
