import assert from 'node:assert/strict';import {EventEmitter} from 'node:events';import {stopOwnedChild} from './stop-owned-child.mjs';
function fake(mode){const child=new EventEmitter();child.exitCode=null;child.signalCode=null;child.calls=[];child.kill=signal=>{child.calls.push(signal);if(mode==='exit'||(mode==='kill-only'&&signal==='SIGKILL')){child.signalCode=signal;child.emit('exit',null,signal);}return true;};return child;}
const signalled=fake('stuck');signalled.signalCode='SIGTERM';await stopOwnedChild(signalled,2);assert.equal(signalled.calls.length,0);
const normal=fake('exit');await stopOwnedChild(normal,2);assert.deepEqual(normal.calls,['SIGTERM']);assert.equal(normal.listenerCount('exit'),0);
const kill=fake('kill-only');await stopOwnedChild(kill,2);assert.deepEqual(kill.calls,['SIGTERM','SIGKILL']);assert.equal(kill.listenerCount('exit'),0);
const stuck=fake('stuck');await assert.rejects(stopOwnedChild(stuck,2));assert.equal(stuck.listenerCount('exit'),0);
console.log('Owned child exit: already signalled, synchronous exit, escalation and bounded failure verified.');
