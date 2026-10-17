import {test} from 'node:test';
import assert from 'node:assert/strict';
import {matchesOwnedRenderer} from './system-cache-renderer-match.mjs';
test('accepts both NUL separated arguments and rewritten space separated process titles',()=>{
 for(const text of ['chrome\0--type=renderer\0--other','chrome --type=renderer --other','--type=renderer'])assert.equal(matchesOwnedRenderer(text,'chrome').argumentMatch,true);
 for(const text of ['chrome --type=renderer-helper','--other=--type=renderer',null])assert.equal(matchesOwnedRenderer(text,'chrome').argumentMatch,false);
 assert.equal(matchesOwnedRenderer(null,'CrRendererMain').commMatch,true);
});
