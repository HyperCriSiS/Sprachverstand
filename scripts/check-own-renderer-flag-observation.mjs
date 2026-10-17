import assert from 'node:assert/strict';
import {knownRendererFlags} from './own-renderer-flag-observation.mjs';
const result=knownRendererFlags('chrome\0--type=renderer\0--js-flags=--trace-opt --trace-file-names --jitless\0PRIVATE');
assert.equal(result.traceOpt,true);assert.equal(result.traceFileNames,true);assert.equal(result.jitless,true);
assert.ok(!JSON.stringify(result).includes('PRIVATE'));assert.equal(knownRendererFlags('chrome --type=renderer-not-real'),null);
assert.equal(knownRendererFlags('chrome --type=renderer --js-flags=--notrace-opt').traceOpt,false);
console.log('Known own-renderer flags only, NUL/space titles, exact token boundaries and private arguments omitted PASS.');
