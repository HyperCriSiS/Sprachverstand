import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chooseNext,recordCrash,validateState} from './campaign-state.mjs';
const fresh=()=>({id:1,domain:'example.de',url:'https://example.de/',status:'pending',visited:[],queue:[],complete:false});
test('Crash resumes the inflight URL, then records a bounded terminal failure',()=>{const s=fresh();s.inflight=chooseNext(s);recordCrash(s,'crash');assert.equal(s.visited.length,0);assert.equal(chooseNext(s).url,s.url);recordCrash(s,'crash');assert.equal(s.visited.length,1);assert.equal(s.visited[0].workerFailure,true);assert.equal(chooseNext(s),null);});
test('Fifty subpages is a hard limit; known URLs are not revisited',()=>{const s=fresh();s.status='root-complete';s.visited=[{url:s.url}];s.queue=[{url:s.url},{url:'https://example.de/news'}];assert.equal(chooseNext(s).url,s.queue[1].url);s.visited=Array.from({length:51},(_,i)=>({url:s.url+i}));assert.equal(chooseNext(s),null);});
test('Access-blocked or robots-skipped domains cannot spawn follow-up pages',()=>{for(const status of ['access-blocked','robots-skipped']){const s=fresh();s.status=status;s.queue=[{url:'https://example.de/news'}];assert.equal(chooseNext(s),null);}});
test('Mismatched or duplicate resume state is rejected',()=>{const s=fresh();assert.equal(validateState(s,s),s);assert.throws(()=>validateState(s,{...s,id:2}));s.visited=[{url:s.url},{url:s.url}];assert.throws(()=>validateState(s,s));});
