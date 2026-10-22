import {expect,it} from 'vitest';
import {PendingMap} from '../src/core/pending-map';
it('keeps a partial batch first and reads replacements of its value',()=>{
 const a={},b={};const map=new PendingMap([[a,1],[b,2]]);
 expect(map.peek()).toEqual([a,1]);map.set(a,3);expect(map.peek()).toEqual([a,3]);
 map.delete(a);expect(map.peek()).toEqual([b,2]);
});
it('moves deleted and reinserted keys behind already pending work',()=>{
 const a={},b={};const map=new PendingMap([[a,1],[b,2]]);map.peek();map.delete(a);map.set(a,3);
 expect(map.peek()).toEqual([b,2]);map.delete(b);expect(map.peek()).toEqual([a,3]);
});
it('resets after clear, complete draining and an empty peek',()=>{
 const a={},b={};const map=new PendingMap([[a,1]]);map.peek();map.clear();map.set(b,2);map.set(a,3);
 expect(map.peek()).toEqual([b,2]);map.delete(b);map.delete(a);expect(map.peek()).toBeUndefined();
 map.set(a,4);expect(map.peek()).toEqual([a,4]);
});
it('preserves entries with an undefined value',()=>{
 const key={};const map=new PendingMap<object,undefined>([[key,undefined]]);
 expect(map.peek()).toEqual([key,undefined]);map.delete(key);expect(map.peek()).toBeUndefined();
});
it('matches a plain Map through updates, deletion, clear and reinsertion',()=>{
 const keys=Array.from({length:200},()=>({})),reference=new Map<object,number>(),actual=new PendingMap<object,number>();
 for(let i=0;i<4000;i++){
  const key=keys[(i*37)%keys.length]!;
  if(i%113===0){reference.clear();actual.clear();}
  else if(i%3===0){reference.delete(key);actual.delete(key);}
  else{reference.set(key,i);actual.set(key,i);}
  expect(actual.peek()).toEqual(reference.entries().next().value);expect(actual.size).toBe(reference.size);
  if(i%7===0){const first=actual.peek();if(first){actual.delete(first[0]);reference.delete(first[0]);}}
 }
 expect([...actual]).toEqual([...reference]);
});
