import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {NavigationStartObserver,resolveNavigationExecutable} from './navigation-start-observer.mjs';
const url = 'http://127.0.0.1:1234/extension-smoke.html';
test('resolves a runner-provided executable directory and an explicit executable file', () => {
  const prefix=path.join(os.tmpdir(),'sprachverstand-navigation-executable-');
  const directory=fs.mkdtempSync(prefix);
  try {
    const file=path.join(directory,'chromedriver');fs.writeFileSync(file,'synthetic test only');
    assert.equal(resolveNavigationExecutable(directory,'chromedriver'),file);
    assert.equal(resolveNavigationExecutable(file,'chromedriver'),file);
    assert.equal(resolveNavigationExecutable(undefined,'chromedriver',()=>file),file);
    assert.throws(()=>resolveNavigationExecutable(directory,'missing-driver'));
  } finally {
    assert.ok(path.resolve(directory).startsWith(path.resolve(prefix)));
    fs.rmSync(directory,{recursive:true,force:true});
  }
});
test('exports only own fixture milestones, never protocol URLs, IDs or payloads', () => {
  let time = 10;
  const observer = new NavigationStartObserver(url, () => time++);
  observer.protocol({method:'Page.loadEventFired',params:{secret:'PRIVATE'}});
  observer.protocol({method:'Network.responseReceived',params:{response:{url:'https://private.invalid/PRIVATE',status:200}}});
  observer.protocol({method:'Page.frameNavigated',params:{frame:{url,parentId:'PRIVATE'}}});
  observer.protocol({method:'Page.domContentEventFired'});
  assert.equal(observer.summary().events.length,0);
  observer.served();observer.finished();
  observer.protocol({method:'Network.requestWillBeSent',params:{requestId:'PRIVATE',request:{url,headers:{Authorization:'PRIVATE'}}}});
  observer.protocol({method:'Network.responseReceived',params:{response:{url,status:200,body:'PRIVATE'}}});
  observer.protocol({method:'Page.frameNavigated',params:{frame:{url,id:'PRIVATE'}}});
  observer.protocol({method:'Page.domContentEventFired',params:{timestamp:999}});
  observer.protocol({method:'Page.loadEventFired',params:{timestamp:999}});
  assert.deepEqual(observer.summary().events.map(x=>x.event),['fixture-http-request','fixture-http-response-finished','fixture-network-request','fixture-network-response','fixture-main-frame-navigated','fixture-dom-content-loaded','fixture-load-event']);
  const serialized=JSON.stringify(observer.summary());
  assert.ok(!serialized.includes('PRIVATE')&&!serialized.includes(url)&&!serialized.includes('999'));
});
test('bounds events and rejects foreign fixture origins', () => {
  assert.throws(()=>new NavigationStartObserver('https://example.com/extension-smoke.html'));
  const observer=new NavigationStartObserver(url);
  for(let i=0;i<1000;i++)observer.served();
  assert.equal(observer.summary().events.length,256);assert.equal(observer.summary().truncated,true);
});
