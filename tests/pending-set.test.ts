import {expect,it} from 'vitest';
import {PendingSet} from '../src/core/pending-set';
it('preserves a partially processed batch until explicitly deleted',()=>{
  const a={},b={};const set=new PendingSet([a,b]);
  expect(set.peek()).toBe(a);expect(set.peek()).toBe(a);
  set.delete(a);expect(set.peek()).toBe(b);
  set.delete(b);expect(set.peek()).toBeUndefined();
});
it('handles deletion, reinsertion and new work in FIFO order',()=>{
  const a={},b={},c={},d={};const set=new PendingSet([a,b,c]);
  expect(set.peek()).toBe(a);set.delete(a);set.add(a);set.delete(c);set.add(d);
  expect(set.peek()).toBe(b);set.delete(b);expect(set.peek()).toBe(a);
  set.delete(a);expect(set.peek()).toBe(d);set.delete(d);
  set.add(c);expect(set.peek()).toBe(c);
});
it('resets after clear even if the old first object is inserted again',()=>{
  const a={},b={};const set=new PendingSet([a]);expect(set.peek()).toBe(a);
  set.clear();set.add(b);set.add(a);expect(set.peek()).toBe(b);
  expect([...set]).toEqual([b,a]);
});
it('does not retain an exhausted iterator across empty-to-nonempty transitions',()=>{
  const a={},b={};const set=new PendingSet<object>();
  expect(set.peek()).toBeUndefined();set.add(a);expect(set.peek()).toBe(a);
  set.delete(a);set.add(b);expect(set.peek()).toBe(b);
});
it('matches a plain Set throughout mixed queue operations',()=>{
  const objects=Array.from({length:200},()=>({}));const expected=new Set<object>();const actual=new PendingSet<object>();
  for(let i=0;i<4000;i++){
    const object=objects[(i*37)%objects.length]!;
    if(i%113===0){expected.clear();actual.clear();}
    else if(i%3===0){expected.delete(object);actual.delete(object);}
    else {expected.add(object);actual.add(object);}
    expect(actual.peek()).toBe(expected.values().next().value);
    expect(actual.size).toBe(expected.size);
    if(i%7===0){const first=actual.peek();if(first){actual.delete(first);expected.delete(first);}}
  }
  expect([...actual]).toEqual([...expected]);
});
