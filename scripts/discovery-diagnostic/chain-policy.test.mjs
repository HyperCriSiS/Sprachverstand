import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assignment,nextBatch,runTitle} from './chain-policy.mjs';
test('Eighteen disjoint finite chains cover exactly the remaining 402 batches',()=>{const all=[];for(let slot=0;slot<18;slot++){let batch=433+slot;while(batch!==null){all.push(batch);batch=nextBatch({slot,batch,profile:'full',end:834});}}assert.equal(all.length,402);assert.equal(new Set(all).size,402);assert.deepEqual(all.sort((a,b)=>a-b),Array.from({length:402},(_,i)=>i+433));});
test('Reject foreign slots, escaped batch assignments and enlarged scope',()=>{for(const args of [[18,451],[-1,432],[0,434],[0,415],[0,847],[0,433,'full',900],[0,433,'full',451]])assert.throws(()=>assignment(...args));});
test('Canary has a finite two-job boundary and separate identity',()=>{assert.equal(nextBatch({slot:0,batch:433,profile:'canary',end:451}),451);assert.equal(nextBatch({slot:0,batch:451,profile:'canary',end:451}),null);assert.notEqual(runTitle({slot:0,batch:433,profile:'canary'}),runTitle({slot:0,batch:433,profile:'full'}));});
